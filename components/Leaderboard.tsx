import Link from "next/link";
import { Trophy, Medal, Crown } from "lucide-react";

export type LeaderRow = {
  id: string;
  name: string;
  points: number;
  exactCount: number;
  totalPredictions: number;
  isAdmin?: boolean;
};

export function Leaderboard({ rows }: { rows: LeaderRow[] }) {
  const top3 = rows.slice(0, 3);
  const rest = rows.slice(3);
  const hasAnyPoints = rows.some((r) => r.points > 0);

  return (
    <div className="space-y-4">
      {top3.length === 3 && hasAnyPoints && <Podium rows={top3} />}

      <div className="rounded-2xl bg-white border border-[var(--border)] overflow-hidden">
        <div className="px-4 py-3 flex items-center gap-2 border-b border-[var(--border)] bg-gradient-to-r from-emerald-50 via-white to-white">
          <div className="grid place-items-center h-7 w-7 rounded-lg bg-emerald-600 text-white">
            <Trophy className="h-4 w-4" />
          </div>
          <h2 className="font-bold text-[15px]">To'liq reyting</h2>
          <span className="ml-auto text-[11px] uppercase tracking-wider text-[var(--muted)] font-semibold">
            Ochkolar
          </span>
        </div>
        <ol className="divide-y divide-[var(--border)]">
          {rows.map((r, i) => (
            <li key={r.id}>
              <Link
                href={`/users/${r.id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-emerald-50/50 transition-colors"
              >
                <RankBadge rank={i + 1} />
                <div className="flex-1 min-w-0">
                  <div className="font-bold truncate flex items-center gap-1.5">
                    {r.name}
                    {r.isAdmin && (
                      <span className="text-[9.5px] uppercase tracking-wider bg-emerald-600 text-white px-1.5 py-0.5 rounded font-bold">
                        admin
                      </span>
                    )}
                  </div>
                  <div className="text-[11.5px] text-[var(--muted)]">
                    {r.exactCount > 0 ? (
                      <>
                        <span className="text-emerald-700 font-semibold">{r.exactCount} ta aniq</span>
                        <span> · {r.totalPredictions} taxmin</span>
                      </>
                    ) : (
                      <span>{r.totalPredictions} ta taxmin</span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-extrabold tabular-nums leading-none">{r.points}</div>
                  <div className="text-[10px] uppercase text-[var(--muted)] tracking-wider mt-0.5">ochko</div>
                </div>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function Podium({ rows }: { rows: LeaderRow[] }) {
  // O'rin: ['silver' (2), 'gold' (1), 'bronze' (3)]
  const positions = [
    { row: rows[1], h: "h-20", grad: "from-slate-300 to-slate-200", text: "text-slate-700", rank: 2 },
    { row: rows[0], h: "h-28", grad: "from-amber-400 to-yellow-300", text: "text-amber-900", rank: 1, crown: true },
    { row: rows[2], h: "h-16", grad: "from-orange-400 to-amber-300", text: "text-orange-900", rank: 3 },
  ];

  return (
    <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900 text-white p-5 pitch-stripes overflow-hidden relative">
      <div className="text-center mb-3">
        <p className="text-[10.5px] uppercase tracking-[0.25em] text-emerald-200/80 font-bold">
          ★ Yetakchilar ★
        </p>
      </div>
      <div className="grid grid-cols-3 items-end gap-2 sm:gap-3">
        {positions.map((p) => (
          <Link
            key={p.row.id}
            href={`/users/${p.row.id}`}
            className="flex flex-col items-center gap-2 group"
          >
            {p.crown && <Crown className="h-5 w-5 text-yellow-300 crown" fill="currentColor" />}
            <div className="text-2xl sm:text-3xl">{rankEmoji(p.rank)}</div>
            <div className="text-center min-w-0 w-full">
              <div className="text-[11.5px] sm:text-xs font-bold truncate group-hover:text-emerald-200">
                {p.row.name}
              </div>
              <div className="text-base sm:text-lg font-extrabold tabular-nums">
                {p.row.points} <span className="text-[10px] font-medium opacity-70">och</span>
              </div>
            </div>
            <div
              className={`w-full ${p.h} rounded-t-lg bg-gradient-to-b ${p.grad} grid place-items-center ${p.text} font-extrabold text-2xl shadow-lg ring-1 ring-white/20`}
            >
              {p.rank}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function rankEmoji(r: number) {
  return r === 1 ? "🥇" : r === 2 ? "🥈" : "🥉";
}

function RankBadge({ rank }: { rank: number }) {
  const top: Record<number, string> = {
    1: "bg-gradient-to-br from-amber-400 to-yellow-500 text-white shadow-amber-200 shadow-md",
    2: "bg-gradient-to-br from-slate-300 to-slate-400 text-white shadow-slate-200 shadow-md",
    3: "bg-gradient-to-br from-orange-400 to-amber-500 text-white shadow-orange-200 shadow-md",
  };
  const cls = top[rank] ?? "bg-slate-100 text-slate-600";
  return (
    <div className={`grid place-items-center h-9 w-9 rounded-xl font-extrabold text-sm shrink-0 ${cls}`}>
      {rank <= 3 ? <Medal className="h-4 w-4" /> : rank}
    </div>
  );
}
