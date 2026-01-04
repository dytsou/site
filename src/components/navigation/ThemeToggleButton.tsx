import { Moon, Sun } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { toggleTheme } from '../../store/themeSlice';
import './Navigation.css';

interface ThemeToggleButtonProps {
  variant?: 'desktop' | 'mobile';
  iconKey?: string;
}

export function ThemeToggleButton({ variant = 'desktop', iconKey }: ThemeToggleButtonProps) {
  const theme = useAppSelector((state) => state.theme.theme);
  const dispatch = useAppDispatch();
  const className = variant === 'desktop' ? 'nav-theme-toggle' : 'nav-mobile-toggle';
  const key = iconKey || (variant === 'desktop' ? 'moon' : 'moon-mobile');

  const handleToggle = () => {
    dispatch(toggleTheme());
  };

  return (
    <button
      onClick={handleToggle}
      className={className}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? (
        <Moon key={`${key}-moon`} className="nav-theme-icon nav-theme-icon-light" />
      ) : (
        <Sun key={`${key}-sun`} className="nav-theme-icon nav-theme-icon-dark" />
      )}
    </button>
  );
}


