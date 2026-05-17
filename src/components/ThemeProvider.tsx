"use client";
import { createContext, useContext, useEffect, useState } from "react";

export type Theme = "default" | "dark" | "forest" | "sunset";

const STORAGE_KEY = "teamhub-theme";

const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (t: Theme) => void;
}>({ theme: "default", setTheme: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("default");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (saved) apply(saved);
    setThemeState(saved ?? "default");
  }, []);

  function apply(t: Theme) {
    const html = document.documentElement;
    html.classList.remove("theme-dark", "theme-forest", "theme-sunset");
    if (t !== "default") html.classList.add(`theme-${t}`);
  }

  function setTheme(t: Theme) {
    apply(t);
    setThemeState(t);
    localStorage.setItem(STORAGE_KEY, t);
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
