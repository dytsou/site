import { useCallback, useSyncExternalStore } from 'react';

export type Theme = 'light' | 'dark';

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  const observer = new MutationObserver(listener);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  });
  return () => {
    listeners.delete(listener);
    observer.disconnect();
  };
}

function getThemeSnapshot(): Theme {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

function getServerThemeSnapshot(): Theme {
  return 'light';
}

function applyTheme(theme: Theme): void {
  document.documentElement.classList.remove('light', 'dark');
  document.documentElement.classList.add(theme);
  localStorage.setItem('theme', theme);
  listeners.forEach((listener) => listener());
}

export function useTheme() {
  const theme = useSyncExternalStore(
    subscribe,
    getThemeSnapshot,
    getServerThemeSnapshot
  );

  const toggleTheme = useCallback(() => {
    applyTheme(theme === 'light' ? 'dark' : 'light');
  }, [theme]);

  return { theme, toggleTheme };
}
