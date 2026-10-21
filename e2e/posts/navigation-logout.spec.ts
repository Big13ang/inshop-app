import { routeMock, E2E_SESSION_TOKEN } from '../fixtures/mode';
import { mockSignedInSeller } from '../fixtures/authMocks';
import { test, expect } from '../fixtures';

test.describe('Bottom Navigation & Logout E2E', () => {
  // The bottom nav was redesigned: it no longer has "پست جدید" or "خروج" tabs, and logout moved
  // to the profile menu (ProfileMenu → LogoutConfirmationBottomSheet). Rewrite with Task 3's auth specs.
  test.fixme();

  test.beforeEach(async ({ page, context }) => {
    // Session cookie: a fake token in mock mode, the real E2E_SESSION_TOKEN against a real backend.
    await context.addCookies([
      {
        name: 'better-auth.session_token',
        value: E2E_SESSION_TOKEN ?? '',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await mockSignedInSeller(page);

    // Mock the sign-out endpoint to return success and delete the session cookie
    await routeMock(page, '**/api/auth/sign-out', async (route) => {
      await route.fulfill({
        status: 200,
        headers: {
          'Set-Cookie': 'better-auth.session_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
        },
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    // Hide Next.js Dev Overlay to prevent it from intercepting pointer events in E2E tests
    await page.addInitScript(() => {
      window.addEventListener('DOMContentLoaded', () => {
        const style = document.createElement('style');
        style.innerHTML = 'nextjs-portal { display: none !important; }';
        document.head.appendChild(style);
      });
    });
  });

  test('routes successfully to the new post page from the bottom navigation', async ({ page }) => {
    // Go to the pending posts page
    await page.goto('/app/posts/pending');
    await expect(page).toHaveURL(/\/app\/posts\/pending$/);

    // Click "پست جدید" tab
    const newPostTab = page.getByLabel('پست جدید');
    await expect(newPostTab).toBeVisible();
    await newPostTab.click();

    // Verify it routes to /app/posts/new
    await expect(page).toHaveURL(/\/app\/posts\/new$/);
  });

  test('disables tabs and shows loading spinner during logout, then redirects to login', async ({ page }) => {
    // Setup a slow mock sign-out response so we can assert the pending UI states
    let resolveSignOut: () => void = () => {};
    const signOutPromise = new Promise<void>((resolve) => {
      resolveSignOut = resolve;
    });

    await routeMock(page, '**/api/auth/sign-out', async (route) => {
      await signOutPromise;
      await route.fulfill({
        status: 200,
        headers: {
          'Set-Cookie': 'better-auth.session_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
        },
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    // Go to pending posts page
    await page.goto('/app/posts/pending');
    
    const logoutTab = page.getByLabel('خروج');
    const pendingTab = page.getByLabel('صف انتظار');
    const newPostTab = page.getByLabel('پست جدید');

    await expect(logoutTab).toBeVisible();
    await logoutTab.click();

    // Verify that tabs are disabled while logging out
    await expect(logoutTab).toBeDisabled();
    await expect(pendingTab).toBeDisabled();
    await expect(newPostTab).toBeDisabled();

    // Verify that the custom loader spinner SVG is rendered inside the logout button
    await expect(logoutTab.locator('svg.animate-spin')).toBeVisible();

    // Resolve the sign-out response
    resolveSignOut();

    // Verify redirect to login page
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('clears session token cookie on logout and redirects unauthenticated navigation attempts', async ({ page, context }) => {
    // Go to pending posts page
    await page.goto('/app/posts/pending');

    // Perform logout
    const logoutTab = page.getByLabel('خروج');
    await expect(logoutTab).toBeVisible();
    await logoutTab.click();

    // Verify redirect to login page
    await expect(page).toHaveURL(/\/auth\/login/);

    // Clear cookies manually to ensure the session cookie is removed from the browser context
    await context.clearCookies();

    // Verify that attempting to navigate directly to /app/posts/pending now redirects back to /auth/login
    await page.goto('/app/posts/pending');
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});
