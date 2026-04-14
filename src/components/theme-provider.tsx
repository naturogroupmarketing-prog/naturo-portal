"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({ theme: "light", toggleTheme: () => {} });

export function useTheme() {
  return useContext(ThemeContext);
}

// Marketing pages should never use dark mode
const LIGHT_ONLY_PATHS = ["/welcome"];

export function ThemeProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  const isLightOnly = LIGHT_ONLY_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));

  useEffect(() => {
    setMounted(true);
  }, []);

  // Apply theme based on route — marketing stays light, app respects preference
  useEffect(() => {
    if (!mounted) return;
    if (isLightOnly) {
      document.documentElement.classList.remove("dark");
      setTheme("light");
      return;
    }
    const stored = localStorage.getItem("trackio-theme") as Theme | null;
    if (stored) {
      setTheme(stored);
      document.documentElement.classList.toggle("dark", stored === "dark");
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme("dark");
      document.documentElement.classList.add("dark");
    }
  }, [mounted, isLightOnly]);

  const toggleTheme = () => {
    if (isLightOnly) return;
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("trackio-theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  };

  // Prevent flash of wrong theme
  if (!mounted) return <>{children}</>;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
