import { test, expect } from '@playwright/test';

test.describe('Pending Posts Menu E2E', () => {
  test('opens and closes the pending posts menu', async ({ page }) => {
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

    // Click on the backdrop or close it
    // Dialog backdrop is clickable and has cursor-pointer bg-black/60 classes
    const backdrop = page.locator('div.fixed.bg-black\\/60');
    await backdrop.click();

    // Verify it closes
    await expect(page.getByText('تنظیمات پیش‌نویس')).not.toBeVisible({ timeout: 5000 });
  });
});
