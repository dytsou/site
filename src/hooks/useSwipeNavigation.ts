import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface UseSwipeNavigationOptions {
  routeOrder: string[];
  minSwipeDistance?: number;
  minScrollDelta?: number;
  enabled?: boolean;
  navigationCooldown?: number;
}

/**
 * Hook to enable swipe and scroll navigation between routes
 * @param routeOrder - Array of route paths in navigation order
 * @param minSwipeDistance - Minimum horizontal distance in pixels to trigger navigation (default: 50)
 * @param minScrollDelta - Minimum horizontal scroll delta to trigger navigation (default: 50)
 * @param enabled - Whether swipe navigation is enabled (default: true)
 * @param navigationCooldown - Cooldown period in milliseconds between navigations (default: 500)
 */
export function useSwipeNavigation({
  routeOrder,
  minSwipeDistance = 50,
  minScrollDelta = 50,
  enabled = true,
  navigationCooldown = 500,
}: UseSwipeNavigationOptions) {
  const navigate = useNavigate();
  const location = useLocation();
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const touchEndY = useRef<number | null>(null);
  const scrollAccumulator = useRef<number>(0);
  const lastNavigationTime = useRef<number>(0);
  const isNavigating = useRef<boolean>(false);

  // Reset scroll accumulator and navigation flag when route changes
  useEffect(() => {
    scrollAccumulator.current = 0;
    isNavigating.current = false;
  }, [location.pathname]);

  useEffect(() => {
    if (!enabled) return;

    const getCurrentRouteIndex = (): number => {
      const currentPath = location.pathname;
      const index = routeOrder.indexOf(currentPath);
      return index >= 0 ? index : 0;
    };

    const navigateToRoute = (direction: 'left' | 'right') => {
      // Prevent rapid navigation - enforce cooldown period
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
        // Swipe left = next route (wrap around to first if at end)
        nextIndex = (currentIndex + 1) % routeOrder.length;
      } else {
        // Swipe right = previous route (wrap around to last if at beginning)
        nextIndex =
          currentIndex === 0 ? routeOrder.length - 1 : currentIndex - 1;
      }

      const nextRoute = routeOrder[nextIndex];
      if (nextRoute && nextRoute !== location.pathname) {
        isNavigating.current = true;
        lastNavigationTime.current = now;
        navigate(nextRoute);
        // Reset scroll accumulator after navigation
        scrollAccumulator.current = 0;

        // Reset navigation flag after a short delay
        setTimeout(() => {
          isNavigating.current = false;
        }, navigationCooldown);
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      // Don't trigger swipe if touching interactive elements or carousels
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'A' ||
        target.tagName === 'BUTTON' ||
        target.closest(
          'a, button, [role="button"], .carousel-container, .carousel-wrapper'
        )
      ) {
        return;
      }

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

      // Only trigger if horizontal swipe is more dominant than vertical
      // This prevents triggering on scroll gestures
      if (absDeltaX > absDeltaY && absDeltaX > minSwipeDistance) {
        // Reset accumulator to prevent immediate scroll navigation after touch swipe
        scrollAccumulator.current = 0;

        if (deltaX > 0) {
          // Swipe right = previous route
          navigateToRoute('right');
        } else {
          // Swipe left = next route
          navigateToRoute('left');
        }
      }

      // Reset values
      touchStartX.current = null;
      touchStartY.current = null;
      touchEndX.current = null;
      touchEndY.current = null;
    };

    const handleWheel = (e: WheelEvent) => {
      // Don't trigger scroll navigation if over interactive elements or carousels
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'A' ||
        target.tagName === 'BUTTON' ||
        target.closest(
          'a, button, [role="button"], .carousel-container, .carousel-wrapper'
        )
      ) {
        return;
      }

      // Check if element or its parent has horizontal scroll
      const hasHorizontalScroll = (el: HTMLElement | null): boolean => {
        if (!el) return false;
        if (el.scrollWidth > el.clientWidth) return true;
        return hasHorizontalScroll(el.parentElement);
      };

      // Don't trigger if the element has horizontal scroll capability
      if (hasHorizontalScroll(target)) {
        return;
      }

      const deltaX = e.deltaX;
      const deltaY = e.deltaY;
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);

      // Only trigger if horizontal scroll is more dominant than vertical
      // This prevents triggering on vertical scroll gestures
      if (absDeltaX > absDeltaY && absDeltaX > 0) {
        // Accumulate scroll delta for smoother detection
        scrollAccumulator.current += deltaX;

        // Trigger navigation when accumulated delta exceeds threshold
        if (Math.abs(scrollAccumulator.current) >= minScrollDelta) {
          if (scrollAccumulator.current > 0) {
            // Scroll right = previous route
            navigateToRoute('right');
          } else {
            // Scroll left = next route
            navigateToRoute('left');
          }
          // Reset accumulator after navigation
          scrollAccumulator.current = 0;
        }
      } else {
        // Reset accumulator if vertical scroll is dominant
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
    location.pathname,
    minSwipeDistance,
    minScrollDelta,
    navigationCooldown,
    navigate,
    routeOrder,
  ]);
}
