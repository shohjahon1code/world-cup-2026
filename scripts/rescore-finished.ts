// Bir martalik tuzatish: barcha FINISHED o'yinlarning ochkolarini DB'dagi joriy
// yakuniy skor bo'yicha qayta hisoblaydi. Skor o'yin tugagandan keyin o'zgargan
// (kech gol) holatlarda eski/noto'g'ri ochkolarni tuzatadi.
//   npx tsx scripts/rescore-finished.ts
import "dotenv/config";
import { connectDB } from "../lib/db";
import { Match } from "../lib/models/Match";
import { Prediction } from "../lib/models/Prediction";
import { computePoints, isExactMatch } from "../lib/scoring";

async function main() {
  await connectDB();
  const matches = await Match.find({
    status: "FINISHED",
    homeScore: { $ne: null },
    awayScore: { $ne: null },
  });

  let changedPreds = 0;
  for (const m of matches) {
    const actual = { home: m.homeScore as number, away: m.awayScore as number };
    const preds = await Prediction.find({ matchId: m._id });
    for (const p of preds) {
      const pred = { home: p.predHome, away: p.predAway };
      const points = computePoints(pred, actual);
      const exact = isExactMatch(pred, actual);
      if (p.points !== points || p.isExact !== exact) {
        await Prediction.updateOne(
          { _id: p._id },
          { $set: { points, isExact: exact } }
        );
        changedPreds++;
        console.log(
          `~ ${m.homeTeam} ${actual.home}:${actual.away} ${m.awayTeam} | ` +
            `taxmin ${pred.home}:${pred.away} → ${p.points}(${p.isExact}) o'rniga ${points}(${exact})`
        );
      }
    }
  }
  console.log(`\n✓ Tugadi. ${matches.length} ta FINISHED o'yin, ${changedPreds} ta taxmin tuzatildi.`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
