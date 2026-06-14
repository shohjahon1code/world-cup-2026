import { connectDB } from "./db";
import { Match } from "./models/Match";
import { Prediction } from "./models/Prediction";
import { fetchSchedule, fetchLiveResults, normalizeTeam } from "./football-api";
import { flagFor } from "./flags";
import { computePoints, isExactMatch } from "./scoring";

/** openfootball jadvalini DB'ga yuklash (yoki yangilash). */
export async function syncSchedule() {
  await connectDB();
  const schedule = await fetchSchedule();
  let upserted = 0;
  let finishedFromSchedule = 0;
  let scoredPredictions = 0;
  for (const m of schedule) {
    await Match.updateOne(
      { externalId: m.externalId },
      {
        $set: {
          num: m.num,
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

    // openfootball'da skor allaqachon yozilgan bo'lsa (TheSportsDB sekin yangilanadi —
    // shu fallback bo'ladi). Faqat hali FINISHED bo'lmagan o'yinlarga tegamiz.
    if (m.finished && m.homeScore != null && m.awayScore != null) {
      const dbMatch = await Match.findOne({ externalId: m.externalId }).lean();
      if (!dbMatch || dbMatch.status !== "FINISHED") {
        await Match.updateOne(
          { externalId: m.externalId },
          { $set: { status: "FINISHED", homeScore: m.homeScore, awayScore: m.awayScore } }
        );
        finishedFromSchedule++;
        if (dbMatch) {
          const actual = { home: m.homeScore, away: m.awayScore };
          const preds = await Prediction.find({ matchId: dbMatch._id });
          for (const p of preds) {
            const pred = { home: p.predHome, away: p.predAway };
            const points = computePoints(pred, actual);
            const exact = isExactMatch(pred, actual);
            if (p.points !== points || p.isExact !== exact) {
              await Prediction.updateOne({ _id: p._id }, { $set: { points, isExact: exact } });
              scoredPredictions++;
            }
          }
        }
      }
    }
  }
  return { total: schedule.length, upserted, finishedFromSchedule, scoredPredictions };
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
      const actual = { home: r.homeScore, away: r.awayScore };
      const preds = await Prediction.find({ matchId: dbMatch._id });
      for (const p of preds) {
        const pred = { home: p.predHome, away: p.predAway };
        const points = computePoints(pred, actual);
        const exact = isExactMatch(pred, actual);
        if (p.points !== points || p.isExact !== exact) {
          await Prediction.updateOne({ _id: p._id }, { $set: { points, isExact: exact } });
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
