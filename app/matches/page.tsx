import { CalendarDays, Trophy } from "lucide-react";
import { MatchCard } from "@/components/MatchCard";
import { SectionHeader } from "@/components/SectionHeader";
import { EmptyState } from "@/components/EmptyState";
import { GroupCard } from "@/components/GroupCard";
import { Bracket } from "@/components/Bracket";
import { ViewSwitcher, type MatchesView } from "@/components/ViewSwitcher";
import { getAllMatches, type SerializedMatch } from "@/lib/queries";
import {
  groupByGroup,
  groupByRound,
  autoDefaultView,
  getChampion,
} from "@/lib/tournament";

export const dynamic = "force-dynamic";

const VALID_VIEWS: MatchesView[] = ["groups", "bracket", "date"];

export default async function MatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const matches = await getAllMatches().catch(() => [] as SerializedMatch[]);

  if (!matches.length) {
    return (
      <EmptyState
        icon="🗓️"
        title="O'yinlar jadvali hali sync qilinmagan"
        hint="Admin panel orqali 'Jadval' tugmasini bosing"
      />
    );
  }

  const { view: rawView } = await searchParams;
  const view: MatchesView = VALID_VIEWS.includes(rawView as MatchesView)
    ? (rawView as MatchesView)
    : autoDefaultView(matches);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight inline-flex items-center gap-2">
          <Trophy className="h-5 w-5 text-emerald-600" />
          Chempionat
        </h1>
        <ViewSwitcher active={view} />
      </div>

      {view === "groups" && <GroupsView matches={matches} />}
      {view === "bracket" && <BracketView matches={matches} />}
      {view === "date" && <DateView matches={matches} />}
    </div>
  );
}

function GroupsView({ matches }: { matches: SerializedMatch[] }) {
  const bundles = groupByGroup(matches);
  const hasAny = bundles.some((b) => b.matches.length > 0);

  if (!hasAny) {
    return (
      <EmptyState
        icon="🅰️"
        title="Guruh bosqichi o'yinlari topilmadi"
        hint="Jadvalni qayta sync qiling"
      />
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-[12px] text-slate-500 inline-flex items-center gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-emerald-500" />
          1-2 o'rin — pley-offga
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-amber-500" />
          3-o'rin — 8 ta eng yaxshisi o'tadi
        </span>
      </p>
      <div className="grid gap-4 lg:grid-cols-2">
        {bundles.map((b) => (
          <GroupCard key={b.letter} bundle={b} />
        ))}
      </div>
    </div>
  );
}

function BracketView({ matches }: { matches: SerializedMatch[] }) {
  const rounds = groupByRound(matches);
  const champion = getChampion(matches);
  const anyKnockout = Object.values(rounds).some((arr) => arr.length > 0);

  if (!anyKnockout) {
    return (
      <EmptyState
        icon="🎯"
        title="Pley-off jadvali hali tayyor emas"
        hint="Guruh bosqichi tugagandan keyin setka shakllantiriladi"
      />
    );
  }

  return <Bracket rounds={rounds} champion={champion} />;
}

function DateView({ matches }: { matches: SerializedMatch[] }) {
  type M = SerializedMatch;
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
        title="Sana bo'yicha"
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
  matches: SerializedMatch[];
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
