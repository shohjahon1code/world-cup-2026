import { Types } from "mongoose";
import { connectDB } from "./db";
import { Match } from "./models/Match";
import { Prediction } from "./models/Prediction";
import { fetchSchedule, fetchLiveResults, normalizeTeam } from "./football-api";
import { flagFor } from "./flags";
import { computePoints, isExactMatch } from "./scoring";

/** Futbol o'yini (+ qo'shimcha/penalti) ~150 daqiqada tugaydi. Shu vaqtdan
 * o'tgan LIVE o'yin — aniq tugagan, API nima desa ham. */
const MATCH_DURATION_MIN = 150;

/** Bitta o'yin uchun barcha taxminlarning ochkolarini qayta hisoblaydi.
 * O'zgargan taxminlar sonini qaytaradi. */
async function scorePredictions(
  matchId: string | Types.ObjectId,
  actual: { home: number; away: number }
): Promise<number> {
  let scored = 0;
  const preds = await Prediction.find({ matchId });
  for (const p of preds) {
    const pred = { home: p.predHome, away: p.predAway };
    const points = computePoints(pred, actual);
    const exact = isExactMatch(pred, actual);
    if (p.points !== points || p.isExact !== exact) {
      await Prediction.updateOne({ _id: p._id }, { $set: { points, isExact: exact } });
      scored++;
    }
  }
  return scored;
}

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
          scoredPredictions += await scorePredictions(dbMatch._id, {
            home: m.homeScore,
            away: m.awayScore,
          });
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

    // TheSportsDB bepul kalitida `strStatus` gohida "2H"da qotib qoladi: o'yin
    // allaqachon tugagan bo'lsa ham LIVE ko'rsatib turaveradi. Kickoff'dan 140
    // daqiqadan ko'p o'tgan va skor bor bo'lsa — bu aslida tugagan o'yin.
    const minutesSinceKickoff =
      (Date.now() - new Date(dbMatch.kickoff).getTime()) / 60_000;
    const staleLive =
      r.status === "LIVE" && hasApiScore && minutesSinceKickoff > MATCH_DURATION_MIN;
    const effectiveStatus = staleLive ? "FINISHED" : r.status;

    const update: Record<string, unknown> = {};
    // FINISHED — yakuniy holat: o'yinni hech qachon LIVE/SCHEDULEDga qaytarmaymiz
    // (API statusi qotib qolsa ham). Faqat hali tugamagan o'yin statusini yangilaymiz.
    if (!wasFinished) {
      update.status = effectiveStatus;
    }
    if (hasApiScore) {
      update.homeScore = r.homeScore;
      update.awayScore = r.awayScore;
    }
    if (Object.keys(update).length === 0) continue;
    await Match.updateOne({ _id: dbMatch._id }, { $set: update });
    updated++;

    // Endi yangi tugagan o'yin bo'lsa, ochkolarni hisoblaymiz
    if (!wasFinished && effectiveStatus === "FINISHED" && r.homeScore != null && r.awayScore != null) {
      scoredPredictions += await scorePredictions(dbMatch._id, {
        home: r.homeScore,
        away: r.awayScore,
      });
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

/** Xavfsizlik to'ri: API'ga BOG'LIQ BO'LMAGAN holda DB'ni tozalaydi.
 *
 * TheSportsDB bepul kaliti o'yinni LIVE'da qotirib qo'yishi yoki javobdan
 * butunlay tashlab yuborishi mumkin — u holda yuqoridagi sync'lar o'yinga
 * umuman tegmaydi va u abadiy LIVE qolib ketadi. Bu yerda kickoff'dan
 * MATCH_DURATION_MIN o'tgan har qanday LIVE o'yinni majburan FINISHED qilamiz.
 * Skor bo'lsa ochkolar ham hisoblanadi. */
export async function finalizeStaleLive() {
  await connectDB();
  const cutoff = new Date(Date.now() - MATCH_DURATION_MIN * 60_000);
  const stale = await Match.find({ status: "LIVE", kickoff: { $lt: cutoff } });
  let finalized = 0;
  let scoredPredictions = 0;
  for (const m of stale) {
    await Match.updateOne({ _id: m._id }, { $set: { status: "FINISHED" } });
    finalized++;
    if (m.homeScore != null && m.awayScore != null) {
      scoredPredictions += await scorePredictions(m._id, {
        home: m.homeScore,
        away: m.awayScore,
      });
    }
  }
  return { finalized, scoredPredictions };
}
