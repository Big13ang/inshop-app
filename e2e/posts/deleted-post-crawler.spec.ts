/**
 * E2E — Post pages for crawlers: a missing post must return HTTP 404.
 *
 * These requests go through the real server, so the backend must be running on
 * localhost:8000. A crawler request is identified by its User-Agent.
 */

import { test, expect } from '@playwright/test';

const CRAWLER_UA = 'Googlebot/2.1 (+http://www.google.com/bot.html)';
const BROWSER_UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const MISSING_POST_ID = '00000000-0000-4000-8000-000000000000';

test.describe('Post page for crawlers', () => {
  test('a missing post returns HTTP 404 to a crawler', async ({ request }) => {
    const response = await request.get(`/p/${MISSING_POST_ID}`, {
      headers: { 'user-agent': CRAWLER_UA },
    });
    expect(response.status()).toBe(404);
  });

  test('a missing post still renders the page for a normal browser', async ({ request }) => {
    const response = await request.get(`/p/${MISSING_POST_ID}`, {
      headers: { 'user-agent': BROWSER_UA },
    });
    expect(response.status()).toBe(200);
  });
});
