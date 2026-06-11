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
