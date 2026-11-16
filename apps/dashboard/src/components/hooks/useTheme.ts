'use client';
import { useEffect, useState } from 'react';

const THEME_KEY = 'vision-theme';

function getStoredTheme(): string {
  if (typeof window === 'undefined') return 'dark';
  return localStorage.getItem(THEME_KEY) || 'dark'; // Default to dark mode
}

function applyTheme(theme: string) {
  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
  }
}

export function useTheme() {
  const [theme, setThemeState] = useState<string>('dark');

  useEffect(() => {
    const stored = getStoredTheme();
    setThemeState(stored);
    applyTheme(stored);
  }, []);

  const setTheme = (newTheme: string = 'dark') => {
    setThemeState(newTheme);
    localStorage.setItem(THEME_KEY, newTheme);
    applyTheme(newTheme);
  };

  return { theme, setTheme };
}
