import { useEffect, useState } from 'react';
import { ThemeToggleButton } from './ThemeToggleButton';
import { MobileMenuToggleButton } from './MobileMenuToggleButton';
import { DesktopMenu } from './DesktopMenu';
import { MobileMenu } from './MobileMenu';
import './Navigation.css';

interface NavigationProps {
  currentPath: string;
}

export function Navigation({ currentPath }: Readonly<NavigationProps>) {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <nav className={`nav ${isScrolled ? 'nav-scrolled' : 'nav-transparent'}`}>
      <div className="nav-container">
        <div className="nav-content">
          <a href="/" className="nav-brand" aria-label="Home">
            <span className="nav-brand-frame" aria-hidden="true">
              <img
                src="/assets/favicon.png"
                width={28}
                height={28}
                className="nav-brand-icon"
                alt=""
              />
            </span>
          </a>

          <DesktopMenu currentPath={currentPath} />

          <div className="nav-mobile-controls">
            <ThemeToggleButton variant="mobile" iconKey="moon-mobile" />
            <MobileMenuToggleButton
              isOpen={isOpen}
              onClick={() => setIsOpen((open) => !open)}
            />
          </div>
        </div>
      </div>

      <MobileMenu
        isOpen={isOpen}
        currentPath={currentPath}
        onClose={() => setIsOpen(false)}
      />
    </nav>
  );
}
