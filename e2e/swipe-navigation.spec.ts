import { test, expect, Page } from '@playwright/test';

const ROUTE_ORDER = ['/', '/about', '/experiences', '/projects', '/contact'];

/** Horizontal delta used to trigger navigation (hook minScrollDelta default is 50) */
const WHEEL_NAV_DELTA = 80;

const NAV_TIMEOUT_MS = 8_000;

/** Cooldown is 500ms; extra margin covers React Router settling between route changes in one test */
const BETWEEN_NAV_MS = 1200;

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

  test('should not navigate when swiping on interactive elements', async ({
    page,
  }) => {
    await gotoAndSettle(page, '/');

    const button = page.locator('button').first();
    if ((await button.count()) > 0) {
      const box = await button.boundingBox();
      if (box) {
        const startX = box.x + box.width / 2;
        const startY = box.y + box.height / 2;
        const endX = startX - 150;

        await page.mouse.move(startX, startY);
        await page.mouse.down();
        await page.mouse.move(endX, startY, { steps: 10 });
        await page.mouse.up();

        await expect(page).toHaveURL('/', { timeout: NAV_TIMEOUT_MS });
      }
    }
  });

  test('should navigate through all routes with consecutive swipes', async ({
    page,
  }) => {
    await expect(page).toHaveURL('/');

    for (let i = 0; i < ROUTE_ORDER.length - 1; i++) {
      await triggerSwipeNavigation(page, 'left');
      const expectedRoute = ROUTE_ORDER[i + 1];
      await expect(page).toHaveURL(expectedRoute, { timeout: NAV_TIMEOUT_MS });
      if (i < ROUTE_ORDER.length - 2) {
        await page.waitForTimeout(BETWEEN_NAV_MS);
      }
    }

    await page.waitForTimeout(BETWEEN_NAV_MS);

    for (let i = ROUTE_ORDER.length - 1; i > 0; i--) {
      await triggerSwipeNavigation(page, 'right');
      const expectedRoute = ROUTE_ORDER[i - 1];
      await expect(page).toHaveURL(expectedRoute, { timeout: NAV_TIMEOUT_MS });
      if (i > 1) {
        await page.waitForTimeout(BETWEEN_NAV_MS);
      }
    }
  });
});
