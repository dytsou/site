import { test, expect } from '@playwright/test';
import type { TestInfo } from '@playwright/test';

/** Desktop layout exposes horizontal links in `.nav-desktop-menu` (mobile uses the hamburger). */
test.use({ viewport: { width: 1280, height: 800 } });

const INTERNAL_NAV = [
  { name: 'About', path: '/about' },
  { name: 'Experiences', path: '/experiences' },
  { name: 'Projects', path: '/projects' },
  { name: 'Contact', path: '/contact' },
] as const;

function skipIfMobileNavLayout(testInfo: TestInfo) {
  test.skip(
    testInfo.project.name === 'Mobile Chrome' ||
      testInfo.project.name === 'Mobile Safari',
    'These cases target the desktop horizontal nav; mobile uses the drawer.'
  );
}

test.describe('Routing', () => {
  test('unknown path redirects to home', async ({ page }) => {
    await page.goto('/not-a-real-route-segment-xyz', { waitUntil: 'load' });
    await expect(page.locator('#root')).toBeVisible();
    await expect(page).toHaveURL('/');
  });

  test('navigates home via brand link', async ({ page }) => {
    await page.goto('/about', { waitUntil: 'load' });
    await expect(page.locator('#root')).toBeVisible();
    await page
      .getByRole('navigation')
      .getByRole('link', { name: 'dytsou', exact: true })
      .click();
    await expect(page).toHaveURL('/');
  });

  test.describe('Desktop horizontal nav', () => {
    test.beforeEach(async ({ page }, testInfo) => {
      skipIfMobileNavLayout(testInfo);
      await page.goto('/', { waitUntil: 'load' });
      await expect(page.locator('#root')).toBeVisible();
    });

    for (const { name, path } of INTERNAL_NAV) {
      test(`nav link goes to ${path}`, async ({ page }) => {
        await page
          .getByRole('navigation')
          .locator('.nav-desktop-menu')
          .getByRole('link', { name, exact: true })
          .click();
        await expect(page).toHaveURL(path);
      });
    }
  });
});
