import "dotenv/config";
import { connectDB } from "../lib/db";
import { Prediction } from "../lib/models/Prediction";
import { User } from "../lib/models/User";
async function main() {
  await connectDB();
  void User; // ensure model is registered
  const all = await Prediction.find().populate("userId").lean();
  for (const p of all) {
    const u = p.userId as any;
    console.log(`${u?.name ?? "?"}: pred=${p.predHome}:${p.predAway} points=${p.points}`);
  }
  console.log(`Total: ${all.length}`);
  process.exit(0);
}
main();
