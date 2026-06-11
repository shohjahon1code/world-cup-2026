import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ArrowLeft, Save } from "lucide-react";
import { isAdmin } from "@/lib/auth";
import { getMatch, getMatchPredictions, getAllUsers } from "@/lib/queries";
import { connectDB } from "@/lib/db";
import { Prediction } from "@/lib/models/Prediction";
import { StatusBadge } from "@/components/StatusBadge";
import { formatKickoff } from "@/lib/utils";

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

  async function savePredictions(formData: FormData) {
    "use server";
    if (!(await isAdmin())) redirect("/admin");
    await connectDB();
    const ids = (formData.getAll("userId") as string[]).filter(Boolean);
    for (const uid of ids) {
      const homeStr = String(formData.get(`home_${uid}`) ?? "");
      const awayStr = String(formData.get(`away_${uid}`) ?? "");
      if (homeStr === "" || awayStr === "") continue;
      const home = Number(homeStr);
      const away = Number(awayStr);
      if (!Number.isFinite(home) || !Number.isFinite(away) || home < 0 || away < 0) continue;
      // Agar o'yin tugagan bo'lsa, ochkoni darrov hisoblaymiz
      let points = 0;
      if (match!.status === "FINISHED" && match!.homeScore != null && match!.awayScore != null) {
        points = home === match!.homeScore && away === match!.awayScore ? 1 : 0;
      }
      await Prediction.updateOne(
        { userId: uid, matchId },
        { $set: { predHome: home, predAway: away, points } },
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
        {match.status === "FINISHED" && (
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 font-semibold">
            Natija: {match.homeScore} : {match.awayScore}
          </div>
        )}
        {kickoffPassed && match.status !== "FINISHED" && (
          <div className="mt-3 text-xs text-amber-700 bg-amber-50 inline-block px-2 py-1 rounded">
            ⚠ O'yin allaqachon boshlangan. Tahrir qilmang.
          </div>
        )}
      </section>

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
                  {existing && match.status === "FINISHED" && (
                    <div
                      className={`text-[11px] font-semibold ${
                        existing.points === 1 ? "text-emerald-700" : "text-slate-400"
                      }`}
                    >
                      {existing.points === 1 ? "✓ aniq topdi (+1)" : "✗ topa olmadi"}
                    </div>
                  )}
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
