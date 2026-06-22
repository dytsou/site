import { useEffect, useRef } from 'react';

interface UseSwipeNavigationOptions {
  routeOrder: string[];
  currentPath: string;
  minSwipeDistance?: number;
  minScrollDelta?: number;
  enabled?: boolean;
  navigationCooldown?: number;
}

function normalizePath(path: string): string {
  if (path === '/') return '/';
  return path.endsWith('/') ? path : `${path}/`;
}

export function useSwipeNavigation({
  routeOrder,
  currentPath,
  minSwipeDistance = 50,
  minScrollDelta = 50,
  enabled = true,
  navigationCooldown = 500,
}: UseSwipeNavigationOptions) {
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const touchEndY = useRef<number | null>(null);
  const scrollAccumulator = useRef(0);
  const lastNavigationTime = useRef(0);
  const isNavigating = useRef(false);
  const normalizedRoutes = routeOrder.map(normalizePath);
  const normalizedCurrent = normalizePath(currentPath);

  useEffect(() => {
    scrollAccumulator.current = 0;
    isNavigating.current = false;
  }, [normalizedCurrent]);

  useEffect(() => {
    if (!enabled) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const getCurrentRouteIndex = (): number => {
      const index = normalizedRoutes.indexOf(normalizedCurrent);
      return index >= 0 ? index : 0;
    };

    const navigateToRoute = (direction: 'left' | 'right') => {
      const now = Date.now();
      if (
        isNavigating.current ||
        now - lastNavigationTime.current < navigationCooldown
      ) {
        return;
      }

      const currentIndex = getCurrentRouteIndex();
      let nextIndex: number;
      if (direction === 'left') {
        nextIndex = (currentIndex + 1) % normalizedRoutes.length;
      } else if (currentIndex === 0) {
        nextIndex = normalizedRoutes.length - 1;
      } else {
        nextIndex = currentIndex - 1;
      }

      const nextRoute = normalizedRoutes[nextIndex];
      if (nextRoute && nextRoute !== normalizedCurrent) {
        isNavigating.current = true;
        lastNavigationTime.current = now;
        window.location.assign(nextRoute);
        scrollAccumulator.current = 0;
        setTimeout(() => {
          isNavigating.current = false;
        }, navigationCooldown);
      }
    };

    const isInteractiveTarget = (target: HTMLElement) =>
      target.tagName === 'A' ||
      target.tagName === 'BUTTON' ||
      Boolean(
        target.closest(
          'a, button, [role="button"], .carousel-container, .carousel-wrapper'
        )
      );

    const handleTouchStart = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      if (isInteractiveTarget(target)) return;
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      touchEndX.current = e.touches[0].clientX;
      touchEndY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = () => {
      if (
        touchStartX.current === null ||
        touchStartY.current === null ||
        touchEndX.current === null ||
        touchEndY.current === null
      ) {
        return;
      }

      const deltaX = touchEndX.current - touchStartX.current;
      const deltaY = touchEndY.current - touchStartY.current;
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);

      if (absDeltaX > absDeltaY && absDeltaX > minSwipeDistance) {
        scrollAccumulator.current = 0;
        navigateToRoute(deltaX > 0 ? 'right' : 'left');
      }

      touchStartX.current = null;
      touchStartY.current = null;
      touchEndX.current = null;
      touchEndY.current = null;
    };

    const handleWheel = (e: WheelEvent) => {
      const target = e.target as HTMLElement;
      if (isInteractiveTarget(target)) return;

      const absDeltaX = Math.abs(e.deltaX);
      const absDeltaY = Math.abs(e.deltaY);

      if (absDeltaX > absDeltaY && absDeltaX > 0) {
        scrollAccumulator.current += e.deltaX;
        if (Math.abs(scrollAccumulator.current) >= minScrollDelta) {
          navigateToRoute(scrollAccumulator.current > 0 ? 'right' : 'left');
          scrollAccumulator.current = 0;
        }
      } else {
        scrollAccumulator.current = 0;
      }
    };

    const element = document.body;
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });
    element.addEventListener('wheel', handleWheel, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('wheel', handleWheel);
    };
  }, [
    enabled,
    minScrollDelta,
    minSwipeDistance,
    navigationCooldown,
    normalizedCurrent,
    normalizedRoutes,
  ]);
}
