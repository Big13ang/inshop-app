/**
 * E2E — Add New Post: responsive layout
 *
 * These assertions run across the 'chromium' (Desktop Chrome),
 * 'mobile-chrome' (Pixel 5), and 'tablet-chrome' (iPad) Playwright projects
 * defined in playwright.config.ts.
 */

import { test, expect } from '../fixtures';

test.describe('Add New Post — mobile viewport', () => {
  test('page renders without horizontal scroll', async ({ addPostPage, page }) => {
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = page.viewportSize()?.width ?? 0;
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth);
  });

  test('Next button is visible above the fold', async ({ addPostPage, page }) => {
    const box = await addPostPage.nextButton.boundingBox();
    const viewportHeight = page.viewportSize()?.height ?? 0;
    expect(box).not.toBeNull();
    expect(box!.y + box!.height).toBeLessThanOrEqual(viewportHeight);
  });

  test('Add button is visible above the fold', async ({ addPostPage, page }) => {
    const box = await addPostPage.addButton.boundingBox();
    const viewportHeight = page.viewportSize()?.height ?? 0;
    expect(box).not.toBeNull();
    expect(box!.y + box!.height).toBeLessThanOrEqual(viewportHeight);
  });

  test('gallery renders without horizontal overflow', async ({ addPostPage }) => {
    const containerBox = await addPostPage.galleryContainer.boundingBox();
    const pageWidth     = await addPostPage.page.evaluate(() => window.innerWidth);
    if (containerBox) {
      expect(containerBox.x + containerBox.width).toBeLessThanOrEqual(pageWidth);
    }
  });
});
