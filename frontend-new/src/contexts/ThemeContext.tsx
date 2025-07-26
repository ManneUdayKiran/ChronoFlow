import React, { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import {
  getCurrentThemeMode,
  setThemeMode,
  setupThemeListener,
} from "../utils/themeUtils";
import type { ThemeMode } from "../utils/themeUtils";

interface ThemeContextType {
  themeMode: ThemeMode;
  currentTheme: "light" | "dark";
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem("theme") as ThemeMode;
    return saved || "system";
  });

  const [currentTheme, setCurrentTheme] = useState<"light" | "dark">(() => {
    return getCurrentThemeMode();
  });

  const isDark = currentTheme === "dark";

  const setTheme = (mode: ThemeMode) => {
    setThemeModeState(mode);
    setThemeMode(mode);

    // Update current theme based on the new mode
    if (mode === "system") {
      setCurrentTheme(getCurrentThemeMode());
    } else {
      setCurrentTheme(mode);
    }

    // Apply theme to document
    applyThemeToDocument(mode === "system" ? getCurrentThemeMode() : mode);
  };

  const toggleTheme = () => {
    const newMode = currentTheme === "light" ? "dark" : "light";
    setTheme(newMode);
  };

  const applyThemeToDocument = (theme: "light" | "dark") => {
    const root = document.documentElement;

    if (theme === "dark") {
      root.classList.add("dark");
      root.style.colorScheme = "dark";
      document.body.style.backgroundColor = "#141414";
      document.body.style.color = "#ffffff";
    } else {
      root.classList.remove("dark");
      root.style.colorScheme = "light";
      document.body.style.backgroundColor = "#ffffff";
      document.body.style.color = "#000000";
    }
  };

  useEffect(() => {
    // Apply initial theme
    applyThemeToDocument(currentTheme);

    // Set up system theme listener if mode is 'system'
    let cleanup: (() => void) | undefined;

    if (themeMode === "system") {
      cleanup = setupThemeListener((isDark) => {
        const newTheme = isDark ? "dark" : "light";
        setCurrentTheme(newTheme);
        applyThemeToDocument(newTheme);
      });
    }

    return cleanup;
  }, [themeMode, currentTheme]);

  const contextValue: ThemeContextType = {
    themeMode,
    currentTheme,
    setTheme,
    toggleTheme,
    isDark,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
