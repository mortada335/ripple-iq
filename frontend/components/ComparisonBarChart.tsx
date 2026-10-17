type BarItem = {
  label: string;
  value: number;
  detail?: string;
  tone?: "indigo" | "emerald" | "rose" | "amber";
};

const toneClasses = {
  indigo: "bg-indigo-600 dark:bg-indigo-400",
  emerald: "bg-emerald-600 dark:bg-emerald-400",
  rose: "bg-rose-600 dark:bg-rose-400",
  amber: "bg-amber-500 dark:bg-amber-400",
} as const;

export function ComparisonBarChart({
  title,
  items,
  maxValue,
  valueSuffix = "",
}: {
  title: string;
  items: BarItem[];
  maxValue: number;
  valueSuffix?: string;
}) {
  return (
    <section aria-label={title} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
      <h2 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h2>
      <ul className="mt-4 space-y-4">
        {items.map((item) => {
          const boundedValue = Math.min(Math.max(0, item.value), maxValue);
          const width = maxValue > 0 ? (boundedValue / maxValue) * 100 : 0;
          const tone = item.tone ?? "indigo";
          return (
            <li key={item.label}>
              <div className="mb-1.5 flex items-baseline justify-between gap-3 text-xs">
                <span className="truncate font-medium text-slate-700 dark:text-slate-200">{item.label}</span>
                <span className="shrink-0 font-semibold tabular-nums text-slate-900 dark:text-white">{item.value}{valueSuffix}{item.detail ? <span className="ms-1 font-normal text-slate-500">{item.detail}</span> : null}</span>
              </div>
              <div
                role="meter"
                aria-label={item.label}
                aria-valuemin={0}
                aria-valuemax={maxValue}
                aria-valuenow={boundedValue}
                className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
              >
                <div className={`h-full rounded-full transition-[width] duration-500 ${toneClasses[tone]}`} style={{ width: `${width}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
