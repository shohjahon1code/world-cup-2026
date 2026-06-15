import { NextRequest, NextResponse } from "next/server";
import { syncSchedule, syncResults, finalizeStaleLive } from "@/lib/sync";

export const dynamic = "force-dynamic";

// Cron: har 1 daqiqada chaqiriladi (vercel.json / serverdagi crontab).
// Manual chaqirish:  curl -H "Authorization: Bearer $CRON_SECRET" /api/cron/sync
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  // Vercel cron'da `Authorization: Bearer <CRON_SECRET>` header avtomatik qo'shiladi.
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    // syncSchedule + syncResults — ikkalasi ham har safar.
    // syncSchedule openfootball'dan score bo'lsa avto FINISHED qiladi va ochkolarni
    // hisoblaydi (TheSportsDB sekin bo'lsa fallback). syncResults TheSportsDB
    // (uchta endpoint) — LIVE/FINISHED o'yinlarni yangilaydi. externalId turg'un
    // bo'lgani uchun dublikat yaratilmaydi.
    const schedule = await syncSchedule();
    const results = await syncResults();
    // Xavfsizlik to'ri: API qotirib qo'ygan/tashlab ketgan LIVE o'yinlarni tozalash.
    const swept = await finalizeStaleLive();
    return NextResponse.json({ ok: true, schedule, results, swept });
  } catch (e) {
    const msg = (e as Error).message;
    console.error("[cron/sync]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
