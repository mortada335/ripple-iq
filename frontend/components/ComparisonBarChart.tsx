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

const toneTextClasses = {
  indigo: "text-indigo-700 dark:text-indigo-300",
  emerald: "text-emerald-700 dark:text-emerald-300",
  rose: "text-rose-700 dark:text-rose-300",
  amber: "text-amber-700 dark:text-amber-300",
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
    <section aria-label={title} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5 w-full overflow-hidden">
      <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">{title}</h2>
      <ul className="space-y-4 w-full">
        {items.map((item) => {
          const boundedValue = Math.min(Math.max(0, item.value), maxValue);
          const width = maxValue > 0 ? (boundedValue / maxValue) * 100 : 0;
          const tone = item.tone ?? "indigo";
          return (
            <li key={item.label} className="w-full">
              <div className="flex items-baseline justify-between gap-2 text-xs mb-1.5 flex-wrap">
                <span className="font-medium text-slate-700 dark:text-slate-200 min-w-0 break-words leading-tight">
                  {item.label}
                </span>
                <span className={`shrink-0 font-bold tabular-nums ${toneTextClasses[tone]}`}>
                  {item.value}{valueSuffix}
                  {item.detail && <span className="ms-1 font-normal text-slate-500 dark:text-slate-400">{item.detail}</span>}
                </span>
              </div>
              <div
                role="meter"
                aria-label={item.label}
                aria-valuemin={0}
                aria-valuemax={maxValue}
                aria-valuenow={boundedValue}
                className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
              >
                <div
                  className={`h-full rounded-full transition-[width] duration-700 ease-out ${toneClasses[tone]}`}
                  style={{ width: `${width}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
