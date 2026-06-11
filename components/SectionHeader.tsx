export function SectionHeader({
  title,
  hint,
  icon,
}: {
  title: string;
  hint?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-2 mb-3">
      <h2 className="flex items-center gap-2 text-lg sm:text-xl font-extrabold tracking-tight">
        {icon}
        {title}
      </h2>
      {hint && (
        <span className="text-[11px] uppercase tracking-wider text-[var(--muted)] font-semibold">
          {hint}
        </span>
      )}
    </div>
  );
}
