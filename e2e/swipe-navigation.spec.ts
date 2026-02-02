import { test, expect, Page } from '@playwright/test';

const ROUTE_ORDER = ['/', '/about', '/experiences', '/projects', '/contact'];

/** Horizontal delta used to trigger navigation (hook minScrollDelta default is 50) */
const WHEEL_NAV_DELTA = 80;

/**
 * Triggers swipe navigation via a wheel event dispatched on document.body.
 * The hook listens on document.body and filters out carousel/scrollable elements.
 */
async function triggerSwipeNavigation(page: Page, direction: 'left' | 'right') {
  const deltaX = direction === 'left' ? -WHEEL_NAV_DELTA : WHEEL_NAV_DELTA;

  // Wait a bit to ensure the hook is initialized
  await page.waitForTimeout(100);

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

/**
 * Simulates a touch swipe gesture (used where touch-specific behavior is tested).
 */
async function simulateTouchSwipe(
  page: Page,
  startX: number,
  startY: number,
  endX: number,
  endY: number
) {
  await page.evaluate(
    ({ startX, startY, endX, endY }) => {
      return new Promise<void>((resolve) => {
        const identifier = Date.now();

        const touchStart = new Touch({
          identifier,
          target: document.body,
          clientX: startX,
          clientY: startY,
          radiusX: 2.5,
          radiusY: 2.5,
          rotationAngle: 10,
          force: 0.5,
        });

        document.body.dispatchEvent(
          new TouchEvent('touchstart', {
            cancelable: true,
            bubbles: true,
            touches: [touchStart],
            targetTouches: [touchStart],
            changedTouches: [touchStart],
          })
        );

        setTimeout(() => {
          const touchMove = new Touch({
            identifier,
            target: document.body,
            clientX: endX,
            clientY: endY,
            radiusX: 2.5,
            radiusY: 2.5,
            rotationAngle: 10,
            force: 0.5,
          });

          document.body.dispatchEvent(
            new TouchEvent('touchmove', {
              cancelable: true,
              bubbles: true,
              touches: [touchMove],
              targetTouches: [touchMove],
              changedTouches: [touchMove],
            })
          );

          setTimeout(() => {
            const touchEnd = new Touch({
              identifier,
              target: document.body,
              clientX: endX,
              clientY: endY,
              radiusX: 2.5,
              radiusY: 2.5,
              rotationAngle: 10,
              force: 0.5,
            });

            document.body.dispatchEvent(
              new TouchEvent('touchend', {
                cancelable: true,
                bubbles: true,
                touches: [],
                targetTouches: [],
                changedTouches: [touchEnd],
              })
            );

            setTimeout(resolve, 50);
          }, 50);
        }, 50);
      });
    },
    { startX, startY, endX, endY }
  );
}

// Synthetic WheelEvent/TouchEvent do not reliably trigger the hook in headless Chromium on Linux CI.
const skipGestureInCI = !!process.env.CI;

test.describe('Swipe Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the app to be ready
    await page.waitForLoadState('networkidle');
    // Wait for React to mount and swipe navigation hook to be initialized
    await page.waitForTimeout(500);
  });

  test('should navigate to next route on swipe left', async ({ page }) => {
    test.skip(
      skipGestureInCI,
      'Synthetic wheel/touch not reliable in headless CI'
    );
    await expect(page).toHaveURL('/');

    await triggerSwipeNavigation(page, 'left');

    await page.waitForTimeout(1200);

    await expect(page).toHaveURL('/about');
  });

  test('should navigate to previous route on swipe right', async ({ page }) => {
    test.skip(
      skipGestureInCI,
      'Synthetic wheel/touch not reliable in headless CI'
    );
    await page.goto('/about');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL('/about');

    await triggerSwipeNavigation(page, 'right');

    await page.waitForTimeout(1200);

    await expect(page).toHaveURL('/');
  });

  test('should wrap around from last route to first on swipe left', async ({
    page,
  }) => {
    test.skip(
      skipGestureInCI,
      'Synthetic wheel/touch not reliable in headless CI'
    );
    await page.goto('/contact');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL('/contact');

    await triggerSwipeNavigation(page, 'left');

    await page.waitForTimeout(1200);

    await expect(page).toHaveURL('/');
  });

  test('should wrap around from first route to last on swipe right', async ({
    page,
  }) => {
    test.skip(
      skipGestureInCI,
      'Synthetic wheel/touch not reliable in headless CI'
    );
    await expect(page).toHaveURL('/');

    await triggerSwipeNavigation(page, 'right');

    await page.waitForTimeout(1200);

    await expect(page).toHaveURL('/contact');
  });

  test('should respect navigation cooldown and not navigate too quickly', async ({
    page,
  }) => {
    test.skip(
      skipGestureInCI,
      'Synthetic wheel/touch not reliable in headless CI'
    );
    await expect(page).toHaveURL('/');

    await triggerSwipeNavigation(page, 'left');
    await triggerSwipeNavigation(page, 'left');

    await page.waitForTimeout(500);

    await expect(page).toHaveURL('/about');
  });

  test('should not navigate when swiping on interactive elements', async ({
    page,
  }) => {
    // Navigate to a page with buttons/links
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Find a button or link element
    const button = page.locator('button').first();
    if ((await button.count()) > 0) {
      const box = await button.boundingBox();
      if (box) {
        const startX = box.x + box.width / 2;
        const startY = box.y + box.height / 2;
        const endX = startX - 150; // Swipe left

        // Try to swipe on the button
        await page.mouse.move(startX, startY);
        await page.mouse.down();
        await page.mouse.move(endX, startY, { steps: 10 });
        await page.mouse.up();

        // Wait a bit
        await page.waitForTimeout(1200);

        // Should still be on the same page (navigation should not trigger)
        await expect(page).toHaveURL('/');
      }
    }
  });

  test('should navigate through all routes with consecutive swipes', async ({
    page,
  }) => {
    test.skip(
      skipGestureInCI,
      'Synthetic wheel/touch not reliable in headless CI'
    );
    await expect(page).toHaveURL('/');

    for (let i = 0; i < ROUTE_ORDER.length - 1; i++) {
      await triggerSwipeNavigation(page, 'left');
      await page.waitForTimeout(1200);
      const expectedRoute = ROUTE_ORDER[i + 1];
      await expect(page).toHaveURL(expectedRoute);
    }

    for (let i = ROUTE_ORDER.length - 1; i > 0; i--) {
      await triggerSwipeNavigation(page, 'right');
      await page.waitForTimeout(1200);
      const expectedRoute = ROUTE_ORDER[i - 1];
      await expect(page).toHaveURL(expectedRoute);
    }
  });
});
