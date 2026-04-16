import { Menu, X } from 'lucide-react';
import './Navigation.css';

interface MobileMenuToggleButtonProps {
  isOpen: boolean;
  onClick: () => void;
}

export function MobileMenuToggleButton({
  isOpen,
  onClick,
}: MobileMenuToggleButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="nav-mobile-toggle"
      aria-label="Toggle menu"
    >
      {isOpen ? (
        <X className="nav-mobile-menu-icon" />
      ) : (
        <Menu className="nav-mobile-menu-icon" />
      )}
    </button>
  );
}
