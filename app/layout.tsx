import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { Trophy, Home, CalendarDays, ShieldCheck } from "lucide-react";
import { AutoSync } from "@/components/AutoSync";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "WC 2026 — Do'stlar Chempionati",
  description:
    "World Cup 2026 — do'stlar orasidagi taxmin o'yini. Eng ko'p ochko to'plagan chempion!",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#047857",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="uz" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="min-h-full flex flex-col">
        <AutoSync />
        <header className="sticky top-0 z-30 border-b border-[var(--border)] glass">
          <div className="mx-auto max-w-3xl px-4 h-14 flex items-center justify-between gap-3">
            <Link href="/" className="flex items-center gap-2 font-extrabold text-[15px] group">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-lg shadow-emerald-500/30 group-hover:scale-105 transition-transform">
                <Trophy className="h-4 w-4" />
              </span>
              <span className="tracking-tight">
                WC 2026
                <span className="text-[var(--muted)] font-semibold hidden sm:inline">
                  {" "}
                  · do'stlar
                </span>
              </span>
            </Link>
            <nav className="flex items-center gap-1 text-sm">
              <NavLink href="/" icon={<Home className="h-4 w-4" />} label="Bosh" />
              <NavLink href="/matches" icon={<CalendarDays className="h-4 w-4" />} label="Jadval" />
              <NavLink href="/admin" icon={<ShieldCheck className="h-4 w-4" />} label="Admin" />
            </nav>
          </div>
        </header>
        <main className="flex-1 mx-auto w-full max-w-3xl px-4 py-5 sm:py-7">{children}</main>
        <footer className="border-t border-[var(--border)] py-5 text-center text-xs text-[var(--muted)]">
          <span className="inline-flex items-center gap-1.5">
            <span className="text-base">⚽</span> Do'stlar orasida WC 2026 · 2026
          </span>
        </footer>
      </body>
    </html>
  );
}

function NavLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 font-semibold transition-colors"
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </Link>
  );
}
