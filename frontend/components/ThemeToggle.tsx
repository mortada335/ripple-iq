"use client";

import React, { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";

const emptySubscribe = () => () => {};

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isMounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  if (!isMounted) {
    return (
      <div
        className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 ${className}`}
        aria-hidden="true"
      />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={`relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-2xs transition-all hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white ${className}`}
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-amber-400 transition-transform hover:rotate-45" aria-hidden="true" />
      ) : (
        <Moon className="h-4 w-4 text-indigo-600 transition-transform hover:-rotate-12" aria-hidden="true" />
      )}
    </button>
  );
}

