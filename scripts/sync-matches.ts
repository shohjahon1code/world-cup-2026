import "dotenv/config";
import { syncSchedule, syncResults, finalizeStaleLive } from "../lib/sync";

async function main() {
  console.log("→ Schedule sync...");
  const a = await syncSchedule();
  console.log(`  ✓ ${a.upserted}/${a.total} matches upserted`);

  console.log("→ Live results sync...");
  const b = await syncResults();
  console.log(
    `  ✓ ${b.matchesUpdated} matches updated, ${b.predictionsScored} predictions scored (live events: ${b.liveEvents})`
  );

  console.log("→ Stale LIVE sweep...");
  const c = await finalizeStaleLive();
  console.log(`  ✓ ${c.finalized} stale matches finalized, ${c.scoredPredictions} predictions scored`);

  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
