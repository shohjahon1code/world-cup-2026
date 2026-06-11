import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, MinusCircle, MapPin } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { getMatch, getMatchPredictions } from "@/lib/queries";
import { formatKickoff } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const match = await getMatch(id);
  if (!match) notFound();
  const predictions = await getMatchPredictions(id);
  const hasScore = match.homeScore != null && match.awayScore != null;
  const isFinished = match.status === "FINISHED";
  const winnersCount = predictions.filter((p) => p.points === 1).length;

  return (
    <div className="space-y-5">
      <Link
        href="/matches"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-emerald-700"
      >
        <ArrowLeft className="h-4 w-4" /> Jadvalga qaytish
      </Link>

      {/* Match heading card */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900 text-white shadow-xl">
        <div className="absolute inset-0 pitch-stripes opacity-50" />
        <div className="relative px-5 sm:px-6 pt-5 pb-6">
          <div className="flex items-center justify-between gap-2 mb-4">
            <span className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-emerald-200/90 bg-white/10 px-2.5 py-1 rounded-full">
              {match.stage}
            </span>
            <StatusBadge status={match.status} />
          </div>

          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-5">
            <div className="flex flex-col items-center gap-2">
              <span className="text-5xl sm:text-6xl drop-shadow-lg">{match.homeFlag ?? "⚽"}</span>
              <span className="font-extrabold text-sm sm:text-base text-center leading-tight">
                {match.homeTeam}
              </span>
            </div>
            <div className="grid place-items-center min-w-[88px]">
              {hasScore ? (
                <div className="text-center">
                  <div className="text-3xl sm:text-5xl font-black tabular-nums tracking-tight leading-none">
                    {match.homeScore}
                    <span className="text-emerald-300/50 font-light mx-2">:</span>
                    {match.awayScore}
                  </div>
                  {isFinished && (
                    <div className="mt-1.5 text-[10px] uppercase tracking-wider text-emerald-200/80 font-bold">
                      Yakuniy
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center">
                  <div className="text-[10px] uppercase tracking-wider text-emerald-200/80 font-bold">
                    vs
                  </div>
                  <div className="mt-1 text-2xl sm:text-3xl font-extrabold tabular-nums">⚔</div>
                </div>
              )}
            </div>
            <div className="flex flex-col items-center gap-2">
              <span className="text-5xl sm:text-6xl drop-shadow-lg">{match.awayFlag ?? "⚽"}</span>
              <span className="font-extrabold text-sm sm:text-base text-center leading-tight">
                {match.awayTeam}
              </span>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-center gap-2 text-xs sm:text-sm text-emerald-100/95">
            <MapPin className="h-3.5 w-3.5" />
            {formatKickoff(match.kickoff)} <span className="opacity-60">· Toshkent vaqti</span>
          </div>
        </div>
      </section>

      {/* Stats summary */}
      {isFinished && predictions.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Aniq topganlar" value={winnersCount} suffix={`/ ${predictions.length}`} accent="emerald" />
          <StatCard label="Berilgan taxminlar" value={predictions.length} accent="blue" />
        </div>
      )}

      {/* Predictions */}
      <section>
        <h2 className="text-lg font-extrabold mb-3">Do'stlarning taxminlari</h2>
        {predictions.length ? (
          <ul className="rounded-2xl bg-white border border-[var(--border)] divide-y divide-[var(--border)] overflow-hidden shadow-sm">
            {predictions.map((p) => {
              const isWinner = isFinished && p.points === 1;
              const isLoser = isFinished && p.points === 0;
              return (
                <li
                  key={p.id}
                  className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                    isWinner ? "bg-emerald-50" : ""
                  }`}
                >
                  <Link
                    href={`/users/${p.user.id}`}
                    className="flex-1 min-w-0 font-bold truncate hover:text-emerald-700 flex items-center gap-1.5"
                  >
                    {p.user.name}
                    {p.user.isAdmin && (
                      <span className="text-[9.5px] uppercase tracking-wider bg-emerald-600 text-white px-1.5 py-0.5 rounded font-bold">
                        admin
                      </span>
                    )}
                  </Link>
                  <span
                    className={`font-extrabold tabular-nums text-base sm:text-lg px-2.5 py-1 rounded-lg ${
                      isWinner ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {p.predHome}:{p.predAway}
                  </span>
                  <div className="w-6 grid place-items-center">
                    {isWinner && <CheckCircle2 className="h-5 w-5 text-emerald-600" />}
                    {isLoser && <MinusCircle className="h-5 w-5 text-slate-300" />}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState
            icon="📝"
            title="Hali taxminlar kiritilmagan"
            hint="Admin o'yindan oldin taxminlarni kiritishi kerak"
          />
        )}
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  suffix,
  accent,
}: {
  label: string;
  value: number;
  suffix?: string;
  accent: "emerald" | "blue";
}) {
  const grad =
    accent === "emerald"
      ? "from-emerald-50 to-white border-emerald-200"
      : "from-blue-50 to-white border-blue-200";
  const num = accent === "emerald" ? "text-emerald-700" : "text-blue-700";
  return (
    <div className={`rounded-2xl bg-gradient-to-br ${grad} border px-4 py-3`}>
      <div className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500">{label}</div>
      <div className={`mt-0.5 text-2xl sm:text-3xl font-extrabold tabular-nums ${num}`}>
        {value}
        {suffix && <span className="text-base text-slate-400 font-bold ml-1">{suffix}</span>}
      </div>
    </div>
  );
}
