export function EmptyState({
  title,
  hint,
  icon,
}: {
  title: string;
  hint?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white/40 px-5 py-10 text-center">
      {icon && (
        <div className="mb-3 grid place-items-center text-4xl opacity-80">{icon}</div>
      )}
      <p className="font-bold text-[15px]">{title}</p>
      {hint && <p className="mt-1 text-sm text-[var(--muted)] max-w-xs mx-auto">{hint}</p>}
    </div>
  );
}
