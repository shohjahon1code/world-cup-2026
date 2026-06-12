import Link from "next/link";
import { CalendarClock, ArrowRight } from "lucide-react";
import { formatKickoff } from "@/lib/utils";

type Props = {
  match?: {
    id: string;
    homeTeam: string;
    awayTeam: string;
    homeFlag?: string | null;
    awayFlag?: string | null;
    kickoff: string | Date;
    stage: string;
    status: string;
    homeScore: number | null;
    awayScore: number | null;
  } | null;
  totalMatches: number;
  totalPredictions: number;
};

export function HeroNextMatch({ match, totalMatches, totalPredictions }: Props) {
  return (
    <section className="relative overflow-hidden rounded-3xl shadow-xl shadow-emerald-900/10 bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600 text-white">
      <div className="absolute inset-0 pitch-stripes opacity-60" />
      <div className="absolute -top-12 -right-12 h-44 w-44 rounded-full bg-yellow-300/15 blur-3xl" />
      <div className="absolute -bottom-16 -left-12 h-44 w-44 rounded-full bg-blue-400/15 blur-3xl" />

      <div className="relative px-5 sm:px-7 pt-6 sm:pt-7 pb-5">
        <div className="flex items-center gap-2 text-[10.5px] uppercase tracking-[0.25em] font-bold text-emerald-100/95">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 live-dot" />
          FIFA World Cup 2026
        </div>
        <h1 className="mt-1.5 text-2xl sm:text-[28px] font-extrabold leading-tight">
          Do'stlar Chempionati
        </h1>
        <p className="mt-1 text-sm sm:text-[15px] text-emerald-50/95 max-w-md">
          Aniq hisobni topdingmi — <b>gollar yig'indisi</b> (0:0 → 2). Faqat
          g'olibni yoki durangni topgan ham — <b>+1</b>. Yakunda eng ko'p ochko — chempion!
        </p>

        {match && (
          <Link
            href={`/matches/${match.id}`}
            className="mt-5 group block rounded-2xl glass text-slate-900 px-4 py-3.5 shadow-lg shadow-emerald-900/10 ring-1 ring-white/40 hover:ring-emerald-300 transition"
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                <CalendarClock className="h-3 w-3" />
                {match.status === "LIVE" ? "JONLI O'YIN" : match.status === "FINISHED" ? "Tugadi" : "Keyingi o'yin"}
              </span>
              <span className="text-[11px] font-semibold text-slate-500">{match.stage}</span>
            </div>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <div className="flex items-center justify-end gap-2 min-w-0">
                <span className="font-bold text-sm sm:text-base truncate">{match.homeTeam}</span>
                <span className="text-3xl sm:text-4xl shrink-0">{match.homeFlag ?? "⚽"}</span>
              </div>
              <div className="grid place-items-center">
                {match.homeScore != null && match.awayScore != null ? (
                  <div className="px-3 py-1.5 rounded-xl bg-slate-900 text-white font-extrabold text-lg sm:text-xl tabular-nums shadow-md">
                    {match.homeScore} : {match.awayScore}
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="text-[10px] uppercase tracking-wider text-emerald-700 font-bold">Boshlanish</div>
                    <div className="text-sm font-bold tabular-nums text-slate-800">
                      {formatKickoff(match.kickoff)}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-3xl sm:text-4xl shrink-0">{match.awayFlag ?? "⚽"}</span>
                <span className="font-bold text-sm sm:text-base truncate">{match.awayTeam}</span>
              </div>
            </div>
            <div className="mt-2.5 flex items-center justify-end gap-1 text-[12px] font-semibold text-emerald-700 group-hover:text-emerald-900">
              Tafsilotlar <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </Link>
        )}

        <div className="mt-4 grid grid-cols-2 gap-2 sm:gap-3">
          <StatChip label="Jami o'yinlar" value={totalMatches} />
          <StatChip label="Taxminlar" value={totalPredictions} />
        </div>
      </div>
    </section>
  );
}

function StatChip({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl bg-white/15 backdrop-blur px-3 py-2 text-center ring-1 ring-white/20">
      <div className="text-xl sm:text-2xl font-extrabold tabular-nums leading-tight">{value}</div>
      <div className="text-[10px] uppercase tracking-wider opacity-90">{label}</div>
    </div>
  );
}
