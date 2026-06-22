import { SITE_ROUTES } from '../../data/site-routes';
import { useSwipeNavigation } from '../../hooks/useSwipeNavigation';

const SWIPE_ROUTE_ORDER = SITE_ROUTES.map((route) => route.path);

interface SwipeNavigationProps {
  currentPath: string;
}

export function SwipeNavigation({ currentPath }: SwipeNavigationProps) {
  useSwipeNavigation({
    routeOrder: SWIPE_ROUTE_ORDER,
    currentPath,
  });
  return null;
}
