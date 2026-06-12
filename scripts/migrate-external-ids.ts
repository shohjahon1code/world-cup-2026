// Bir martalik: mavjud Match yozuvlarining externalId'ini yangi formatga o'tkazadi
// va num field'ini to'ldiradi. Bu duplikat oldini oladi keyingi sync paytida.
//
// Foydalanish: npx tsx scripts/migrate-external-ids.ts
import "dotenv/config";
import { connectDB } from "../lib/db";
import { Match } from "../lib/models/Match";
import { fetchSchedule } from "../lib/football-api";

async function main() {
  await connectDB();
  const remote = await fetchSchedule(); // num bilan
  console.log(`→ openfootball'da ${remote.length} ta o'yin`);

  let updated = 0;
  let skipped = 0;
  let notFound = 0;

  for (const r of remote) {
    if (r.num == null) {
      skipped++;
      continue;
    }
    // Avval — agar yangi format allaqachon mavjud bo'lsa, num'ni yangilash kifoya
    const existsNew = await Match.findOne({ externalId: r.externalId });
    if (existsNew) {
      if (existsNew.num !== r.num) {
        await Match.updateOne({ _id: existsNew._id }, { $set: { num: r.num } });
        updated++;
      } else {
        skipped++;
      }
      continue;
    }

    // Eski format — date+teams bo'yicha topish
    const dateKey = new Date(r.kickoff).toISOString().slice(0, 10);
    const startOfDay = new Date(`${dateKey}T00:00:00Z`);
    const endOfDay = new Date(`${dateKey}T23:59:59Z`);
    const old = await Match.findOne({
      homeTeam: r.homeTeam,
      awayTeam: r.awayTeam,
      kickoff: { $gte: startOfDay, $lte: endOfDay },
    });
    if (!old) {
      notFound++;
      continue;
    }
    // Yangi externalId allaqachon boshqa yozuv bo'lmasligi kerak (yuqorida tekshirildi).
    await Match.updateOne(
      { _id: old._id },
      { $set: { externalId: r.externalId, num: r.num } }
    );
    updated++;
  }

  console.log(
    `✓ ${updated} ta yangilandi · ${skipped} ta o'zgartirilmadi · ${notFound} ta topilmadi`
  );
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
