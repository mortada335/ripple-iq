"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { getCookie, setCookie } from "@/lib/cookies";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  resolvedTheme: "light",
  setTheme: () => {},
  toggleTheme: () => {},
});

const THEME_STORAGE_KEY = "rippleiq_theme";
const THEME_COOKIE = "rippleiq_theme";

export function ThemeProvider({
  children,
  initialTheme = "dark",
}: {
  children: React.ReactNode;
  initialTheme?: Theme;
}) {
  const [theme, setThemeState] = useState<Theme>(initialTheme);
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(
    initialTheme === "light" ? "light" : "dark"
  );

  useEffect(() => {
    try {
      const cookieTheme = getCookie(THEME_COOKIE) as Theme | null;
      if (cookieTheme && ["light", "dark", "system"].includes(cookieTheme)) {
        if (cookieTheme !== theme) setThemeState(cookieTheme);
        return;
      }
      const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
      if (stored && ["light", "dark", "system"].includes(stored)) {
        if (stored !== theme) setThemeState(stored);
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const updateResolved = () => {
      let isDark = false;
      if (theme === "dark") {
        isDark = true;
      } else if (theme === "light") {
        isDark = false;
      } else {
        isDark = mediaQuery.matches;
      }

      setResolvedTheme(isDark ? "dark" : "light");

      if (isDark) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    };

    updateResolved();

    const handleChange = () => {
      if (theme === "system") {
        updateResolved();
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      setCookie(THEME_COOKIE, newTheme, { days: 365 });
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
      window.dispatchEvent(new Event("rippleiq:theme-updated"));
    } catch {
      // Ignore
    }
  };

  const toggleTheme = () => {
    const next = resolvedTheme === "dark" ? "light" : "dark";
    setTheme(next);
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

