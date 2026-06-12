import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatKickoff(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("uz-UZ", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tashkent",
  }).format(d);
}

export function formatDateOnly(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("uz-UZ", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    timeZone: "Asia/Tashkent",
  }).format(d);
}

export function formatTimeOnly(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("uz-UZ", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tashkent",
  }).format(d);
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function startOfDayTashkent(d: Date): Date {
  // Asia/Tashkent = UTC+5
  const utc = d.getTime() + d.getTimezoneOffset() * 60_000;
  const tashkent = new Date(utc + 5 * 60 * 60_000);
  tashkent.setUTCHours(0, 0, 0, 0);
  return new Date(tashkent.getTime() - 5 * 60 * 60_000);
}

const MONTHS_UZ = [
  "yan", "fev", "mar", "apr", "may", "iyun",
  "iyul", "avg", "sen", "okt", "noy", "dek",
];

/** Toshkent vaqti uchun YYYY-MM-DD ajratish — en-CA format barqaror. */
function tashkentYmd(d: Date): { y: number; m: number; day: number } {
  const s = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Tashkent",
  }).format(d); // "2026-06-12"
  const [y, m, day] = s.split("-").map(Number);
  return { y, m, day };
}

function daysDiffTashkent(d: Date, today: Date): number {
  const a = tashkentYmd(d);
  const b = tashkentYmd(today);
  const aTs = Date.UTC(a.y, a.m - 1, a.day);
  const bTs = Date.UTC(b.y, b.m - 1, b.day);
  return Math.round((aTs - bTs) / 86_400_000);
}

/**
 * "Bugun · 23:00" / "Ertaga · 21:00" / "12-iyun · 06:00"
 * Asia/Tashkent vaqti bo'yicha.
 */
export function smartMatchTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = daysDiffTashkent(d, new Date());
  const time = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tashkent",
    hour12: false,
  }).format(d);
  if (diff === 0) return `Bugun · ${time}`;
  if (diff === 1) return `Ertaga · ${time}`;
  if (diff === -1) return `Kecha · ${time}`;
  const { m, day } = tashkentYmd(d);
  return `${day}-${MONTHS_UZ[m - 1]} · ${time}`;
}

/** "Bugun" / "Ertaga" / "12-iyun" (vaqtsiz) */
export function smartMatchDay(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = daysDiffTashkent(d, new Date());
  if (diff === 0) return "Bugun";
  if (diff === 1) return "Ertaga";
  if (diff === -1) return "Kecha";
  const { m, day } = tashkentYmd(d);
  return `${day}-${MONTHS_UZ[m - 1]}`;
}
