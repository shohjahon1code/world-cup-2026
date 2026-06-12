import { connectDB } from "./db";
import { Match } from "./models/Match";
import { Prediction } from "./models/Prediction";
import { fetchSchedule, fetchLiveResults, normalizeTeam } from "./football-api";
import { flagFor } from "./flags";

/** openfootball jadvalini DB'ga yuklash (yoki yangilash). */
export async function syncSchedule() {
  await connectDB();
  const schedule = await fetchSchedule();
  let upserted = 0;
  for (const m of schedule) {
    await Match.updateOne(
      { externalId: m.externalId },
      {
        $set: {
          homeTeam: m.homeTeam,
          awayTeam: m.awayTeam,
          homeFlag: flagFor(m.homeTeam),
          awayFlag: flagFor(m.awayTeam),
          kickoff: m.kickoff,
          stage: m.stage,
          group: m.group,
        },
        $setOnInsert: { status: "SCHEDULED" },
      },
      { upsert: true }
    );
    upserted++;
  }
  return { total: schedule.length, upserted };
}

/** TheSportsDB'dan live natijalarni olib DB'ga yozish + ochkolarni qayta hisoblash. */
export async function syncResults() {
  await connectDB();
  const live = await fetchLiveResults();
  let updated = 0;
  let scoredPredictions = 0;
  const unmatched: string[] = [];

  for (const r of live) {
    const home = normalizeTeam(r.homeTeam);
    const away = normalizeTeam(r.awayTeam);
    // Sana + jamoalar bo'yicha topish (externalId openfootball formatida)
    const matches = await Match.find({
      homeTeam: home,
      awayTeam: away,
    }).lean();
    // Sana bo'yicha eng yaqinini olish (±1 kun)
    const targetTime = new Date(`${r.dateEvent}T00:00:00Z`).getTime();
    const dbMatch = matches
      .map((m) => ({ m, diff: Math.abs(new Date(m.kickoff).getTime() - targetTime) }))
      .sort((a, b) => a.diff - b.diff)[0]?.m;
    if (!dbMatch) {
      unmatched.push(`${r.homeTeam} vs ${r.awayTeam} (${r.dateEvent})`);
      continue;
    }

    const wasFinished = dbMatch.status === "FINISHED";
    // Manual qo'yilgan FINISHED + score'larni saqlash: agar API hali score bermagan
    // bo'lsa, mavjud qiymatlarni null bilan yopib qo'ymaymiz.
    const hasApiScore = r.homeScore != null && r.awayScore != null;
    const update: Record<string, unknown> = {};
    if (hasApiScore || !wasFinished) {
      update.status = r.status;
    }
    if (hasApiScore) {
      update.homeScore = r.homeScore;
      update.awayScore = r.awayScore;
    }
    if (Object.keys(update).length === 0) continue;
    await Match.updateOne({ _id: dbMatch._id }, { $set: update });
    updated++;

    // Endi yangi tugagan o'yin bo'lsa, ochkolarni hisoblaymiz
    if (!wasFinished && r.status === "FINISHED" && r.homeScore != null && r.awayScore != null) {
      const preds = await Prediction.find({ matchId: dbMatch._id });
      for (const p of preds) {
        const points = p.predHome === r.homeScore && p.predAway === r.awayScore ? 1 : 0;
        if (p.points !== points) {
          await Prediction.updateOne({ _id: p._id }, { $set: { points } });
          scoredPredictions++;
        }
      }
    }
  }
  if (unmatched.length) {
    console.warn("[sync] DB'da topilmagan eventlar:", unmatched);
  }
  return {
    liveEvents: live.length,
    matchesUpdated: updated,
    predictionsScored: scoredPredictions,
    unmatched,
  };
}
