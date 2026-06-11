// Demo skript: bitta o'yinni FINISHED holatiga o'tkazib, ochkolarni hisoblaydi.
// Foydalanish:
//   npx tsx scripts/preview-finish.ts "Mexico" "South Africa" 2 1
//   npx tsx scripts/preview-finish.ts --reset "Mexico" "South Africa"
import "dotenv/config";
import { connectDB } from "../lib/db";
import { Match } from "../lib/models/Match";
import { Prediction } from "../lib/models/Prediction";

async function main() {
  await connectDB();
  const args = process.argv.slice(2);
  const reset = args[0] === "--reset";
  const start = reset ? 1 : 0;
  const home = args[start];
  const away = args[start + 1];
  if (!home || !away) {
    console.error("Foydalanish: tsx scripts/preview-finish.ts <home> <away> <homeScore> <awayScore>");
    console.error("              tsx scripts/preview-finish.ts --reset <home> <away>");
    process.exit(1);
  }
  const match = await Match.findOne({ homeTeam: home, awayTeam: away });
  if (!match) {
    console.error(`O'yin topilmadi: ${home} vs ${away}`);
    process.exit(1);
  }

  if (reset) {
    match.status = "SCHEDULED";
    match.homeScore = null;
    match.awayScore = null;
    await match.save();
    await Prediction.updateMany({ matchId: match._id }, { $set: { points: 0 } });
    console.log(`↺ Tiklandi: ${home} vs ${away} → SCHEDULED`);
    process.exit(0);
  }

  const hs = Number(args[start + 2]);
  const as = Number(args[start + 3]);
  if (!Number.isFinite(hs) || !Number.isFinite(as)) {
    console.error("Score raqam bo'lishi kerak");
    process.exit(1);
  }
  match.status = "FINISHED";
  match.homeScore = hs;
  match.awayScore = as;
  await match.save();
  const preds = await Prediction.find({ matchId: match._id });
  let winners = 0;
  for (const p of preds) {
    const points = p.predHome === hs && p.predAway === as ? 1 : 0;
    await Prediction.updateOne({ _id: p._id }, { $set: { points } });
    if (points === 1) winners++;
  }
  console.log(`✓ ${home} ${hs}:${as} ${away} — FINISHED. ${winners}/${preds.length} aniq topdi.`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
