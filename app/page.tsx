import { Suspense } from "react";
import { Flame, CalendarCheck, ArrowRight, Trophy } from "lucide-react";
import Link from "next/link";
import { MatchCard } from "@/components/MatchCard";
import { Leaderboard } from "@/components/Leaderboard";
import { SectionHeader } from "@/components/SectionHeader";
import { EmptyState } from "@/components/EmptyState";
import { HeroNextMatch } from "@/components/HeroNextMatch";
import { CopyMatchesButton } from "@/components/CopyMatchesButton";
import { formatDateOnly } from "@/lib/utils";
import {
  getLeaderboard,
  getMatchesForDay,
  getNextMatch,
  getStats,
} from "@/lib/queries";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export default async function HomePage() {
  return (
    <Suspense fallback={<HomeSkeleton />}>
      <HomeContent />
    </Suspense>
  );
}

async function HomeContent() {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 3600_000);

  const [leaderboard, todayMatches, tomorrowMatches, nextMatch, stats] = await Promise.all([
    safe(getLeaderboard, []),
    safe(() => getMatchesForDay(now), []),
    safe(() => getMatchesForDay(tomorrow), []),
    safe(getNextMatch, null),
    safe(getStats, { totalMatches: 0, totalPredictions: 0 }),
  ]);

  return (
    <div className="space-y-7">
      <div className="fade-up">
        <HeroNextMatch
          match={nextMatch}
          totalMatches={stats.totalMatches}
          totalPredictions={stats.totalPredictions}
        />
      </div>

      <section className="fade-up fade-up-1">
        <SectionHeader
          title="Bugungi o'yinlar"
          icon={<Flame className="h-5 w-5 text-orange-500" />}
          hint={todayMatches.length ? `${todayMatches.length} ta` : undefined}
        />
        {todayMatches.length ? (
          <>
            <div className="mb-3 flex items-center justify-between gap-2 flex-wrap">
              <p className="text-[12px] text-slate-500">
                Taxminingizni yozib adminga yuboring 👇
              </p>
              <CopyMatchesButton
                matches={todayMatches}
                dateLabel={formatDateOnly(now)}
                title="Bugungi o'yinlar"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {todayMatches.map((m) => (
                <MatchCard key={m.id} {...m} kickoff={new Date(m.kickoff)} />
              ))}
            </div>
          </>
        ) : (
          <EmptyState
            icon="⚽"
            title="Bugun o'yin yo'q"
            hint="Keyingi o'yinlar uchun jadvalga qarang"
          />
        )}
      </section>

      <section className="fade-up fade-up-2">
        <SectionHeader title="Reyting" icon={<Trophy className="h-5 w-5 text-amber-500" />} />
        {leaderboard.length ? (
          <Leaderboard rows={leaderboard} />
        ) : (
          <EmptyState
            icon="📊"
            title="Reyting hali bo'sh"
            hint="Birinchi o'yinlar tugaganidan keyin ochkolar hisoblanadi"
          />
        )}
      </section>

      <section className="fade-up fade-up-3">
        <SectionHeader
          title="Ertangi o'yinlar"
          icon={<CalendarCheck className="h-5 w-5 text-blue-500" />}
          hint={tomorrowMatches.length ? `${tomorrowMatches.length} ta` : undefined}
        />
        {tomorrowMatches.length ? (
          <>
            <div className="mb-3 flex items-center justify-between gap-2 flex-wrap">
              <p className="text-[12px] text-slate-500">
                Taxminingizni yozib adminga yuboring 👇
              </p>
              <CopyMatchesButton
                matches={tomorrowMatches}
                dateLabel={formatDateOnly(tomorrow)}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {tomorrowMatches.map((m) => (
                <MatchCard key={m.id} {...m} kickoff={new Date(m.kickoff)} />
              ))}
            </div>
          </>
        ) : (
          <EmptyState icon="🗓️" title="Ertaga o'yin yo'q" />
        )}
        <Link
          href="/matches"
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-emerald-700 hover:text-emerald-900 group"
        >
          To'liq jadvalni ko'rish
          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </section>
    </div>
  );
}

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    console.warn("[home] data fetch failed:", (e as Error).message);
    return fallback;
  }
}

function HomeSkeleton() {
  return (
    <div className="space-y-5">
      <div className="h-56 rounded-3xl bg-emerald-100/50 shimmer" />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="h-28 rounded-2xl bg-slate-100 shimmer" />
        <div className="h-28 rounded-2xl bg-slate-100 shimmer" />
      </div>
    </div>
  );
}
