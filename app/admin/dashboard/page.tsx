import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { RefreshCcw, LogOut, ArrowRight, Lock } from "lucide-react";
import { isAdmin, clearAdminSession } from "@/lib/auth";
import { getAllMatches } from "@/lib/queries";
import { syncSchedule, syncResults } from "@/lib/sync";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { SectionHeader } from "@/components/SectionHeader";
import { formatKickoff } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  if (!(await isAdmin())) redirect("/admin");
  const matches = await getAllMatches().catch(() => []);
  const now = Date.now();

  async function logout() {
    "use server";
    await clearAdminSession();
    redirect("/admin");
  }

  async function doSyncSchedule() {
    "use server";
    if (!(await isAdmin())) redirect("/admin");
    await syncSchedule();
    revalidatePath("/");
    revalidatePath("/matches");
    revalidatePath("/admin/dashboard");
  }

  async function doSyncResults() {
    "use server";
    if (!(await isAdmin())) redirect("/admin");
    await syncResults();
    revalidatePath("/");
    revalidatePath("/matches");
    revalidatePath("/admin/dashboard");
  }

  // Guruhlash: upcoming (kelajakda), live, recent finished
  const upcoming = matches.filter((m) => new Date(m.kickoff).getTime() > now).slice(0, 30);
  const live = matches.filter((m) => m.status === "LIVE");
  const finished = matches
    .filter((m) => m.status === "FINISHED")
    .sort((a, b) => new Date(b.kickoff).getTime() - new Date(a.kickoff).getTime())
    .slice(0, 10);

  return (
    <div className="space-y-7">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-xl sm:text-2xl font-extrabold flex-1">Admin paneli</h1>
        <form action={doSyncSchedule}>
          <button className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700">
            <RefreshCcw className="h-4 w-4" /> Jadval
          </button>
        </form>
        <form action={doSyncResults}>
          <button className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700">
            <RefreshCcw className="h-4 w-4" /> Natijalar
          </button>
        </form>
        <form action={logout}>
          <button className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-[var(--border)] text-sm font-semibold hover:bg-slate-50">
            <LogOut className="h-4 w-4" /> Chiqish
          </button>
        </form>
      </div>

      {matches.length === 0 && (
        <EmptyState
          icon="⚙️"
          title="O'yinlar yo'q"
          hint="'Jadval' tugmasini bosing — openfootball'dan 80 ta o'yin yuklanadi"
        />
      )}

      {live.length > 0 && (
        <section>
          <SectionHeader title="JONLI o'yinlar" />
          <MatchList matches={live} />
        </section>
      )}

      {upcoming.length > 0 && (
        <section>
          <SectionHeader
            title="Keyingi o'yinlar"
            hint="Taxmin kiriting (o'yindan oldin)"
          />
          <MatchList matches={upcoming} />
        </section>
      )}

      {finished.length > 0 && (
        <section>
          <SectionHeader title="So'nggi tugagan o'yinlar" />
          <MatchList matches={finished} muted />
        </section>
      )}
    </div>
  );
}

function MatchList({ matches, muted }: { matches: any[]; muted?: boolean }) {
  const now = Date.now();
  return (
    <ul className="rounded-2xl bg-white border border-[var(--border)] divide-y divide-[var(--border)] overflow-hidden">
      {matches.map((m) => {
        const isLocked = new Date(m.kickoff).getTime() < now;
        return (
          <li key={m.id}>
            <Link
              href={`/admin/dashboard/${m.id}`}
              className={`flex items-center gap-3 px-4 py-3 hover:bg-emerald-50 transition-colors ${
                muted ? "opacity-80" : ""
              }`}
            >
              <span className="text-2xl">{m.homeFlag ?? "⚽"}</span>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm sm:text-base truncate flex items-center gap-1.5">
                  {m.homeTeam} — {m.awayTeam}
                  {isLocked && (
                    <Lock
                      className="h-3.5 w-3.5 text-amber-600 shrink-0"
                      aria-label="Taxminlar muzlatildi"
                    />
                  )}
                </div>
                <div className="text-xs text-[var(--muted)]">
                  {m.stage} · {formatKickoff(m.kickoff)}
                </div>
              </div>
              <span className="text-2xl">{m.awayFlag ?? "⚽"}</span>
              <div className="hidden sm:block">
                <StatusBadge status={m.status} />
              </div>
              <ArrowRight className="h-4 w-4 text-[var(--muted)] shrink-0" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
