const ROUTE_ORDER = [
  '/',
  '/about/',
  '/experiences/',
  '/projects/',
  '/contact/',
];

export function initSwipeNav(): void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const minSwipeDistance = 100;
  const navigationCooldown = 1000;
  let touchStartX: number | null = null;
  let touchStartY: number | null = null;
  let lastNavigationTime = 0;

  const currentIndex = () => {
    const path = window.location.pathname;
    const idx = ROUTE_ORDER.indexOf(path);
    return idx >= 0 ? idx : 0;
  };

  const navigate = (direction: 'left' | 'right') => {
    const now = Date.now();
    if (now - lastNavigationTime < navigationCooldown) return;

    const idx = currentIndex();
    const nextIdx =
      direction === 'left'
        ? (idx + 1) % ROUTE_ORDER.length
        : idx === 0
          ? ROUTE_ORDER.length - 1
          : idx - 1;

    const next = ROUTE_ORDER[nextIdx];
    if (next && next !== window.location.pathname) {
      lastNavigationTime = now;
      window.location.assign(next);
    }
  };

  document.body.addEventListener(
    'touchstart',
    (e) => {
      touchStartX = e.changedTouches[0]?.screenX ?? null;
      touchStartY = e.changedTouches[0]?.screenY ?? null;
    },
    { passive: true }
  );

  document.body.addEventListener(
    'touchend',
    (e) => {
      if (touchStartX === null || touchStartY === null) return;
      const dx = (e.changedTouches[0]?.screenX ?? 0) - touchStartX;
      const dy = (e.changedTouches[0]?.screenY ?? 0) - touchStartY;
      if (Math.abs(dx) < minSwipeDistance || Math.abs(dx) < Math.abs(dy))
        return;
      navigate(dx < 0 ? 'left' : 'right');
      touchStartX = null;
      touchStartY = null;
    },
    { passive: true }
  );
}
