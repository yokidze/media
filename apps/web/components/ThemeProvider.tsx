'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

export type AppTheme = 'light' | 'dark';

interface ThemeContextValue {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  toggleTheme: () => void;
}

const DEFAULT_THEME: AppTheme = 'light';
const THEME_STORAGE_KEY = 'polytech-media-archive-theme';
const ThemeContext = createContext<ThemeContextValue | null>(null);

const applyThemeToDom = (theme: AppTheme): void => {
  document.documentElement.dataset.theme = theme;
  document.documentElement.classList.toggle('dark', theme === 'dark');
};

export function ThemeProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [theme, setThemeState] = useState<AppTheme>(DEFAULT_THEME);

  useEffect(() => {
    const domTheme = document.documentElement.dataset.theme;
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);

    if (domTheme === 'light' || domTheme === 'dark') {
      setThemeState(domTheme);
      return;
    }

    if (storedTheme === 'light' || storedTheme === 'dark') {
      setThemeState(storedTheme);
      applyThemeToDom(storedTheme);
      return;
    }

    applyThemeToDom(DEFAULT_THEME);
  }, []);

  const setTheme = (nextTheme: AppTheme): void => {
    setThemeState(nextTheme);
    applyThemeToDom(nextTheme);
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  };

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme,
      toggleTheme: () => setTheme(theme === 'light' ? 'dark' : 'light')
    }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

