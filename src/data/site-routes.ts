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
