// Next.js server ko'tarilganda bir marta chaqiriladi (node_modules/next docs:
// instrumentation.js — `register` server instance ishga tushganda ishlaydi).
export async function register() {
  // Faqat Node.js runtime'da (Edge'da mongoose/node-cron ishlamaydi).
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startScheduler } = await import("./lib/scheduler");
    startScheduler();
  }
}
