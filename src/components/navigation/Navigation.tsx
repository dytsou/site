import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ThemeToggleButton } from './ThemeToggleButton';
import { MobileMenuToggleButton } from './MobileMenuToggleButton';
import { DesktopMenu } from './DesktopMenu';
import { MobileMenu } from './MobileMenu';
import './Navigation.css';

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`nav ${isScrolled ? 'nav-scrolled' : 'nav-transparent'}`}>
      <div className="nav-container">
        <div className="nav-content">
          <Link to="/" className="nav-brand" aria-label="Home">
            <span className="nav-brand-frame" aria-hidden="true">
              <img
                src="/assets/favicon.png"
                width={28}
                height={28}
                className="nav-brand-icon"
                alt=""
              />
            </span>
          </Link>

          <DesktopMenu />

          <div className="nav-mobile-controls">
            <ThemeToggleButton variant="mobile" iconKey="moon-mobile" />
            <MobileMenuToggleButton
              isOpen={isOpen}
              onClick={() => setIsOpen(!isOpen)}
            />
          </div>
        </div>
      </div>

      <MobileMenu isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </nav>
  );
}
