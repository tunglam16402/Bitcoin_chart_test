// src/components/Providers/ThemeProvider.tsx
"use client";

import React, {
  createContext,
  useState,
  useContext,
  useMemo,
  useEffect,
} from "react";
import { ChartTheme } from "@/types";

interface ThemeContextProps {
  theme: ChartTheme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [theme, setTheme] = useState<ChartTheme>("light"); // Default theme

  // Load theme from localStorage on initial mount (optional)
  useEffect(() => {
    const storedTheme = localStorage.getItem("chartTheme") as ChartTheme | null;
    // You could also check system preference here:
    // const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (storedTheme && (storedTheme === "light" || storedTheme === "dark")) {
      setTheme(storedTheme);
    } else {
      // Fallback or use system preference
      setTheme("light");
    }
  }, []);

  // Update localStorage when theme changes
  useEffect(() => {
    localStorage.setItem("chartTheme", theme);
    // Update body class for potential global Tailwind dark mode styling
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  const value = useMemo(() => ({ theme, toggleTheme }), [theme]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextProps => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
