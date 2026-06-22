import routes from './site-routes.json';

export const SITE_URL = 'https://dy.tsou.me';
export const SITE_NAME = 'Dong-You Tsou';

export type SiteRoute = {
  path: string;
  changefreq: string;
  priority: string;
};

export const SITE_ROUTES = routes as SiteRoute[];

export const NAV_ROUTES = SITE_ROUTES.filter((r) => r.path !== '/');

export type NavLink = {
  path: string;
  label: string;
  external?: boolean;
};

const NAV_LABELS: Record<string, string> = {
  '/about': 'About',
  '/experiences': 'Experiences',
  '/projects': 'Projects',
  '/contact': 'Contact',
};

export const NAV_LINKS: NavLink[] = [
  ...NAV_ROUTES.map((route) => ({
    path: route.path,
    label: NAV_LABELS[route.path] ?? route.path,
  })),
  { path: 'https://dy.tsou.me/resume', label: 'Resume', external: true },
];
