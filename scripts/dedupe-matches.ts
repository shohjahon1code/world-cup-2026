// Dublikat Match yozuvlarini tozalash.
//
// Sabab: externalId formati o'zgargani uchun (eski: of-{date}-{home}-{away}-{idx},
// of-{date}-{home}-{away}-{idx}, yangi: of-{num} / of-g-{date}-{home}-{away})
// har xil sync runlar duplicat yaratib qo'ygan.
//
// Bu skript:
//   - Har (homeTeam, awayTeam, kickoff-kuni) bo'yicha guruhlab dublikatlarni topadi
//   - "Keep" qilib taxminlari bor yozuvni tanlaydi (agar yo'q bo'lsa eng eski yozuvni)
//   - Boshqa dublikatlarni o'chiradi (ulardagi taxminlarni saqlanayotganga ko'chiradi)
//   - Saqlanayotgan yozuvning externalId'ini yangi turg'un formatga (of-{num} yoki of-g-...) yozadi
//
// Foydalanish: npx tsx scripts/dedupe-matches.ts [--dry]
import "dotenv/config";
import { connectDB } from "../lib/db";
import { Match } from "../lib/models/Match";
import { Prediction } from "../lib/models/Prediction";
import { fetchSchedule } from "../lib/football-api";
import { computePoints, isExactMatch } from "../lib/scoring";

type DocLite = {
  _id: string;
  externalId: string;
  homeTeam: string;
  awayTeam: string;
  kickoff: Date;
  num: number | null;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
};

async function main() {
  const dryRun = process.argv.includes("--dry");
  await connectDB();

  // Yangi turg'un externalId va num'ni openfootball'dan olamiz
  const remote = await fetchSchedule();
  const remoteByKey = new Map<string, { externalId: string; num: number | null }>();
  for (const r of remote) {
    const key = `${new Date(r.kickoff).toISOString().slice(0, 10)}|${r.homeTeam}|${r.awayTeam}`;
    remoteByKey.set(key, { externalId: r.externalId, num: r.num });
  }

  const all = (await Match.find().lean()) as unknown as DocLite[];
  console.log(`→ DB'da jami ${all.length} ta Match (kutilgan: ${remote.length})`);

  // (date,home,away) bo'yicha guruhlash
  const groups = new Map<string, DocLite[]>();
  for (const m of all) {
    const key = `${new Date(m.kickoff).toISOString().slice(0, 10)}|${m.homeTeam}|${m.awayTeam}`;
    const arr = groups.get(key) ?? [];
    arr.push(m);
    groups.set(key, arr);
  }

  let kept = 0;
  let deleted = 0;
  let predsMoved = 0;
  let extIdRewritten = 0;
  let predsRescored = 0;
  const orphanGroups: string[] = [];

  async function rescorePredictionsForMatch(matchId: string) {
    const m = await Match.findById(matchId).lean();
    if (!m || m.status !== "FINISHED" || m.homeScore == null || m.awayScore == null) return;
    const actual = { home: m.homeScore, away: m.awayScore };
    const preds = await Prediction.find({ matchId: m._id });
    for (const p of preds) {
      const pred = { home: p.predHome, away: p.predAway };
      const points = computePoints(pred, actual);
      const exact = isExactMatch(pred, actual);
      if (p.points !== points || p.isExact !== exact) {
        if (!dryRun) {
          await Prediction.updateOne(
            { _id: p._id },
            { $set: { points, isExact: exact } }
          );
        }
        predsRescored++;
      }
    }
  }

  for (const [key, docs] of groups) {
    // Har bir doc'ga prediction sonini biriktirish
    const counts = await Promise.all(
      docs.map(async (d) => ({
        doc: d,
        predCount: await Prediction.countDocuments({ matchId: d._id }),
      }))
    );

    // "Keeper"ni tanlash:
    //   1) Eng ko'p prediction'i borni olamiz
    //   2) Tenglik bo'lsa — yangi externalId'siga to'g'ri keladiganini
    //   3) Aks holda eng eski (createdAt yo'q bo'lgani uchun _id eng kichigi)
    counts.sort((a, b) => {
      if (b.predCount !== a.predCount) return b.predCount - a.predCount;
      // Kichikroq _id eski hisoblanadi (ObjectId timestamp)
      return String(a.doc._id).localeCompare(String(b.doc._id));
    });
    const keeper = counts[0];
    const others = counts.slice(1);

    if (others.length === 0) {
      kept++;
      // externalId yangi formatga moslab qo'yamiz (agar farq qilsa)
      const remoteInfo = remoteByKey.get(key);
      if (remoteInfo && remoteInfo.externalId !== keeper.doc.externalId) {
        if (!dryRun) {
          await Match.updateOne(
            { _id: keeper.doc._id },
            { $set: { externalId: remoteInfo.externalId, num: remoteInfo.num } }
          );
        }
        extIdRewritten++;
        console.log(
          `  ~ ext-id: ${keeper.doc.externalId} → ${remoteInfo.externalId}  (${keeper.doc.homeTeam} vs ${keeper.doc.awayTeam})`
        );
      }
      await rescorePredictionsForMatch(String(keeper.doc._id));
      continue;
    }

    console.log(
      `\n× Duplikat: ${keeper.doc.homeTeam} vs ${keeper.doc.awayTeam}  (${docs.length} ta doc)`
    );
    console.log(
      `  ✓ keep _id=${keeper.doc._id} ext=${keeper.doc.externalId} status=${keeper.doc.status} preds=${keeper.predCount}`
    );

    for (const o of others) {
      // Taxminlarni keeper'ga ko'chirish (faqat keeper'da ushbu user uchun taxmin
      // bo'lmasa). Aks holda eski taxminni o'chiramiz.
      const preds = await Prediction.find({ matchId: o.doc._id }).lean();
      for (const p of preds) {
        const exists = await Prediction.findOne({
          matchId: keeper.doc._id,
          userId: p.userId,
        }).lean();
        if (exists) {
          // Keeper'da bor — eski yozuvdagisini o'chiramiz
          if (!dryRun) await Prediction.deleteOne({ _id: p._id });
        } else {
          if (!dryRun) {
            await Prediction.updateOne(
              { _id: p._id },
              { $set: { matchId: keeper.doc._id } }
            );
          }
          predsMoved++;
        }
      }
      console.log(
        `  − drop _id=${o.doc._id} ext=${o.doc.externalId} status=${o.doc.status} preds=${o.predCount} (moved/dropped)`
      );
      if (!dryRun) await Match.deleteOne({ _id: o.doc._id });
      deleted++;
    }

    // Skor va status keeper'ga: agar keeper'da skor yo'q va dublikatda bor bo'lsa, ko'chiramiz
    if (
      (keeper.doc.homeScore == null || keeper.doc.awayScore == null) &&
      others.some((o) => o.doc.homeScore != null && o.doc.awayScore != null)
    ) {
      const withScore = others.find((o) => o.doc.homeScore != null);
      if (withScore && !dryRun) {
        await Match.updateOne(
          { _id: keeper.doc._id },
          {
            $set: {
              status: "FINISHED",
              homeScore: withScore.doc.homeScore,
              awayScore: withScore.doc.awayScore,
            },
          }
        );
        console.log(
          `  ✎ score → ${withScore.doc.homeScore}:${withScore.doc.awayScore} keeper'ga ko'chirildi`
        );
      }
    }

    // externalId'ni yangi formatga moslab qo'yamiz
    const remoteInfo = remoteByKey.get(key);
    if (remoteInfo && remoteInfo.externalId !== keeper.doc.externalId) {
      if (!dryRun) {
        await Match.updateOne(
          { _id: keeper.doc._id },
          { $set: { externalId: remoteInfo.externalId, num: remoteInfo.num } }
        );
      }
      extIdRewritten++;
      console.log(`  ~ ext-id rewritten → ${remoteInfo.externalId}`);
    } else if (!remoteInfo) {
      orphanGroups.push(key);
    }
    // Keeper FINISHED bo'lsa taxminlarning ochkosini qayta hisoblaymiz
    await rescorePredictionsForMatch(String(keeper.doc._id));
    kept++;
  }

  console.log("\n========================================");
  console.log(`${dryRun ? "[DRY] " : ""}Kept: ${kept}, Deleted: ${deleted}, Predictions moved: ${predsMoved}, ExternalId rewritten: ${extIdRewritten}, Predictions rescored: ${predsRescored}`);
  if (orphanGroups.length) {
    console.log(`⚠ Openfootball'da yo'q ${orphanGroups.length} ta (qadimgi placeholder?): ${orphanGroups.slice(0, 5).join(", ")}${orphanGroups.length > 5 ? "..." : ""}`);
  }
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
