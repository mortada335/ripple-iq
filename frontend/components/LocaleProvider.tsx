"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { type Locale, type TranslationKey, translate } from "@/lib/locale";
import { getCookie, setCookie } from "@/lib/cookies";

interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  t: (key: TranslationKey) => string;
  isRtl: boolean;
  dir: "rtl" | "ltr";
}

const STORAGE_KEY = "rippleiq_settings";
const LOCALE_COOKIE = "rippleiq_locale";

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

export function LocaleProvider({
  children,
  initialLocale = "en",
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  useEffect(() => {
    try {
      // Check cookie first for SSR sync
      const cookieLocale = getCookie(LOCALE_COOKIE);
      if (cookieLocale === "ar" || cookieLocale === "en") {
        if (cookieLocale !== locale) {
          setLocaleState(cookieLocale);
          applyDirection(cookieLocale);
        }
        return;
      }

      // Fall back to localStorage if cookie was cleared or not yet set
      const directStoredLocale = localStorage.getItem(LOCALE_COOKIE);
      let storedLoc: Locale | null = null;
      if (directStoredLocale === "ar" || directStoredLocale === "en") {
        storedLoc = directStoredLocale;
      } else {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as { language?: string };
          if (parsed.language === "ar" || parsed.language === "en") {
            storedLoc = parsed.language;
          }
        }
      }

      if (storedLoc) {
        if (storedLoc !== locale) {
          setLocaleState(storedLoc);
          applyDirection(storedLoc);
        }
        // Save to cookie so subsequent page reloads stay in this language on the server
        setCookie(LOCALE_COOKIE, storedLoc, { days: 365, path: "/" });
      }
    } catch {
      // Ignore localStorage parse errors
    }
  }, [locale]);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    applyDirection(newLocale);
    try {
      setCookie(LOCALE_COOKIE, newLocale, { days: 365, path: "/" });
      localStorage.setItem(LOCALE_COOKIE, newLocale);
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
