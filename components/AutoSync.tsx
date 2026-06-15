"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const INTERVAL_MS = 60 * 1000; // 1 daqiqa

/**
 * Sayt ochilganda foydalanuvchi taraf har 1 daqiqada /api/auto-sync'ni
 * chaqiradi. Backend o'zi rate-limit qiladi — ko'p tab ochilsa ham
 * 1 daqiqada bir martadan ortiq haqiqiy sync ishlamaydi.
 */
export function AutoSync() {
  const router = useRouter();
  const lastRefreshedAt = useRef(0);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function tick() {
      if (cancelled) return;
      try {
        const res = await fetch("/api/auto-sync", { cache: "no-store" });
        const data = (await res.json().catch(() => ({}))) as {
          fresh?: boolean;
          result?: { matchesUpdated?: number };
        };
        // Faqat haqiqiy yangilanish bo'lganda router refresh qilamiz
        if (data?.fresh && (data.result?.matchesUpdated ?? 0) > 0) {
          // Bir daqiqada bittadan ortiq refresh qilmaslik uchun
          const now = Date.now();
          if (now - lastRefreshedAt.current > 60_000) {
            lastRefreshedAt.current = now;
            router.refresh();
          }
        }
      } catch {
        // tarmoq xatosi — sukut
      }
      if (!cancelled) timer = setTimeout(tick, INTERVAL_MS);
    }

    // Sayt ochilishi bilan darhol chaqiramiz, keyin har 5 min
    tick();

    // Tab/window yana faollashganda darhol tekshiramiz
    const onVisible = () => {
      if (document.visibilityState === "visible") void tick();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [router]);

  return null;
}
