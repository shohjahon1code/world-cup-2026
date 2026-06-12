// Bir martalik: barcha FINISHED o'yinlardagi predictions'larni
// ESKI qoidaga qaytaradi → isExact ? 1 : 0.
// (Yangi qoida xato bilan tegib ketgan bo'lsa.)
//
// Foydalanish: npx tsx scripts/revert-finished.ts
import "dotenv/config";
import { connectDB } from "../lib/db";
import { Match } from "../lib/models/Match";
import { Prediction } from "../lib/models/Prediction";

async function main() {
  await connectDB();
  const finished = await Match.find({ status: "FINISHED" }).lean();
  console.log(`→ ${finished.length} ta FINISHED o'yin topildi`);

  const matchIds = finished.map((m) => m._id);
  const preds = await Prediction.find({ matchId: { $in: matchIds } });

  let restored = 0;
  for (const p of preds) {
    const oldRulePoints = p.isExact ? 1 : 0;
    if (p.points !== oldRulePoints) {
      await Prediction.updateOne(
        { _id: p._id },
        { $set: { points: oldRulePoints } }
      );
      restored++;
    }
  }

  console.log(
    `✓ ${restored}/${preds.length} prediction eski qoidaga qaytarildi (isExact ? 1 : 0)`
  );
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
