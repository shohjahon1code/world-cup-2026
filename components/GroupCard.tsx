import Link from "next/link";
import { Standings } from "./Standings";
import { smartMatchTime } from "@/lib/utils";
import type { GroupBundle } from "@/lib/tournament";

export function GroupCard({ bundle }: { bundle: GroupBundle }) {
  const finished = bundle.matches.filter((m) => m.status === "FINISHED").length;
  const total = bundle.matches.length;
  const pct = total > 0 ? Math.round((finished / total) * 100) : 0;

  return (
    <section className="rounded-2xl bg-white border border-[var(--border)] overflow-hidden shadow-sm">
      <header className="px-4 py-3 bg-gradient-to-r from-emerald-700 to-emerald-600 text-white">
        <div className="flex items-center gap-3">
          <span className="inline-grid place-items-center h-10 w-10 rounded-xl bg-white/15 backdrop-blur font-black text-lg shadow-inner">
            {bundle.letter}
          </span>
          <div className="flex-1 min-w-0">
            <h3 className="font-extrabold text-base leading-tight">Guruh {bundle.letter}</h3>
            <div className="text-[11px] text-emerald-50/90 font-semibold mt-0.5">
              {finished}/{total} o'yin tugadi
            </div>
          </div>
          {pct > 0 && (
            <div className="text-right">
              <div className="text-xl font-black tabular-nums">{pct}%</div>
            </div>
          )}
        </div>
        {pct > 0 && (
          <div className="mt-2 h-1 rounded-full bg-white/20 overflow-hidden">
            <div className="h-full bg-amber-300" style={{ width: `${pct}%` }} />
          </div>
        )}
      </header>

      <div className="p-3">
        <Standings rows={bundle.standings} />
      </div>

      <div className="px-3 pb-3">
        <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-extrabold mb-2 px-1">
          O'yinlar
        </div>
        <ul className="divide-y divide-[var(--border)] rounded-xl border border-[var(--border)] overflow-hidden">
          {bundle.matches.map((m) => (
            <li key={m.id}>
              <MatchRow match={m} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function MatchRow({ match: m }: { match: import("@/lib/queries").SerializedMatch }) {
  const hasScore = m.homeScore != null && m.awayScore != null;
  const isFinished = m.status === "FINISHED";
  const isLive = m.status === "LIVE";
  const homeWon = hasScore && m.homeScore! > m.awayScore!;
  const awayWon = hasScore && m.awayScore! > m.homeScore!;

  return (
    <Link href={`/matches/${m.id}`} className="block px-3 py-2 hover:bg-emerald-50/60 transition-colors">
      {/* Top row: teams + score */}
      <div className="flex items-center gap-2">
        <span className="flex-1 min-w-0 flex items-center gap-1.5">
          <span className="text-base shrink-0">{m.homeFlag ?? "⚽"}</span>
          <span
            className={`truncate font-bold text-[13px] ${
              homeWon ? "text-emerald-700" : awayWon ? "text-slate-400" : ""
            }`}
          >
            {m.homeTeam}
          </span>
        </span>

        {hasScore ? (
          <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white font-extrabold tabular-nums text-[13px] shrink-0">
            {m.homeScore}:{m.awayScore}
          </span>
        ) : (
          <span className="text-[10px] font-bold text-slate-300 shrink-0 uppercase tracking-wider">vs</span>
        )}

        <span className="flex-1 min-w-0 flex items-center gap-1.5 justify-end">
          <span
            className={`truncate font-bold text-[13px] text-right ${
              awayWon ? "text-emerald-700" : homeWon ? "text-slate-400" : ""
            }`}
          >
            {m.awayTeam}
          </span>
          <span className="text-base shrink-0">{m.awayFlag ?? "⚽"}</span>
        </span>
      </div>

      {/* Bottom row: time / status */}
      <div className="mt-1 text-[10px] text-slate-400 font-bold text-center">
        {isLive ? (
          <span className="inline-flex items-center gap-1 text-red-600 uppercase tracking-wider">
            <span className="h-1.5 w-1.5 rounded-full bg-red-600 live-dot" />
            JONLI
          </span>
        ) : isFinished ? (
          <span className="text-emerald-700 uppercase tracking-wider">Tugadi</span>
        ) : (
          <span>{smartMatchTime(m.kickoff)}</span>
        )}
      </div>
    </Link>
  );
}
