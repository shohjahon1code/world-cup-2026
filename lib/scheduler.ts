import cron from "node-cron";
import { syncSchedule, syncResults, finalizeStaleLive } from "./sync";

// HMR / bir nechta import bo'lganda ikki marta boshlanmasligi uchun global flag.
const g = globalThis as unknown as {
  __wc2026Cron?: boolean;
  __wc2026CronBusy?: boolean;
};

/** Bitta to'liq sync sikli: jadval + live natijalar + stale LIVE tozalash. */
async function runSync() {
  // Oldingi sikl hali tugamagan bo'lsa, ustma-ust ishlamasin (sekin API bo'lsa).
  if (g.__wc2026CronBusy) return;
  g.__wc2026CronBusy = true;
  const t = new Date().toLocaleTimeString("en-GB"); // HH:MM:SS
  try {
    const schedule = await syncSchedule();
    const results = await syncResults();
    const swept = await finalizeStaleLive();
    // Har daqiqada heartbeat — cron tirikligini logda ko'rsatadi.
    console.log(
      `[cron ${t}] ✓ ishladi — updated:${results.matchesUpdated} ` +
        `finished:${schedule.finishedFromSchedule} swept:${swept.finalized} ` +
        `live:${results.liveEvents}`
    );
  } catch (e) {
    console.error(`[cron ${t}] ✗ xato:`, (e as Error).message);
  } finally {
    g.__wc2026CronBusy = false;
  }
}

/** Server ko'tarilganda chaqiriladi — har 1 daqiqada sync'ni rejalashtiradi.
 * Brauzer ochiq-yo'qligidan qat'i nazar ishlaydi (server process ichida). */
export function startScheduler() {
  if (g.__wc2026Cron) return; // allaqachon ishga tushgan
  g.__wc2026Cron = true;
  cron.schedule("* * * * *", runSync); // har daqiqa
  void runSync(); // server ko'tarilishi bilan darhol bir marta
  console.log("[cron] scheduler ishga tushdi (har 1 daqiqa)");
}
