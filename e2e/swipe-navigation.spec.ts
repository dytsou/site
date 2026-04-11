import { test, expect, Page, Locator } from '@playwright/test';
import { SWIPE_ROUTE_ORDER } from '../src/constants/swipeRouteOrder';

/** Matches `navigationCooldown` in App.tsx `useSwipeNavigation` */
const NAV_COOLDOWN_MS = 1000;

/** Horizontal delta used to trigger navigation (hook `minScrollDelta` default is 50) */
const WHEEL_NAV_DELTA = 80;

const NAV_TIMEOUT_MS = 8_000;

/** Cooldown + margin for React Router to settle between route changes in one test */
const BETWEEN_NAV_MS = NAV_COOLDOWN_MS + 200;

/**
 * Dispatches a wheel event on `document.body` so routing does not depend on which element is
 * under the cursor (nav links, carousels, etc. would otherwise block the hook).
 */
async function triggerSwipeNavigation(page: Page, direction: 'left' | 'right') {
  const deltaX = direction === 'left' ? -WHEEL_NAV_DELTA : WHEEL_NAV_DELTA;
  await page.evaluate(
    ({ deltaX }) => {
      document.body.dispatchEvent(
        new WheelEvent('wheel', {
          deltaX,
          deltaY: 0,
          deltaZ: 0,
          deltaMode: 0,
          bubbles: true,
          cancelable: true,
          view: window,
        })
      );
    },
    { deltaX }
  );
}

async function triggerWheelOnLocator(
  locator: Locator,
  direction: 'left' | 'right'
) {
  const deltaX = direction === 'left' ? -WHEEL_NAV_DELTA : WHEEL_NAV_DELTA;
  await locator.evaluate((el, deltaX) => {
    el.dispatchEvent(
      new WheelEvent('wheel', {
        deltaX,
        deltaY: 0,
        deltaZ: 0,
        deltaMode: 0,
        bubbles: true,
        cancelable: true,
        view: window,
      })
    );
  }, deltaX);
}

async function gotoAndSettle(page: Page, path: string) {
  await page.goto(path, { waitUntil: 'load' });
  await expect(page.locator('#root')).toBeVisible();
}

test.describe('Swipe Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAndSettle(page, '/');
  });

  test('should navigate to next route on swipe left', async ({ page }) => {
    await expect(page).toHaveURL('/');

    await triggerSwipeNavigation(page, 'left');

    await expect(page).toHaveURL('/about', { timeout: NAV_TIMEOUT_MS });
  });

  test('should navigate to previous route on swipe right', async ({ page }) => {
    await gotoAndSettle(page, '/about');
    await expect(page).toHaveURL('/about');

    await triggerSwipeNavigation(page, 'right');

    await expect(page).toHaveURL('/', { timeout: NAV_TIMEOUT_MS });
  });

  test('should wrap around from last route to first on swipe left', async ({
    page,
  }) => {
    await gotoAndSettle(page, '/contact');
    await expect(page).toHaveURL('/contact');

    await triggerSwipeNavigation(page, 'left');

    await expect(page).toHaveURL('/', { timeout: NAV_TIMEOUT_MS });
  });

  test('should wrap around from first route to last on swipe right', async ({
    page,
  }) => {
    await expect(page).toHaveURL('/');

    await triggerSwipeNavigation(page, 'right');

    await expect(page).toHaveURL('/contact', { timeout: NAV_TIMEOUT_MS });
  });

  test('should respect navigation cooldown and not navigate too quickly', async ({
    page,
  }) => {
    await expect(page).toHaveURL('/');

    await triggerSwipeNavigation(page, 'left');
    await triggerSwipeNavigation(page, 'left');

    await expect(page).toHaveURL('/about', { timeout: NAV_TIMEOUT_MS });
  });

  test('should not navigate when horizontal wheel fires on a button', async ({
    page,
  }) => {
    await gotoAndSettle(page, '/');

    // Desktop and mobile each render a theme toggle; only one is visible at a time.
    const button = page
      .getByRole('button', { name: /Switch to (dark|light) mode/ })
      .filter({ visible: true })
      .first();
    await expect(button).toBeVisible();
    await triggerWheelOnLocator(button, 'left');

    await expect(page).toHaveURL('/', { timeout: NAV_TIMEOUT_MS });
  });

  test('should not navigate when horizontal wheel fires on project carousel', async ({
    page,
  }) => {
    await gotoAndSettle(page, '/projects');

    const carousel = page.locator('.carousel-container').first();
    await expect(carousel).toBeVisible();
    await triggerWheelOnLocator(carousel, 'left');

    await expect(page).toHaveURL('/projects', { timeout: NAV_TIMEOUT_MS });
  });

  test('should navigate through all routes with consecutive swipes', async ({
    page,
  }) => {
    await expect(page).toHaveURL('/');

    const routes = [...SWIPE_ROUTE_ORDER];

    for (let i = 0; i < routes.length - 1; i++) {
      await triggerSwipeNavigation(page, 'left');
      const expectedRoute = routes[i + 1];
      await expect(page).toHaveURL(expectedRoute, { timeout: NAV_TIMEOUT_MS });
      if (i < routes.length - 2) {
        await page.waitForTimeout(BETWEEN_NAV_MS);
      }
    }

    await page.waitForTimeout(BETWEEN_NAV_MS);

    for (let i = routes.length - 1; i > 0; i--) {
      await triggerSwipeNavigation(page, 'right');
      const expectedRoute = routes[i - 1];
      await expect(page).toHaveURL(expectedRoute, { timeout: NAV_TIMEOUT_MS });
      if (i > 1) {
        await page.waitForTimeout(BETWEEN_NAV_MS);
      }
    }
  });
});
