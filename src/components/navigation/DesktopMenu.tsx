import { ThemeToggleButton } from './ThemeToggleButton';
import { NavLinkComponent } from './NavLinks';
import { navLinks } from './navLinksConfig';
import './Navigation.css';

interface DesktopMenuProps {
  currentPath: string;
}

export function DesktopMenu({ currentPath }: Readonly<DesktopMenuProps>) {
  return (
    <div className="nav-desktop-menu">
      {navLinks.map((link) => (
        <NavLinkComponent
          key={link.path}
          link={link}
          currentPath={currentPath}
          variant="desktop"
        />
      ))}
      <ThemeToggleButton variant="desktop" />
    </div>
  );
}
