import { test, expect, Page } from '@playwright/test';

const ROUTE_ORDER = ['/', '/about', '/experiences', '/projects', '/contact'];

/**
 * Helper function to simulate a touch swipe gesture
 */
async function simulateTouchSwipe(
  page: Page,
  startX: number,
  startY: number,
  endX: number,
  endY: number
) {
  const identifier = Date.now();

  // Dispatch touchstart
  await page.evaluate(
    ({ startX, startY, identifier }) => {
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
    },
    { startX, startY, identifier }
  );

  await page.waitForTimeout(10);

  // Dispatch touchmove
  await page.evaluate(
    ({ endX, endY, identifier }) => {
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
    },
    { endX, endY, identifier }
  );

  await page.waitForTimeout(10);

  // Dispatch touchend
  await page.evaluate(
    ({ endX, endY, identifier }) => {
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
    },
    { endX, endY, identifier }
  );

  await page.waitForTimeout(50);
}

test.describe('Swipe Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the app to be ready
    await page.waitForLoadState('networkidle');
  });

  test('should navigate to next route on swipe left', async ({ page }) => {
    // Start at home page
    await expect(page).toHaveURL('/');

    // Perform swipe left gesture using touch events
    const viewport = page.viewportSize();
    if (!viewport) {
      throw new Error('Viewport size not available');
    }

    const startX = viewport.width / 2;
    const startY = viewport.height / 2;
    const endX = startX - 150; // Swipe left (negative X)

    // Simulate touch swipe
    await simulateTouchSwipe(page, startX, startY, endX, startY);

    // Wait for navigation cooldown (1000ms) plus some buffer
    await page.waitForTimeout(1200);

    // Should navigate to /about
    await expect(page).toHaveURL('/about');
  });

  test('should navigate to previous route on swipe right', async ({ page }) => {
    // Navigate to /about first
    await page.goto('/about');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL('/about');

    // Perform swipe right gesture using touch events
    const viewport = page.viewportSize();
    if (!viewport) {
      throw new Error('Viewport size not available');
    }

    const startX = viewport.width / 2;
    const startY = viewport.height / 2;
    const endX = startX + 150; // Swipe right (positive X)

    // Simulate touch swipe
    await simulateTouchSwipe(page, startX, startY, endX, startY);

    // Wait for navigation cooldown (1000ms) plus some buffer
    await page.waitForTimeout(1200);

    // Should navigate back to /
    await expect(page).toHaveURL('/');
  });

  test('should wrap around from last route to first on swipe left', async ({
    page,
  }) => {
    // Navigate to last route (/contact)
    await page.goto('/contact');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL('/contact');

    // Perform swipe left gesture
    const viewport = page.viewportSize();
    if (!viewport) {
      throw new Error('Viewport size not available');
    }

    const startX = viewport.width / 2;
    const startY = viewport.height / 2;
    const endX = startX - 150; // Swipe left

    await simulateTouchSwipe(page, startX, startY, endX, startY);

    // Wait for navigation cooldown
    await page.waitForTimeout(1200);

    // Should wrap around to home (/)
    await expect(page).toHaveURL('/');
  });

  test('should wrap around from first route to last on swipe right', async ({
    page,
  }) => {
    // Start at home page
    await expect(page).toHaveURL('/');

    // Perform swipe right gesture
    const viewport = page.viewportSize();
    if (!viewport) {
      throw new Error('Viewport size not available');
    }

    const startX = viewport.width / 2;
    const startY = viewport.height / 2;
    const endX = startX + 150; // Swipe right

    await simulateTouchSwipe(page, startX, startY, endX, startY);

    // Wait for navigation cooldown
    await page.waitForTimeout(1200);

    // Should wrap around to /contact
    await expect(page).toHaveURL('/contact');
  });

  test('should respect navigation cooldown and not navigate too quickly', async ({
    page,
  }) => {
    // Start at home page
    await expect(page).toHaveURL('/');

    const viewport = page.viewportSize();
    if (!viewport) {
      throw new Error('Viewport size not available');
    }

    const startX = viewport.width / 2;
    const startY = viewport.height / 2;
    const endX = startX - 150; // Swipe left

    // Perform first swipe
    await simulateTouchSwipe(page, startX, startY, endX, startY);

    // Immediately perform second swipe (should be ignored due to cooldown)
    await simulateTouchSwipe(page, startX, startY, endX, startY);

    // Wait a short time (less than cooldown)
    await page.waitForTimeout(500);

    // Should only have navigated once (to /about), not twice
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
    // Start at home
    await expect(page).toHaveURL('/');

    const viewport = page.viewportSize();
    if (!viewport) {
      throw new Error('Viewport size not available');
    }

    const startX = viewport.width / 2;
    const startY = viewport.height / 2;
    const endXLeft = startX - 150; // Swipe left
    const endXRight = startX + 150; // Swipe right

    // Navigate forward through all routes
    for (let i = 0; i < ROUTE_ORDER.length - 1; i++) {
      await simulateTouchSwipe(page, startX, startY, endXLeft, startY);

      // Wait for navigation cooldown
      await page.waitForTimeout(1200);

      // Verify we're on the expected route
      const expectedRoute = ROUTE_ORDER[i + 1];
      await expect(page).toHaveURL(expectedRoute);
    }

    // Navigate backward through all routes
    for (let i = ROUTE_ORDER.length - 1; i > 0; i--) {
      await simulateTouchSwipe(page, startX, startY, endXRight, startY);

      // Wait for navigation cooldown
      await page.waitForTimeout(1200);

      // Verify we're on the expected route
      const expectedRoute = ROUTE_ORDER[i - 1];
      await expect(page).toHaveURL(expectedRoute);
    }
  });
});
