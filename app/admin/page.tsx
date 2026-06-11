import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { checkPassword, setAdminSession, isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ err?: string }>;
}) {
  if (await isAdmin()) redirect("/admin/dashboard");
  const { err } = await searchParams;

  async function login(formData: FormData) {
    "use server";
    const pw = String(formData.get("password") ?? "");
    if (!checkPassword(pw)) {
      redirect("/admin?err=1");
    }
    await setAdminSession();
    redirect("/admin/dashboard");
  }

  return (
    <div className="max-w-sm mx-auto mt-10">
      <div className="rounded-2xl bg-white border border-[var(--border)] p-6">
        <div className="grid place-items-center h-12 w-12 rounded-2xl bg-emerald-100 text-emerald-700 mx-auto mb-3">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h1 className="text-center text-xl font-bold">Admin kirish</h1>
        <p className="text-center text-sm text-[var(--muted)] mt-1">
          Faqat admin (Shohjahon) taxminlarni kiritadi
        </p>
        <form action={login} className="mt-5 space-y-3">
          <input
            type="password"
            name="password"
            required
            autoFocus
            placeholder="Parol"
            className="w-full h-11 px-4 rounded-xl border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          {err && <p className="text-sm text-red-600">Parol xato</p>}
          <button
            type="submit"
            className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-colors"
          >
            Kirish
          </button>
        </form>
      </div>
    </div>
  );
}
