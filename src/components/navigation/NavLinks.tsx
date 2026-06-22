import { ExternalLink } from 'lucide-react';
import type { NavLink } from './navLinksConfig';

interface NavLinkComponentProps {
  link: NavLink;
  currentPath: string;
  variant?: 'desktop' | 'mobile';
  onNavigate?: () => void;
}

function normalizePath(path: string): string {
  if (path === '/') return '/';
  return path.endsWith('/') ? path : `${path}/`;
}

function hrefFor(path: string): string {
  if (path.startsWith('http')) return path;
  return normalizePath(path);
}

export function NavLinkComponent({
  link,
  currentPath,
  variant = 'desktop',
  onNavigate,
}: NavLinkComponentProps) {
  const isActive = normalizePath(currentPath) === normalizePath(link.path);
  const className =
    variant === 'desktop'
      ? `nav-link ${isActive ? 'nav-link-active' : ''}`
      : `nav-mobile-link ${isActive ? 'nav-link-active' : ''}`;

  if (link.external) {
    return (
      <a
        href={link.path}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        onClick={onNavigate}
      >
        {link.label}
        <ExternalLink className="nav-external-link-icon" />
      </a>
    );
  }

  return (
    <a href={hrefFor(link.path)} className={className} onClick={onNavigate}>
      {link.label}
    </a>
  );
}
