import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ArrowLeft, Save, Lock } from "lucide-react";
import { isAdmin } from "@/lib/auth";
import { getMatch, getMatchPredictions, getAllUsers } from "@/lib/queries";
import { connectDB } from "@/lib/db";
import { Prediction } from "@/lib/models/Prediction";
import { StatusBadge } from "@/components/StatusBadge";
import { formatKickoff } from "@/lib/utils";
import { computePoints, isExactMatch } from "@/lib/scoring";

export const dynamic = "force-dynamic";

export default async function EditPredictionsPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  if (!(await isAdmin())) redirect("/admin");
  const { matchId } = await params;
  const match = await getMatch(matchId);
  if (!match) notFound();
  const [users, predictions] = await Promise.all([
    getAllUsers(),
    getMatchPredictions(matchId),
  ]);
  const predMap = new Map(predictions.map((p) => [p.user.id, p]));
  const kickoffPassed = new Date(match.kickoff).getTime() < Date.now();
  const isLocked = kickoffPassed; // O'yin boshlangach taxmin o'zgartirib bo'lmaydi

  async function savePredictions(formData: FormData) {
    "use server";
    if (!(await isAdmin())) redirect("/admin");
    // Server-tomonda qattiq blok: o'yin boshlangan bo'lsa, hech narsa saqlanmaydi
    const fresh = await getMatch(matchId);
    if (!fresh) redirect("/admin/dashboard");
    if (new Date(fresh.kickoff).getTime() < Date.now()) {
      // Block — sukut qaytamiz, hech narsa o'zgarmaydi
      redirect(`/admin/dashboard/${matchId}?locked=1`);
    }
    await connectDB();
    const ids = (formData.getAll("userId") as string[]).filter(Boolean);
    for (const uid of ids) {
      const homeStr = String(formData.get(`home_${uid}`) ?? "");
      const awayStr = String(formData.get(`away_${uid}`) ?? "");
      if (homeStr === "" || awayStr === "") continue;
      const home = Number(homeStr);
      const away = Number(awayStr);
      if (!Number.isFinite(home) || !Number.isFinite(away) || home < 0 || away < 0) continue;
      // O'yin tugagan bo'lsa ochkoni hisoblash (lekin yuqorida blokladik, faqat zaxira)
      const points = 0;
      const exact = false;
      await Prediction.updateOne(
        { userId: uid, matchId },
        { $set: { predHome: home, predAway: away, points, isExact: exact } },
        { upsert: true }
      );
    }
    revalidatePath(`/admin/dashboard/${matchId}`);
    revalidatePath(`/matches/${matchId}`);
    revalidatePath("/");
  }

  return (
    <div className="space-y-5">
      <Link
        href="/admin/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
      >
        <ArrowLeft className="h-4 w-4" /> Admin paneliga qaytish
      </Link>

      <section className="rounded-2xl bg-white border border-[var(--border)] p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
            {match.stage}
          </span>
          <StatusBadge status={match.status} />
        </div>
        <div className="text-lg sm:text-xl font-bold">
          {match.homeFlag} {match.homeTeam} — {match.awayTeam} {match.awayFlag}
        </div>
        <div className="text-xs text-[var(--muted)] mt-1">⏰ {formatKickoff(match.kickoff)}</div>
        {match.status === "FINISHED" && match.homeScore != null && (
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 font-semibold">
            Natija: {match.homeScore} : {match.awayScore}
          </div>
        )}
      </section>

      {isLocked ? (
        <LockedView
          users={users}
          predMap={predMap}
          match={match}
        />
      ) : (
        <form action={savePredictions} className="space-y-3">
          <h2 className="text-base font-bold">Taxminlarni kiriting</h2>
          <ul className="rounded-2xl bg-white border border-[var(--border)] divide-y divide-[var(--border)] overflow-hidden">
            {users.map((u) => {
              const existing = predMap.get(u.id);
              return (
                <li key={u.id} className="flex items-center gap-3 px-4 py-3">
                  <input type="hidden" name="userId" value={u.id} />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate flex items-center gap-1.5">
                      {u.name}
                      {u.isAdmin && (
                        <span className="text-[10px] uppercase tracking-wide bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">
                          admin
                        </span>
                      )}
                    </div>
                  </div>
                  <ScoreInput name={`home_${u.id}`} defaultValue={existing?.predHome} />
                  <span className="text-[var(--muted)]">:</span>
                  <ScoreInput name={`away_${u.id}`} defaultValue={existing?.predAway} />
                </li>
              );
            })}
          </ul>
          <button
            type="submit"
            className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold w-full sm:w-auto justify-center"
          >
            <Save className="h-4 w-4" /> Saqlash
          </button>
        </form>
      )}
    </div>
  );
}

function LockedView({
  users,
  predMap,
  match,
}: {
  users: { id: string; name: string; isAdmin: boolean }[];
  predMap: Map<
    string,
    { predHome: number; predAway: number; points: number; isExact: boolean }
  >;
  match: { status: string };
}) {
  const isFinished = match.status === "FINISHED";
  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-amber-50 border-2 border-amber-300 p-4 flex items-start gap-3">
        <div className="grid place-items-center h-9 w-9 rounded-xl bg-amber-200 text-amber-800 shrink-0">
          <Lock className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-extrabold text-amber-900 text-[14px]">
            Taxminlar muzlatildi
          </div>
          <div className="text-[12px] text-amber-800 mt-0.5">
            O'yin allaqachon boshlangan — taxminlarni o'zgartirib bo'lmaydi.
          </div>
        </div>
      </div>

      <h2 className="text-base font-bold">Kiritilgan taxminlar</h2>
      <ul className="rounded-2xl bg-white border border-[var(--border)] divide-y divide-[var(--border)] overflow-hidden">
        {users.map((u) => {
          const existing = predMap.get(u.id);
          return (
            <li key={u.id} className="flex items-center gap-3 px-4 py-3">
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate flex items-center gap-1.5">
                  {u.name}
                  {u.isAdmin && (
                    <span className="text-[10px] uppercase tracking-wide bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">
                      admin
                    </span>
                  )}
                </div>
                {existing && isFinished && (
                  <div
                    className={`text-[11px] font-semibold ${
                      existing.points > 0 ? "text-emerald-700" : "text-slate-400"
                    }`}
                  >
                    {existing.isExact
                      ? `✓ aniq topdi (+${existing.points})`
                      : existing.points > 0
                      ? "✓ g'olibni topdi (+1)"
                      : "✗ topa olmadi"}
                  </div>
                )}
              </div>
              {existing ? (
                <span className="font-extrabold tabular-nums text-[16px] px-3 py-1 rounded-lg bg-slate-900 text-white">
                  {existing.predHome}:{existing.predAway}
                </span>
              ) : (
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                  Kiritilmagan
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ScoreInput({ name, defaultValue }: { name: string; defaultValue?: number }) {
  return (
    <input
      type="number"
      inputMode="numeric"
      min={0}
      max={99}
      name={name}
      defaultValue={defaultValue ?? ""}
      className="w-14 h-11 text-center text-lg font-bold rounded-xl border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-emerald-500"
    />
  );
}
