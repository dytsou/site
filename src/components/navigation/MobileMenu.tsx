import { NavLinkComponent } from './NavLinks';
import { navLinks } from './navLinksConfig';
import './Navigation.css';

interface MobileMenuProps {
  isOpen: boolean;
  currentPath: string;
  onClose: () => void;
}

export function MobileMenu({ isOpen, currentPath, onClose }: MobileMenuProps) {
  return (
    <div
      className={`nav-mobile-menu ${isOpen ? 'nav-mobile-menu-open' : 'nav-mobile-menu-closed'}`}
      aria-hidden={!isOpen}
    >
      <div className="nav-mobile-content">
        {navLinks.map((link) => (
          <div
            key={link.path}
            className={`nav-mobile-link-wrapper ${isOpen ? 'nav-mobile-link-visible' : 'nav-mobile-link-hidden'}`}
          >
            <NavLinkComponent
              link={link}
              currentPath={currentPath}
              variant="mobile"
              onNavigate={onClose}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
