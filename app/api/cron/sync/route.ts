import { NextRequest, NextResponse } from "next/server";
import { syncSchedule, syncResults } from "@/lib/sync";

export const dynamic = "force-dynamic";

// Vercel Cron: har 5 daqiqada chaqiriladi (vercel.json).
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
    return NextResponse.json({ ok: true, schedule, results });
  } catch (e) {
    const msg = (e as Error).message;
    console.error("[cron/sync]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
