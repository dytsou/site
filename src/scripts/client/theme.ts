function getStoredTheme(): 'light' | 'dark' {
  try {
    const stored = localStorage.getItem('theme');
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    // ignore
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

function applyTheme(theme: 'light' | 'dark') {
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(theme);
  try {
    localStorage.setItem('theme', theme);
  } catch {
    // ignore
  }
}

function updateToggleUi(theme: 'light' | 'dark') {
  const next = theme === 'light' ? 'dark' : 'light';
  const label = `Switch to ${next} mode`;
  document
    .querySelectorAll<HTMLButtonElement>('[data-theme-toggle]')
    .forEach((btn) => {
      btn.setAttribute('aria-label', label);
      btn.setAttribute('title', label);
      btn.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
      const moon = btn.querySelector('[data-theme-icon="moon"]');
      const sun = btn.querySelector('[data-theme-icon="sun"]');
      if (moon instanceof HTMLElement) {
        moon.hidden = theme === 'dark';
      }
      if (sun instanceof HTMLElement) {
        sun.hidden = theme === 'light';
      }
    });
}

export function initTheme(): void {
  const theme = getStoredTheme();
  applyTheme(theme);
  updateToggleUi(theme);

  document
    .querySelectorAll<HTMLButtonElement>('[data-theme-toggle]')
    .forEach((btn) => {
      btn.addEventListener('click', () => {
        const current = document.documentElement.classList.contains('dark')
          ? 'dark'
          : 'light';
        const next = current === 'light' ? 'dark' : 'light';
        applyTheme(next);
        updateToggleUi(next);
      });
    });
}
