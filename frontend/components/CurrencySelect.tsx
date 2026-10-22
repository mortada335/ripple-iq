"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Search, ChevronDown, Check, Coins, Globe2, Sparkles, X } from "lucide-react";
import {
  CurrencyMetadata,
  CurrencyGroup,
  getCurrencyGroups,
  formatCurrency,
  CURRENCY_FLAGS,
  CURRENCY_SYMBOLS,
} from "@/lib/currency";
import { useLocale } from "./LocaleProvider";

export interface CurrencySelectProps {
  id?: string;
  value: string;
  onChange: (currency: string) => void;
  disabled?: boolean;
  className?: string;
  showPreview?: boolean;
  previewAmount?: number;
}

export function CurrencySelect({
  id = "currency-select",
  value,
  onChange,
  disabled = false,
  className = "",
  showPreview = false,
  previewAmount = 2500000,
}: CurrencySelectProps) {
  const { locale } = useLocale();
  const isAr = locale === "ar";

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "primary" | "major">("all");

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load all grouped currencies according to current locale
  const groups: CurrencyGroup[] = useMemo(() => {
    return getCurrencyGroups(locale);
  }, [locale]);

  // Flattened lookup map
  const currencyMap = useMemo(() => {
    const map = new Map<string, CurrencyMetadata>();
    for (const group of groups) {
      for (const item of group.items) {
        map.set(item.code, item);
      }
    }
    return map;
  }, [groups]);

  // Current selected metadata
  const selectedMeta: CurrencyMetadata = useMemo(() => {
    const found = currencyMap.get(value);
    if (found) return found;
    return {
      code: value,
      name: value,
      symbol: CURRENCY_SYMBOLS[value] || value,
      flag: CURRENCY_FLAGS[value] || "🌐",
      category: "other",
    };
  }, [currencyMap, value]);

  // Filtered groups based on search and active tab
  const filteredGroups = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return groups
      .filter((group) => {
        if (activeTab === "all") return true;
        if (activeTab === "primary") return group.id === "primary";
        if (activeTab === "major") return group.id === "major";
        return true;
      })
      .map((group) => {
        if (!query) return group;
        const matchingItems = group.items.filter((item) => {
          return (
            item.code.toLowerCase().includes(query) ||
            item.name.toLowerCase().includes(query) ||
            item.symbol.toLowerCase().includes(query)
          );
        });
        return {
          ...group,
          items: matchingItems,
        };
      })
      .filter((group) => group.items.length > 0);
  }, [groups, searchQuery, activeTab]);

  // Close dropdown on outside click or escape key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
      // Auto-focus search input when opened
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (code: string) => {
    onChange(code);
    setIsOpen(false);
    setSearchQuery("");
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      
      {/* Trigger Button */}
      <button
        type="button"
        id={id}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 shadow-2xs outline-none transition hover:border-indigo-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:border-indigo-500"
      >
        <div className="flex items-center gap-2.5 truncate">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-xs font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 select-none" aria-hidden="true">
            {selectedMeta.flag}
          </span>
          <span className="rounded-md bg-indigo-50 px-1.5 py-0.5 font-mono text-[11px] font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
            {selectedMeta.code}
          </span>
          <span className="truncate text-slate-800 dark:text-slate-200">
            {selectedMeta.name}
          </span>
          {selectedMeta.symbol && (
            <span className="text-xs text-slate-400 dark:text-slate-500">
              ({selectedMeta.symbol})
            </span>
          )}
        </div>

        <ChevronDown
          className={`h-4 w-4 text-slate-400 transition-transform duration-200 shrink-0 ${
            isOpen ? "rotate-180 text-indigo-600 dark:text-indigo-400" : ""
          }`}
          aria-hidden="true"
        />
      </button>

      {/* Optional Live Format Preview Pill */}
      {showPreview && (
        <div className="mt-1.5 flex items-center justify-between rounded-lg bg-indigo-50/60 px-3 py-1.5 text-[11px] text-indigo-900 dark:bg-indigo-950/30 dark:text-indigo-300">
          <span className="flex items-center gap-1 font-medium">
            <Coins className="h-3 w-3 text-indigo-500" />
            <span>{isAr ? "معاينة التنسيق:" : "Live Format:"}</span>
          </span>
          <span className="font-mono font-bold">
            {formatCurrency(previewAmount, value, locale)}
          </span>
        </div>
      )}

      {/* Popover Dropdown Menu */}
      {isOpen && (
        <div className="absolute start-0 end-0 z-50 mt-1.5 max-h-96 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-100 dark:border-slate-800 dark:bg-slate-900">
          
          {/* Search Header */}
          <div className="border-b border-slate-100 p-2.5 dark:border-slate-800">
            <div className="relative flex items-center">
              <Search className="absolute start-3 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isAr ? "ابحث بالرمز أو اسم العملة (مثل: دينار، USD، ريال)..." : "Search code or currency (e.g. IQD, Dollar)..."}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 ps-8.5 pe-8 text-xs text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute end-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Quick Filter Tabs */}
            <div className="mt-2 flex items-center gap-1 overflow-x-auto pb-0.5 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={`rounded-lg px-2.5 py-1 transition ${
                  activeTab === "all"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {isAr ? "كافة العملات" : "All"}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("primary")}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1 transition ${
                  activeTab === "primary"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <Sparkles className="h-3 w-3" />
                <span>{isAr ? "الرئيسية والإقليمية" : "Primary & Regional"}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("major")}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1 transition ${
                  activeTab === "major"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <Globe2 className="h-3 w-3" />
                <span>{isAr ? "العملات الكبرى" : "Major Global"}</span>
              </button>
            </div>
          </div>

          {/* Currency Items List (Grouped & Scrollable) */}
          <div className="max-h-64 overflow-y-auto p-1.5 space-y-3">
            {filteredGroups.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500 dark:text-slate-400">
                {isAr ? "لم يتم العثور على عملة مطابقة للبحث." : "No matching currencies found."}
              </div>
            ) : (
              filteredGroups.map((group) => (
                <div key={group.id} className="space-y-1">
                  
                  {/* Category Header */}
                  <div className="sticky top-0 z-10 flex items-center justify-between bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 backdrop-blur-xs dark:bg-slate-900/95 dark:text-slate-500">
                    <span>{isAr ? group.labelAr : group.labelEn}</span>
                    <span className="rounded-full bg-slate-100 px-1.5 py-0.2 text-[9px] dark:bg-slate-800">
                      {group.items.length}
                    </span>
                  </div>

                  {/* Group Items */}
                  <div className="space-y-0.5">
                    {group.items.map((item) => {
                      const isSelected = item.code === value;
                      return (
                        <button
                          key={item.code}
                          type="button"
                          onClick={() => handleSelect(item.code)}
                          className={`flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-xs transition ${
                            isSelected
                              ? "bg-indigo-50 font-bold text-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-200"
                              : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/80"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-slate-100 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300 select-none" aria-hidden="true">
                              {item.flag}
                            </span>
                            <span
                              className={`rounded-md px-1.5 py-0.5 font-mono text-[10px] font-bold ${
                                isSelected
                                  ? "bg-indigo-600 text-white"
                                  : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                              }`}
                            >
                              {item.code}
                            </span>
                            <span className="truncate">{item.name}</span>
                          </div>

                          <div className="flex items-center gap-2 ms-2 shrink-0">
                            {item.symbol && (
                              <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500">
                                {item.symbol}
                              </span>
                            )}
                            {isSelected && (
                              <Check className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                </div>
              ))
            )}
          </div>

          {/* Footer Note */}
          <div className="border-t border-slate-100 bg-slate-50/60 px-3 py-1.5 text-[10px] text-slate-400 dark:border-slate-800 dark:bg-slate-950/60">
            {isAr
              ? "العملات مرتبة تسلسلياً (العراقية والإقليمية أولاً، تليها العالمية الكبرى، ثم باقي العملات أبجدياً)."
              : "Ordered sequentially (Iraqi & regional first, major global, then all ISO currencies)."}
          </div>

        </div>
      )}
    </div>
  );
}
