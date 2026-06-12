import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, Crown } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/StatusBadge";
import { getUser, getUserPredictions, getLeaderboard } from "@/lib/queries";
import { formatKickoff } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function UserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getUser(id);
  if (!user) notFound();
  const [predictions, leaderboard] = await Promise.all([
    getUserPredictions(id),
    getLeaderboard(),
  ]);
  const totalPoints = predictions.reduce((sum, p) => sum + p.points, 0);
  const exact = predictions.filter((p) => p.isExact).length;
  const rank = leaderboard.findIndex((r) => r.id === id) + 1;
  const isLeader = rank === 1 && totalPoints > 0;

  return (
    <div className="space-y-5">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-emerald-700"
      >
        <ArrowLeft className="h-4 w-4" /> Bosh sahifaga
      </Link>

      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600 text-white shadow-xl">
        <div className="absolute inset-0 pitch-stripes opacity-60" />
        <div className="absolute -top-12 -right-12 h-44 w-44 rounded-full bg-yellow-300/15 blur-3xl" />
        <div className="relative px-5 py-6 sm:px-7 sm:py-7">
          <div className="flex items-center gap-3">
            {isLeader && <Crown className="h-7 w-7 text-yellow-300 crown" fill="currentColor" />}
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight truncate">
                {user.name}
              </h1>
              <div className="mt-1 flex items-center gap-2 text-xs">
                {rank > 0 && (
                  <span className="inline-flex items-center gap-1 bg-white/15 backdrop-blur px-2 py-0.5 rounded-full font-bold tracking-wider">
                    REYTINGDA #{rank}
                  </span>
                )}
                {user.isAdmin && (
                  <span className="inline-flex items-center gap-1 bg-yellow-300 text-emerald-900 px-2 py-0.5 rounded-full font-extrabold tracking-wider">
                    ADMIN
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
            <Stat label="Ochko" value={totalPoints} hi />
            <Stat label="Aniq topdi" value={exact} />
            <Stat label="Taxminlar" value={predictions.length} />
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-extrabold mb-3">Taxminlar tarixi</h2>
        {predictions.length ? (
          <ul className="space-y-2.5">
            {predictions.map((p) => {
              const isFinished = p.match.status === "FINISHED";
              const isExact = p.isExact;
              const isOutcome = !p.isExact && p.points > 0;
              const isWin = isExact || isOutcome;
              return (
                <li key={p.id}>
                  <Link
                    href={`/matches/${p.match.id}`}
                    className={`card-hover block rounded-2xl bg-white border ${
                      isExact
                        ? "border-amber-300 ring-1 ring-amber-100"
                        : isOutcome
                        ? "border-emerald-300 ring-1 ring-emerald-100"
                        : "border-[var(--border)]"
                    } px-4 py-3`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10.5px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        {p.match.stage}
                      </span>
                      <StatusBadge status={p.match.status} />
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0 font-bold text-sm sm:text-[15px] truncate">
                        <span className="mr-1.5">{p.match.homeFlag}</span>
                        {p.match.homeTeam}
                        <span className="text-slate-300 mx-1.5">vs</span>
                        {p.match.awayTeam}
                        <span className="ml-1.5">{p.match.awayFlag}</span>
                      </div>
                    </div>
                    <div className="mt-2.5 flex items-center justify-between gap-2 text-sm">
                      <div className="text-xs text-[var(--muted)]">{formatKickoff(p.match.kickoff)}</div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-slate-500 font-semibold">taxmin:</span>
                        <span className="font-extrabold tabular-nums px-2 py-0.5 rounded-md bg-slate-900 text-white">
                          {p.predHome}:{p.predAway}
                        </span>
                        {isFinished && (
                          <>
                            <span className="text-slate-300">→</span>
                            <span
                              className={`font-extrabold tabular-nums px-2 py-0.5 rounded-md ${
                                isExact
                                  ? "bg-amber-500 text-white"
                                  : isOutcome
                                  ? "bg-emerald-600 text-white"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {p.match.homeScore}:{p.match.awayScore}
                            </span>
                            {isWin && (
                              <span
                                className={`text-[10px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                                  isExact
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-emerald-100 text-emerald-800"
                                }`}
                              >
                                +{p.points}
                              </span>
                            )}
                            {isWin && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                          </>
                        )}
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState
            icon="📝"
            title="Hali taxminlar yo'q"
            hint="Admin o'yinlar oldidan taxminni kiritadi"
          />
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, hi }: { label: string; value: number; hi?: boolean }) {
  return (
    <div
      className={`rounded-xl px-3 py-2.5 text-center ring-1 ${
        hi
          ? "bg-yellow-300 text-emerald-900 ring-yellow-400/40 shadow-lg shadow-yellow-300/20"
          : "bg-white/15 backdrop-blur ring-white/20"
      }`}
    >
      <div className="text-2xl sm:text-3xl font-black tabular-nums leading-tight">{value}</div>
      <div className="text-[10px] uppercase tracking-wider opacity-90 font-bold mt-0.5">{label}</div>
    </div>
  );
}
