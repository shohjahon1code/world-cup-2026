import "dotenv/config";
import { connectDB } from "../lib/db";
import { User } from "../lib/models/User";
import { PARTICIPANTS } from "../lib/participants";

async function main() {
  await connectDB();
  for (const p of PARTICIPANTS) {
    await User.updateOne(
      { name: p.name },
      { $set: { isAdmin: p.isAdmin }, $setOnInsert: { name: p.name } },
      { upsert: true }
    );
  }
  const count = await User.countDocuments();
  console.log(`✓ Seeded ${count} users.`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
