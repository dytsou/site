import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import './Navigation.css';

interface ThemeToggleButtonProps {
  variant?: 'desktop' | 'mobile';
  iconKey?: string;
}

export function ThemeToggleButton({
  variant = 'desktop',
  iconKey,
}: Readonly<ThemeToggleButtonProps>) {
  const { theme, toggleTheme } = useTheme();
  const className =
    variant === 'desktop' ? 'nav-theme-toggle' : 'nav-mobile-toggle';
  const key = iconKey || (variant === 'desktop' ? 'moon' : 'moon-mobile');

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={className}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? (
        <Moon
          key={`${key}-moon`}
          className="nav-theme-icon nav-theme-icon-light"
        />
      ) : (
        <Sun
          key={`${key}-sun`}
          className="nav-theme-icon nav-theme-icon-dark"
        />
      )}
    </button>
  );
}
