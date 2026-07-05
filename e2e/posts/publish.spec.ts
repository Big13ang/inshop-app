/**
 * E2E — Add New Post: publish (POST /api/posts)
 *
 * Covers the Step 3 "Publish" acceptance criteria: loading state, success
 * message + delayed redirect, error handling with state preservation, and
 * duplicate-submission prevention.
 */

import { test, expect } from '../fixtures';
import { text } from '../../features/posts/new/constants';

test.describe('Add New Post — publish loading state', () => {
  test('Share button shows a spinner and disables while the request is pending', async ({
    addPostPage,
  }) => {
    await addPostPage.mockSlowPublishApi(1_500);
    await addPostPage.advanceToDetailsPhase();
    await addPostPage.fillCaption('محصول جدید با کیفیت بالا');

    await addPostPage.clickShare();

    await expect(addPostPage.shareButton).toBeDisabled();
    await expect(addPostPage.shareButton.locator('svg.animate-spin')).toBeVisible();
  });
});

test.describe('Add New Post — publish success', () => {
  test('shows the admin-approval toast and redirects to pending posts page immediately', async ({
    addPostPage,
  }) => {
    await addPostPage.advanceToDetailsPhase();
    await addPostPage.fillCaption('محصول جدید با کیفیت بالا');

    const publishResponse = addPostPage.page.waitForResponse('**/api/posts');
    await addPostPage.clickShare();
    await publishResponse;

    // Verify it redirects to the pending page immediately.
    await expect(addPostPage.page).toHaveURL(/\/app\/posts\/pending$/);

    // Verify the admin-approval toast is visible.
    await expect(addPostPage.page.getByText(text.uploadSuccessTitle)).toBeVisible({
      timeout: 5_000,
    });
    await expect(addPostPage.page.getByText(text.uploadSuccessDesc)).toBeVisible();

    // Verify the pending page content is visible.
    await expect(addPostPage.page.getByText('پست‌های در انتظار بررسی')).toBeVisible();
  });
});

test.describe('Add New Post — publish failure', () => {
  test('shows an error toast on failure', async ({ addPostPage }) => {
    await addPostPage.mockPublishApiWithError();
    await addPostPage.fillAndSubmitPost('محصول جدید با کیفیت بالا');

    await expect(
      addPostPage.page.getByText('ارسال پست با خطا مواجه شد، دوباره تلاش کنید'),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('keeps the entered caption after a failed submission', async ({ addPostPage }) => {
    await addPostPage.mockPublishApiWithError();
    await addPostPage.fillAndSubmitPost('محصول جدید با کیفیت بالا');

    await expect(
      addPostPage.page.getByText('ارسال پست با خطا مواجه شد، دوباره تلاش کنید'),
    ).toBeVisible({ timeout: 5_000 });
    await expect(addPostPage.captionTextarea).toHaveValue('محصول جدید با کیفیت بالا');
  });

  test('keeps the selected image after a failed submission', async ({ addPostPage }) => {
    await addPostPage.mockPublishApiWithError();
    await addPostPage.fillAndSubmitPost('محصول جدید با کیفیت بالا');

    await expect(
      addPostPage.page.getByText('ارسال پست با خطا مواجه شد، دوباره تلاش کنید'),
    ).toBeVisible({ timeout: 5_000 });
    // The selected-media slider still shows the one selected image after the failure.
    await expect(addPostPage.page.getByText('فایل 1 از 1')).toBeVisible();
  });

  test('Share button re-enables after a failed submission so the seller can retry', async ({
    addPostPage,
  }) => {
    await addPostPage.mockPublishApiWithError();
    await addPostPage.fillAndSubmitPost('محصول جدید با کیفیت بالا');

    await expect(
      addPostPage.page.getByText('ارسال پست با خطا مواجه شد، دوباره تلاش کنید'),
    ).toBeVisible({ timeout: 5_000 });
    await expect(addPostPage.shareButton).toBeEnabled();
  });
});

test.describe('Add New Post — duplicate submission prevention', () => {
  test('only one POST /api/posts request fires even if Share is clicked while pending', async ({
    addPostPage,
  }) => {
    await addPostPage.mockSlowPublishApi(1_500);
    await addPostPage.advanceToDetailsPhase();
    await addPostPage.fillCaption('محصول جدید با کیفیت بالا');

    await addPostPage.clickShare();
    await expect(addPostPage.shareButton).toBeDisabled();

    // The button is disabled while pending, so the browser itself blocks a second click —
    // this is the mechanism the AC ("prevents duplicate requests") relies on.
    await addPostPage.shareButton.click({ force: true }).catch(() => {});

    // Give the in-flight (mocked, 1.5s) request time to resolve, then confirm
    // exactly one POST /api/posts request was ever made.
    await addPostPage.page.waitForTimeout(2_000);
    expect(addPostPage.publishRequestCount).toBe(1);
  });
});
