import { NextResponse } from "next/server";
import { syncResults, syncSchedule } from "@/lib/sync";

export const dynamic = "force-dynamic";

// 1 daqiqada bir martadan ko'p ishlamasin (process xotirasida)
const INTERVAL_MS = 60 * 1000;
type Cache = {
  lastRun: number;
  lastResult: unknown;
  inFlight: Promise<unknown> | null;
};
const g = globalThis as unknown as { __wc2026AutoSync?: Cache };
const cache: Cache = g.__wc2026AutoSync ?? { lastRun: 0, lastResult: null, inFlight: null };
if (!g.__wc2026AutoSync) g.__wc2026AutoSync = cache;

/**
 * Foydalanuvchi saytni ochganda chaqiriladi.
 * Secret talab qilmaydi, lekin process'da 5 daqiqada bir martadan ortiq
 * haqiqiy syncResults bajarmaydi. Boshqa chaqiruvlar cache javobini oladi.
 */
export async function GET() {
  const now = Date.now();
  const ageMs = now - cache.lastRun;

  // Allaqachon ishlayotgan bo'lsa, kutamiz va shu javobni qaytaramiz
  if (cache.inFlight) {
    const result = await cache.inFlight;
    return NextResponse.json({ ok: true, fromQueue: true, result });
  }

  if (cache.lastRun > 0 && ageMs < INTERVAL_MS) {
    return NextResponse.json({
      ok: true,
      cached: true,
      nextInMs: INTERVAL_MS - ageMs,
      lastRunAgoMs: ageMs,
      result: cache.lastResult,
    });
  }

  try {
    // schedule + results birga: openfootball'da score bo'lsa avto FINISHED,
    // TheSportsDB'dan LIVE/FINISHED ham olamiz. externalId turg'un bo'lgani
    // uchun dublikat yaratilmaydi.
    cache.inFlight = (async () => {
      const schedule = await syncSchedule();
      const results = await syncResults();
      // AutoSync client komponenti `matchesUpdated > 0` bo'lsa router refresh
      // qiladi — schedule fallback'i ham hisoblansin.
      const matchesUpdated =
        (results.matchesUpdated ?? 0) + (schedule.finishedFromSchedule ?? 0);
      return { schedule, results, matchesUpdated };
    })();
    const result = await cache.inFlight;
    cache.lastRun = Date.now();
    cache.lastResult = result;
    cache.inFlight = null;
    return NextResponse.json({ ok: true, fresh: true, result });
  } catch (e) {
    cache.inFlight = null;
    const msg = (e as Error).message;
    console.error("[auto-sync]", msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
