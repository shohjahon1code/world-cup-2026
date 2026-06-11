import Link from "next/link";
import { StatusBadge } from "./StatusBadge";
import { formatTimeOnly, formatDateOnly } from "@/lib/utils";

type MatchCardProps = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeFlag?: string | null;
  awayFlag?: string | null;
  kickoff: Date | string;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  stage: string;
  showDate?: boolean;
};

export function MatchCard(m: MatchCardProps) {
  const hasScore = m.homeScore != null && m.awayScore != null;
  const winner = hasScore && m.homeScore !== m.awayScore
    ? m.homeScore! > m.awayScore!
      ? "home"
      : "away"
    : null;

  return (
    <Link
      href={`/matches/${m.id}`}
      className="card-hover block rounded-2xl bg-white border border-[var(--border)] overflow-hidden"
    >
      <div className="px-4 pt-3 pb-2 flex items-center justify-between gap-2">
        <span className="text-[10.5px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
          {m.stage}
        </span>
        <StatusBadge status={m.status} />
      </div>
      <div className="px-4 py-3 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <Team flag={m.homeFlag} name={m.homeTeam} align="end" dim={winner === "away"} />
        <div className="grid place-items-center min-w-[72px]">
          {hasScore ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 text-white shadow-sm">
              <span className={`text-xl sm:text-2xl font-extrabold tabular-nums ${winner === "home" ? "text-emerald-300" : ""}`}>
                {m.homeScore}
              </span>
              <span className="text-slate-400 font-light">:</span>
              <span className={`text-xl sm:text-2xl font-extrabold tabular-nums ${winner === "away" ? "text-emerald-300" : ""}`}>
                {m.awayScore}
              </span>
            </div>
          ) : (
            <span className="text-base font-bold tabular-nums text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg">
              {formatTimeOnly(m.kickoff)}
            </span>
          )}
        </div>
        <Team flag={m.awayFlag} name={m.awayTeam} align="start" dim={winner === "home"} />
      </div>
      {m.showDate && (
        <div className="px-4 pb-3 text-center text-[11px] text-[var(--muted)]">
          {formatDateOnly(m.kickoff)}
        </div>
      )}
    </Link>
  );
}

function Team({
  flag,
  name,
  align,
  dim,
}: {
  flag?: string | null;
  name: string;
  align: "start" | "end";
  dim?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2 min-w-0 transition-opacity ${
        dim ? "opacity-50" : ""
      } ${align === "end" ? "justify-end" : "justify-start"}`}
    >
      {align === "start" && <span className="text-3xl shrink-0">{flag ?? "⚽"}</span>}
      <span className="font-bold text-sm sm:text-base truncate">{name}</span>
      {align === "end" && <span className="text-3xl shrink-0">{flag ?? "⚽"}</span>}
    </div>
  );
}
