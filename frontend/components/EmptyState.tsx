import Link from "next/link";
import { PlusCircle, Inbox, type LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

export function EmptyState({ icon: Icon = Inbox, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900 mb-4">
        <Icon className="h-8 w-8 text-slate-400 dark:text-slate-500" aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6">{description}</p>
      {action && (
        action.href ? (
          <Link
            href={action.href}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
          >
            <PlusCircle className="h-4 w-4" />
            {action.label}
          </Link>
        ) : (
          <button
            type="button"
            onClick={action.onClick}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
          >
            <PlusCircle className="h-4 w-4" />
            {action.label}
          </button>
        )
      )}
    </div>
  );
}
