import Link from "next/link";
import { Crown } from "lucide-react";
import { cn, smartMatchTime } from "@/lib/utils";
import type { SerializedMatch } from "@/lib/queries";

type Props = {
  match: SerializedMatch;
  /** Markaziy "kubok" karta — Final uchun ekspozitsiya */
  isFinal?: boolean;
};

function isPlaceholder(name: string): boolean {
  return /^([WL]\d+|[123][A-L]([/][A-L])*)$/.test(name.trim());
}

export function BracketMatch({ match, isFinal = false }: Props) {
  const hasScore = match.homeScore != null && match.awayScore != null;
  const isFinished = match.status === "FINISHED";
  const isLive = match.status === "LIVE";
  const homeWon = hasScore && match.homeScore! > match.awayScore!;
  const awayWon = hasScore && match.awayScore! > match.homeScore!;
  const homeP = isPlaceholder(match.homeTeam);
  const awayP = isPlaceholder(match.awayTeam);
  const isTbd = homeP && awayP;

  if (isFinal && isFinished && (homeWon || awayWon)) {
    return <FinalCard match={match} championIsHome={homeWon} />;
  }

  return (
    <Link
      href={`/matches/${match.id}`}
      className={cn(
        "group relative block w-full rounded-xl bg-white border overflow-hidden transition-all",
        isLive
          ? "border-red-300 ring-2 ring-red-100 shadow-md shadow-red-200/50"
          : isFinished
          ? "border-slate-200 hover:border-emerald-300"
          : isTbd
          ? "border-dashed border-slate-200 bg-slate-50/50"
          : "border-[var(--border)] hover:border-emerald-300 hover:shadow-sm hover:-translate-y-0.5"
      )}
    >
      {/* Top status bar */}
      <div
        className={cn(
          "px-2.5 py-1 flex items-center justify-between border-b text-[10px] font-bold uppercase tracking-wider",
          isLive
            ? "bg-gradient-to-r from-red-500 to-rose-500 text-white border-red-400"
            : isFinished
            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
            : "bg-slate-50 text-slate-500 border-slate-100"
        )}
      >
        <span className="truncate">
          {isLive ? (
            <span className="inline-flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-white live-dot" />
              JONLI
            </span>
          ) : isFinished ? (
            "Tugadi"
          ) : isTbd ? (
            "Kutilmoqda"
          ) : (
            smartMatchTime(match.kickoff)
          )}
        </span>
        {match.num != null && (
          <span
            className={cn(
              "text-[9px]",
              isLive ? "text-red-100" : "text-slate-300"
            )}
          >
            #{match.num}
          </span>
        )}
      </div>

      <div className="p-2.5 space-y-1.5">
        <SideRow
          name={match.homeTeam}
          flag={match.homeFlag}
          won={homeWon}
          lost={awayWon && isFinished}
          placeholder={homeP}
          score={hasScore ? match.homeScore : null}
        />
        <div className="border-t border-slate-100" />
        <SideRow
          name={match.awayTeam}
          flag={match.awayFlag}
          won={awayWon}
          lost={homeWon && isFinished}
          placeholder={awayP}
          score={hasScore ? match.awayScore : null}
        />
      </div>
    </Link>
  );
}

function FinalCard({
  match,
  championIsHome,
}: {
  match: SerializedMatch;
  championIsHome: boolean;
}) {
  const champion = championIsHome
    ? { name: match.homeTeam, flag: match.homeFlag, score: match.homeScore }
    : { name: match.awayTeam, flag: match.awayFlag, score: match.awayScore };
  const runnerUp = championIsHome
    ? { name: match.awayTeam, flag: match.awayFlag, score: match.awayScore }
    : { name: match.homeTeam, flag: match.homeFlag, score: match.homeScore };

  return (
    <Link
      href={`/matches/${match.id}`}
      className="relative block w-full rounded-2xl overflow-hidden bg-gradient-to-br from-amber-400 via-yellow-300 to-amber-500 text-amber-950 shadow-xl ring-2 ring-amber-300"
    >
      <div className="absolute -top-4 -right-4 text-7xl opacity-30 rotate-12">🏆</div>
      <div className="relative px-3 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-[0.2em]">
            <Crown className="h-3 w-3" fill="currentColor" /> Chempion
          </span>
          <span className="text-[9px] font-bold opacity-70">Final</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-3xl drop-shadow">{champion.flag ?? "🏆"}</span>
          <div className="flex-1 min-w-0">
            <div className="font-black text-[14px] truncate leading-tight">{champion.name}</div>
            <div className="text-[10px] font-bold opacity-80 truncate">
              vs {runnerUp.name} {runnerUp.flag ?? ""}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xl font-black tabular-nums leading-none">
              {champion.score}:{runnerUp.score}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function SideRow({
  name,
  flag,
  won,
  lost,
  placeholder,
  score,
}: {
  name: string;
  flag?: string | null;
  won?: boolean;
  lost?: boolean;
  placeholder?: boolean;
  score?: number | null;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 min-w-0 rounded-lg px-1.5 py-1 transition-colors",
        won && "bg-emerald-50"
      )}
    >
      <span className="text-lg shrink-0">{flag ?? (placeholder ? "❓" : "⚽")}</span>
      <span
        className={cn(
          "flex-1 truncate font-bold text-[13px]",
          won && "text-emerald-700",
          lost && "text-slate-400",
          placeholder && "text-slate-400 italic font-semibold"
        )}
      >
        {name}
      </span>
      {score != null && (
        <span
          className={cn(
            "tabular-nums font-extrabold text-[17px] shrink-0 min-w-[20px] text-right",
            won && "text-emerald-700",
            lost && "text-slate-400"
          )}
        >
          {score}
        </span>
      )}
      {won && (
        <span
          aria-hidden
          className="text-emerald-600 shrink-0"
          title="G'olib"
        >
          ✓
        </span>
      )}
    </div>
  );
}
