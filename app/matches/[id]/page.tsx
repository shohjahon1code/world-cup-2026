import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, MinusCircle, MapPin, Sparkles, PartyPopper, Trophy } from "lucide-react";
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
  const exactCount = predictions.filter((p) => p.isExact).length;
  const outcomeOnlyCount = predictions.filter((p) => !p.isExact && p.points > 0).length;

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
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <StatCard label="Aniq topdi" value={exactCount} suffix={`/ ${predictions.length}`} accent="emerald" />
          <StatCard label="G'olibni topdi" value={outcomeOnlyCount} accent="blue" />
          <StatCard label="Taxminlar" value={predictions.length} accent="slate" />
        </div>
      )}

      {/* Winners spotlight */}
      {isFinished && exactCount > 0 && (
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-100 via-yellow-50 to-amber-100 border-2 border-amber-300 px-4 py-3.5">
          <div className="absolute -right-4 -top-4 text-6xl opacity-20 rotate-12">🎉</div>
          <div className="relative flex items-center gap-2.5">
            <PartyPopper className="h-5 w-5 text-amber-600 shrink-0" />
            <div className="min-w-0">
              <div className="text-[10.5px] uppercase tracking-[0.2em] font-extrabold text-amber-700">
                Aniq hisobni topdi
              </div>
              <div className="font-extrabold text-amber-900 truncate">
                {predictions
                  .filter((p) => p.isExact)
                  .map((p) => `${p.user.name} (+${p.points})`)
                  .join(" · ")}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Predictions */}
      <section>
        <h2 className="text-lg font-extrabold mb-3 flex items-center justify-between">
          <span>Do'stlarning taxminlari</span>
          {!isFinished && (
            <span className="text-[10.5px] uppercase tracking-wider text-slate-500 font-bold">
              O'yin tugaganda kim aniq topgani ko'rinadi
            </span>
          )}
        </h2>
        {predictions.length ? (
          <ul className="rounded-2xl bg-white border border-[var(--border)] divide-y divide-[var(--border)] overflow-hidden shadow-sm">
            {predictions.map((p) => {
              const isExact = isFinished && p.isExact;
              const isOutcome = isFinished && !p.isExact && p.points > 0;
              const isLoser = isFinished && p.points === 0;
              return (
                <li
                  key={p.id}
                  className={`relative flex items-center gap-3 px-4 py-3 transition-colors ${
                    isExact
                      ? "bg-gradient-to-r from-emerald-50 via-emerald-50/70 to-amber-50"
                      : isOutcome
                      ? "bg-emerald-50/40"
                      : isLoser
                      ? "opacity-70"
                      : ""
                  }`}
                >
                  {isExact && (
                    <span
                      aria-hidden
                      className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-500 to-amber-500"
                    />
                  )}
                  {isExact && (
                    <Trophy className="h-5 w-5 text-amber-500 shrink-0" fill="currentColor" />
                  )}
                  <Link
                    href={`/users/${p.user.id}`}
                    className={`flex-1 min-w-0 font-bold truncate hover:text-emerald-700 flex items-center gap-1.5 ${
                      isExact ? "text-emerald-900" : ""
                    }`}
                  >
                    {p.user.name}
                    {p.user.isAdmin && (
                      <span className="text-[9.5px] uppercase tracking-wider bg-emerald-600 text-white px-1.5 py-0.5 rounded font-bold">
                        admin
                      </span>
                    )}
                    {isExact && (
                      <span className="inline-flex items-center gap-0.5 text-[9.5px] uppercase tracking-wider bg-amber-500 text-white px-1.5 py-0.5 rounded font-extrabold">
                        <Sparkles className="h-2.5 w-2.5" /> +{p.points}
                      </span>
                    )}
                    {isOutcome && (
                      <span className="inline-flex items-center gap-0.5 text-[9.5px] uppercase tracking-wider bg-emerald-600 text-white px-1.5 py-0.5 rounded font-extrabold">
                        +1
                      </span>
                    )}
                  </Link>
                  <span
                    className={`font-extrabold tabular-nums text-base sm:text-lg px-2.5 py-1 rounded-lg shadow-sm ${
                      isExact
                        ? "bg-gradient-to-br from-emerald-500 to-emerald-700 text-white ring-2 ring-amber-400"
                        : isOutcome
                        ? "bg-emerald-100 text-emerald-800"
                        : isLoser
                        ? "bg-slate-100 text-slate-400 line-through decoration-2"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {p.predHome}:{p.predAway}
                  </span>
                  <div className="w-6 grid place-items-center">
                    {(isExact || isOutcome) && (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    )}
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
  accent: "emerald" | "blue" | "slate";
}) {
  const grad =
    accent === "emerald"
      ? "from-emerald-50 to-white border-emerald-200"
      : accent === "blue"
      ? "from-blue-50 to-white border-blue-200"
      : "from-slate-50 to-white border-slate-200";
  const num =
    accent === "emerald"
      ? "text-emerald-700"
      : accent === "blue"
      ? "text-blue-700"
      : "text-slate-700";
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
