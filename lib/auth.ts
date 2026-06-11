import { cookies } from "next/headers";
import crypto from "crypto";

const COOKIE_NAME = "wc2026_admin";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 kun

function signature(value: string): string {
  const secret = process.env.ADMIN_PASSWORD ?? "";
  return crypto.createHmac("sha256", secret).update(value).digest("hex");
}

export async function setAdminSession() {
  const value = String(Date.now());
  const sig = signature(value);
  const c = await cookies();
  c.set(COOKIE_NAME, `${value}.${sig}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: MAX_AGE,
    path: "/",
  });
}

export async function clearAdminSession() {
  const c = await cookies();
  c.delete(COOKIE_NAME);
}

export async function isAdmin(): Promise<boolean> {
  if (!process.env.ADMIN_PASSWORD) return false;
  const c = await cookies();
  const raw = c.get(COOKIE_NAME)?.value;
  if (!raw) return false;
  const [value, sig] = raw.split(".");
  if (!value || !sig) return false;
  const expected = signature(value);
  try {
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch {
    return false;
  }
}

export function checkPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  if (input.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(input), Buffer.from(expected));
}
