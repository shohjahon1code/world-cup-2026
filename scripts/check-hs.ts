import "dotenv/config";
import { connectDB } from "../lib/db";
import { Match } from "../lib/models/Match";

async function main() {
  await connectDB();
  const matches = await Match.find({
    $or: [
      { homeTeam: { $in: ["Haiti", "Scotland"] } },
      { awayTeam: { $in: ["Haiti", "Scotland"] } },
    ],
  }).lean();
  for (const m of matches) {
    console.log(
      `${m.homeTeam} ${m.homeScore ?? "-"}:${m.awayScore ?? "-"} ${m.awayTeam} | ${m.status} | ${new Date(m.kickoff).toISOString()} | extId=${m.externalId}`
    );
  }
  process.exit(0);
}
main();
