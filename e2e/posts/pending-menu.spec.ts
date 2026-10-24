import { test, expect } from '@playwright/test';
import { E2E_MOCKS_ENABLED, E2E_SESSION_TOKEN } from '../fixtures/mode';

test.describe('Pending Posts Menu E2E', () => {
  // Needs real pending posts on the seller's account; there is nothing to mock it against.
  test.skip(E2E_MOCKS_ENABLED, 'Real backend only: needs existing pending posts');

  test.beforeEach(async ({ page }) => {
    // Hide Next.js Dev Overlay to prevent it from intercepting pointer events in E2E tests
    await page.addInitScript(() => {
      window.addEventListener('DOMContentLoaded', () => {
        const style = document.createElement('style');
        style.innerHTML = 'nextjs-portal { display: none !important; }';
        document.head.appendChild(style);
      });
    });
  });

  test('opens and closes the pending posts menu', async ({ page, context }) => {
    // Session cookie: a fake token in mock mode, the real E2E_SESSION_TOKEN against a real backend.
    await context.addCookies([
      {
        name: 'better-auth.session_token',
        value: E2E_SESSION_TOKEN ?? '',
        domain: 'localhost',
        path: '/',
      },
    ]);

    // Go to the pending posts page
    await page.goto('/app/posts/pending');
    await page.waitForLoadState('networkidle');
    // Check that we have the page heading
    await expect(page.getByText('پست‌های در انتظار بررسی')).toBeVisible();

    // Click the first MoreHorizontal button (ellipsis menu button)
    // It has aria-label="بیشتر"
    const menuBtn = page.getByLabel('بیشتر').first();
    await expect(menuBtn).toBeVisible({ timeout: 15000 });
    await menuBtn.click();

    // Check that the dialog content drawer is visible
    // The drawer contains text "تنظیمات پیش‌نویس"
    await expect(page.getByText('تنظیمات پیش‌نویس')).toBeVisible({ timeout: 15000 });

    // The drawer contains the "حذف پیش‌نویس" button
    await expect(page.getByText('حذف پیش‌نویس')).toBeVisible({ timeout: 15000 });

    // Click on the backdrop to close the dialog
    await page.getByTestId('dialog-backdrop').click();

    // Verify it closes
    await expect(page.getByText('تنظیمات پیش‌نویس')).not.toBeVisible({ timeout: 5000 });
  });
});
