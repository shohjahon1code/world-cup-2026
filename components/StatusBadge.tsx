import { cn } from "@/lib/utils";

const LABELS: Record<string, string> = {
  SCHEDULED: "Tez orada",
  LIVE: "JONLI",
  FINISHED: "Tugadi",
  POSTPONED: "Kechiktirildi",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const base =
    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-bold uppercase tracking-wider shadow-sm";
  const styles: Record<string, string> = {
    SCHEDULED: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
    LIVE: "bg-gradient-to-r from-red-500 to-rose-500 text-white ring-2 ring-red-200",
    FINISHED: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    POSTPONED: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  };
  return (
    <span className={cn(base, styles[status] ?? styles.SCHEDULED, className)}>
      {status === "LIVE" && <span className="live-dot h-1.5 w-1.5 rounded-full bg-white" />}
      {LABELS[status] ?? status}
    </span>
  );
}
