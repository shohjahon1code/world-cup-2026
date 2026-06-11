import { CalendarDays } from "lucide-react";
import { MatchCard } from "@/components/MatchCard";
import { SectionHeader } from "@/components/SectionHeader";
import { EmptyState } from "@/components/EmptyState";
import { getAllMatches } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function MatchesPage() {
  const matches = await getAllMatches().catch(() => []);
  if (!matches.length) {
    return (
      <EmptyState
        icon="🗓️"
        title="O'yinlar jadvali hali sync qilinmagan"
        hint="Admin panel orqali 'Sync schedule' tugmasini bosing"
      />
    );
  }

  // Sanalar bo'yicha guruhlash
  type M = (typeof matches)[number];
  const groups = new Map<string, M[]>();
  for (const m of matches) {
    const key = new Date(m.kickoff).toISOString().slice(0, 10);
    const arr = groups.get(key) ?? [];
    arr.push(m);
    groups.set(key, arr);
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="To'liq jadval"
        icon={<CalendarDays className="h-5 w-5 text-emerald-600" />}
        hint={`${matches.length} ta o'yin`}
      />
      {[...groups.entries()].map(([date, list], idx) => (
        <DayGroup
          key={date}
          date={date}
          matches={list}
          isToday={date === today}
          delay={idx}
        />
      ))}
    </div>
  );
}

function DayGroup({
  date,
  matches,
  isToday,
  delay,
}: {
  date: string;
  matches: any[];
  isToday: boolean;
  delay: number;
}) {
  const d = new Date(`${date}T12:00:00Z`);
  const label = new Intl.DateTimeFormat("uz-UZ", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    timeZone: "Asia/Tashkent",
  }).format(d);

  return (
    <div className={`fade-up ${delay === 0 ? "" : delay === 1 ? "fade-up-1" : "fade-up-2"}`}>
      <div className="sticky top-14 z-10 -mx-4 px-4 py-2 bg-[var(--background)]/95 backdrop-blur mb-2 flex items-center gap-2 border-b border-[var(--border)]">
        <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-700">
          {label}
        </h3>
        {isToday && (
          <span className="text-[9.5px] uppercase tracking-wider bg-emerald-600 text-white px-1.5 py-0.5 rounded font-extrabold">
            BUGUN
          </span>
        )}
        <span className="ml-auto text-[11px] text-[var(--muted)] font-bold">{matches.length} ta</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {matches.map((m) => (
          <MatchCard key={m.id} {...m} kickoff={new Date(m.kickoff)} />
        ))}
      </div>
    </div>
  );
}
