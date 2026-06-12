import { cn } from "@/lib/utils";
import type { StandingRow } from "@/lib/standings";

type Props = {
  rows: StandingRow[];
  showZones?: boolean;
};

export function Standings({ rows, showZones = true }: Props) {
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-white">
      {/* Header */}
      <div className="grid grid-cols-[28px_1fr_28px_38px_38px] sm:grid-cols-[28px_1fr_28px_28px_28px_28px_38px_38px] gap-1 px-2.5 py-1.5 bg-slate-50 text-[9.5px] uppercase tracking-wider text-slate-400 font-bold">
        <span className="text-center">#</span>
        <span>Jamoa</span>
        <span className="text-center">O</span>
        <span className="text-center hidden sm:block" title="G'alaba">Y</span>
        <span className="text-center hidden sm:block" title="Durang">D</span>
        <span className="text-center hidden sm:block" title="Mag'lubiyat">M</span>
        <span className="text-center" title="Gol farqi">±</span>
        <span className="text-center text-emerald-700">Och</span>
      </div>

      {/* Rows */}
      <ul className="divide-y divide-[var(--border)]">
        {rows.map((r, i) => {
          const rank = i + 1;
          const zone = showZones ? zoneFor(rank) : "none";
          return (
            <li
              key={r.team}
              className={cn(
                "grid grid-cols-[28px_1fr_28px_38px_38px] sm:grid-cols-[28px_1fr_28px_28px_28px_28px_38px_38px] gap-1 px-2.5 py-2 items-center",
                zone === "qualified" && "bg-emerald-50/50",
                zone === "potential" && "bg-amber-50/40"
              )}
            >
              <span
                className={cn(
                  "inline-grid place-items-center h-6 w-6 mx-auto rounded-md font-extrabold text-[11px]",
                  zone === "qualified" && "bg-emerald-600 text-white",
                  zone === "potential" && "bg-amber-500 text-white",
                  zone === "eliminated" && "bg-slate-100 text-slate-500",
                  zone === "none" && "bg-slate-100 text-slate-500"
                )}
              >
                {rank}
              </span>

              <span className="flex items-center gap-1.5 min-w-0">
                <span className="text-base shrink-0">{r.flag ?? "⚽"}</span>
                <span className="font-bold text-[13px] truncate">{r.team}</span>
              </span>

              <span className="text-center text-[12px] tabular-nums text-slate-600">{r.played}</span>
              <span className="text-center text-[12px] tabular-nums text-emerald-700 font-semibold hidden sm:block">{r.won}</span>
              <span className="text-center text-[12px] tabular-nums text-slate-600 hidden sm:block">{r.drawn}</span>
              <span className="text-center text-[12px] tabular-nums text-rose-600 hidden sm:block">{r.lost}</span>
              <span
                className={cn(
                  "text-center text-[12px] tabular-nums font-semibold",
                  r.gd > 0 && "text-emerald-700",
                  r.gd < 0 && "text-rose-600",
                  r.gd === 0 && "text-slate-500"
                )}
              >
                {r.gd > 0 ? `+${r.gd}` : r.gd}
              </span>
              <span className="text-center text-[16px] font-black tabular-nums text-slate-900">
                {r.points}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function zoneFor(rank: number): "qualified" | "potential" | "eliminated" | "none" {
  if (rank <= 2) return "qualified";
  if (rank === 3) return "potential";
  return "eliminated";
}
