import { NavLinkComponent } from './NavLinks';
import { navLinks } from './navLinksConfig';
import './Navigation.css';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  return (
    <div
      className={`nav-mobile-menu ${isOpen ? 'nav-mobile-menu-open' : 'nav-mobile-menu-closed'}`}
    >
      <div className="nav-mobile-content">
        {navLinks.map((link) => (
          <div
            key={link.path}
            className={`nav-mobile-link-wrapper ${isOpen ? 'nav-mobile-link-visible' : 'nav-mobile-link-hidden'}`}
          >
            <NavLinkComponent
              link={link}
              variant="mobile"
              onNavigate={onClose}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
