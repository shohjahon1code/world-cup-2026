import "dotenv/config";
import { connectDB } from "../lib/db";
import { Match } from "../lib/models/Match";
async function main() {
  await connectDB();
  const matches = await Match.find().lean();
  const missing = new Set<string>();
  for (const m of matches) {
    if (!m.homeFlag || m.homeFlag === "⚽") missing.add(m.homeTeam);
    if (!m.awayFlag || m.awayFlag === "⚽") missing.add(m.awayTeam);
  }
  console.log([...missing].sort().join("\n"));
  process.exit(0);
}
main();
