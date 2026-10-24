/**
 * E2E — Deleting a post returns the seller to the page they came from.
 *
 * Journey: seller profile → open a post from the grid → delete it from the post menu.
 * Expected: the user lands back on the profile, and no "post not found" screen appears.
 *
 * With E2E_MOCK=true the backend is mocked in the browser. With mocks off it needs a real
 * seller account whose username is E2E_SELLER_USERNAME and at least one post.
 */

import { test, expect, type Page } from '@playwright/test';
import { routeMock, E2E_MOCKS_ENABLED } from '../fixtures/mode';

const SELLER_USERNAME = 'shop1';
const POST_ID = '4380ac97-742d-4fc7-9924-20a5b404382a';
const NOT_FOUND_TEXT = 'POST NOT FOUND';

const SHOP = {
  username: SELLER_USERNAME,
  shopName: 'Shop One',
  bio: null,
  profilePhotoUrl: null,
  shopPhoneNumber: null,
  address: null,
};

const PRODUCT = {
  id: POST_ID,
  sellerId: 'seller-1',
  description: 'محصول تست',
  status: 'APPROVED',
  rejectReason: null,
  createdAt: '2026-10-01T10:00:00.000Z',
  updatedAt: '2026-10-01T10:00:00.000Z',
  reviewedBy: null,
  reviewedAt: null,
  media: [],
  username: SELLER_USERNAME,
  shopName: SHOP.shopName,
};

const PUBLIC_POST = {
  id: POST_ID,
  description: 'محصول تست',
  publishedAt: '2026-10-01T10:00:00.000Z',
  owner: SHOP,
  media: [],
};

/** Backend state shared by every route handler below. Flips to "deleted" on DELETE. */
type BackendState = { postDeleted: boolean };

async function mockBackend(page: Page, state: BackendState) {
  await routeMock(page, /localhost:8000\//, async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const json = (status: number, body: unknown) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

    if (path === '/me') {
      return json(200, {
        success: true,
        data: {
          id: 'user-1',
          name: 'Seller',
          email: 'seller@example.com',
          isVerifiedSeller: true,
          sellerActivatedAt: null,
          isAdmin: false,
          sellerProfile: { id: 'seller-profile-1', userId: 'user-1', username: SELLER_USERNAME, shopName: SHOP.shopName },
        },
      });
    }
    if (path === `/posts/seller/username/${SELLER_USERNAME}`) {
      return json(200, {
        success: true,
        data: { shop: SHOP, products: state.postDeleted ? [] : [PRODUCT] },
      });
    }
    if (path === `/posts/${POST_ID}`) {
      return state.postDeleted
        ? json(404, { success: false, error: { code: 'NOT_FOUND', message: 'پست یافت نشد.' } })
        : json(200, { success: true, data: PUBLIC_POST });
    }
    if (path === `/seller/posts/${POST_ID}` && request.method() === 'DELETE') {
      state.postDeleted = true;
      return json(200, { success: true, data: null });
    }
    return json(200, { success: true, data: [], pagination: { hasNext: false, nextCursor: null } });
  });
}

test.describe('Deleting a post from a seller profile', () => {
  test.skip(!E2E_MOCKS_ENABLED, 'Real-backend seed data is not wired yet; run with E2E_MOCK=true.');

  test('returns to the profile without showing a not-found screen', async ({ page }) => {
    const state: BackendState = { postDeleted: false };
    await mockBackend(page, state);

    await page.goto(`/@${SELLER_USERNAME}`, { waitUntil: 'networkidle' });
    await page.locator(`a[href="/p/${POST_ID}"]`).first().click();
    await expect(page).toHaveURL(new RegExp(`/p/${POST_ID}$`));

    await page.getByRole('button', { name: 'بیشتر', exact: true }).click();
    await page.getByText('حذف پست', { exact: true }).click();
    await page.getByRole('button', { name: 'تایید حذف' }).click();

    await expect(page).toHaveURL(new RegExp(`/@${SELLER_USERNAME}$`), { timeout: 30_000 });
    await expect(page.getByText(NOT_FOUND_TEXT)).toHaveCount(0);
    expect(state.postDeleted).toBe(true);
  });
});
