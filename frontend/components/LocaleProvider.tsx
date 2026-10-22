"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { type Locale, type TranslationKey, translate } from "@/lib/locale";

interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  t: (key: TranslationKey) => string;
  isRtl: boolean;
  dir: "rtl" | "ltr";
}

const STORAGE_KEY = "rippleiq_settings";

const LocaleContext = createContext<LocaleContextType>({
  locale: "en",
  setLocale: () => {},
  toggleLocale: () => {},
  t: (key: TranslationKey) => key,
  isRtl: false,
  dir: "ltr",
});

function applyDirection(locale: Locale) {
  if (typeof document !== "undefined") {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
  }
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as { language?: string };
        const initial = parsed.language === "ar" ? "ar" : "en";
        setLocaleState(initial);
        applyDirection(initial);
      }
    } catch {
      // Ignore localStorage parse errors
    }
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    applyDirection(newLocale);
    try {
      const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...existing, language: newLocale }));
      window.dispatchEvent(new Event("rippleiq:locale-updated"));
    } catch {
      // Ignore storage errors
    }
  }, []);

  const toggleLocale = useCallback(() => {
    setLocale(locale === "ar" ? "en" : "ar");
  }, [locale, setLocale]);

  useEffect(() => {
    const handleSync = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as { language?: string };
          const current = parsed.language === "ar" ? "ar" : "en";
          setLocaleState(current);
          applyDirection(current);
        }
      } catch {
        // Ignore
      }
    };

    window.addEventListener("rippleiq:locale-updated", handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener("rippleiq:locale-updated", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, []);

  const t = useCallback(
    (key: TranslationKey) => translate(locale, key),
    [locale]
  );

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      toggleLocale,
      t,
      isRtl: locale === "ar",
      dir: (locale === "ar" ? "rtl" : "ltr") as "rtl" | "ltr",
    }),
    [locale, setLocale, toggleLocale, t]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  return useContext(LocaleContext);
}
