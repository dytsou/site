import { ExternalLink } from 'lucide-react';
import type { NavLink } from './navLinksConfig';

const targetByPath: Record<string, string> = {
  '/about': 'nav.about',
  '/experiences': 'nav.experiences',
  '/projects': 'nav.projects',
  '/contact': 'nav.contact',
  'https://dy.tsou.me/resume': 'nav.resume',
};

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
}: Readonly<NavLinkComponentProps>) {
  const isActive = normalizePath(currentPath) === normalizePath(link.path);
  const baseClass = variant === 'desktop' ? 'nav-link' : 'nav-mobile-link';
  const activeClass = isActive ? 'nav-link-active' : '';
  const className = `${baseClass} ${activeClass}`;

  if (link.external) {
    return (
      <a
        href={link.path}
        data-heatmap-target={targetByPath[link.path]}
        data-heatmap-state={variant === 'desktop' ? 'desktop' : 'mobile-open'}
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
    <a
      data-heatmap-target={targetByPath[link.path]}
      data-heatmap-state={variant === 'desktop' ? 'desktop' : 'mobile-open'}
      href={hrefFor(link.path)}
      className={className}
      onClick={onNavigate}
    >
      {link.label}
    </a>
  );
}
