import { useState, useEffect } from 'react';

type Theme = 'dark' | 'light';

const THEME_EVENT = 'themechange';

const getTheme = (): Theme => {
  const stored = localStorage.getItem('theme') as Theme | null;
  if (stored === 'dark' || stored === 'light') return stored;
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
};

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: theme }));
  }, [theme]);

  // Sync with other hook instances on the same page
  useEffect(() => {
    const onThemeChange = (e: CustomEvent<Theme>) => {
      setTheme(prev => prev !== e.detail ? e.detail : prev);
    };
    window.addEventListener(THEME_EVENT, onThemeChange as EventListener);
    return () => window.removeEventListener(THEME_EVENT, onThemeChange as EventListener);
  }, []);

  const toggle = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  return { theme, toggle };
}
