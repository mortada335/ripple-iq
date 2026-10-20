import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  showHome?: boolean;
}

export function Breadcrumbs({ items, showHome = true }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
      {showHome && (
        <>
          <Link
            href="/dashboard"
            className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <Home className="h-3 w-3" />
            <span>Dashboard</span>
          </Link>
          {items.length > 0 && <ChevronRight className="h-3 w-3 shrink-0" />}
        </>
      )}
      {items.map((item, idx) => (
        <span key={idx} className="flex items-center gap-1.5">
          {item.href ? (
            <Link href={item.href} className="hover:text-slate-900 dark:hover:text-white transition-colors truncate max-w-[160px]">
              {item.label}
            </Link>
          ) : (
            <span className="text-slate-900 dark:text-white font-medium truncate max-w-[200px]">
              {item.label}
            </span>
          )}
          {idx < items.length - 1 && <ChevronRight className="h-3 w-3 shrink-0" />}
        </span>
      ))}
    </nav>
  );
}
