import Link from "next/link";
import { Trophy, ListTree, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

export type MatchesView = "groups" | "bracket" | "date";

const OPTIONS: { value: MatchesView; label: string; icon: React.ReactNode }[] = [
  { value: "groups", label: "Guruhlar", icon: <Trophy className="h-3.5 w-3.5" /> },
  { value: "bracket", label: "Pley-off", icon: <ListTree className="h-3.5 w-3.5" /> },
  { value: "date", label: "Sana", icon: <CalendarDays className="h-3.5 w-3.5" /> },
];

export function ViewSwitcher({ active }: { active: MatchesView }) {
  return (
    <div className="inline-flex rounded-2xl bg-slate-100 p-1 ring-1 ring-slate-200 shadow-sm">
      {OPTIONS.map((o) => {
        const isActive = active === o.value;
        return (
          <Link
            key={o.value}
            href={`/matches?view=${o.value}`}
            scroll={false}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 sm:px-4 h-9 rounded-xl text-[12.5px] sm:text-sm font-bold transition-all",
              isActive
                ? "bg-white text-emerald-700 shadow-sm ring-1 ring-emerald-100"
                : "text-slate-500 hover:text-slate-800"
            )}
          >
            {o.icon}
            {o.label}
          </Link>
        );
      })}
    </div>
  );
}
