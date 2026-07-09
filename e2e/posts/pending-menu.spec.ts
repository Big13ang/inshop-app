import { test, expect } from '@playwright/test';

test.describe('Pending Posts Menu E2E', () => {
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
    // Set a mock session token cookie to bypass proxy authentication check
    await context.addCookies([
      {
        name: 'better-auth.session_token',
        value: 'mock-session-token',
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
