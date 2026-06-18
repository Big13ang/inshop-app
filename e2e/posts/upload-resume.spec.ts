/**
 * E2E — Add New Post: resumable interrupted uploads
 *
 * Covers "Interrupted uploads can resume from their previous progress."
 * chunkStrategy.ts persists per-chunk progress to localStorage (keyed by
 * filename + size + lastModified) and, on a fresh upload attempt, asks the
 * server which chunks it already has before re-sending anything. This test
 * drives that real cross-reload path: it uploads a file large enough to
 * require two 5 MB chunks, lets only the first chunk complete, reloads the
 * page (simulating the seller closing/reopening mid-upload), re-selects the
 * SAME physical file from disk, and asserts the already-uploaded chunk is
 * never re-sent.
 */

import fs from 'fs';
import os from 'os';
import path from 'path';
import { test, expect } from '../fixtures';
import { MOCK_CDN_URL } from '../pages/AddPostPage';

// 7 MB: over the 5 MB chunk size (so the upload splits into 2 chunks),
// under the 10 MB per-image limit (so client-side validation still passes).
const RESUME_FILE_SIZE = 7 * 1024 * 1024;

test.describe('Add New Post — resumable uploads', () => {
  test('resuming after a reload re-sends only the chunk that never completed', async ({
    addPostPage,
    page,
  }) => {
    const tmpPath = path.join(os.tmpdir(), `inshop-resume-test-${Date.now()}.png`);
    fs.writeFileSync(tmpPath, Buffer.alloc(RESUME_FILE_SIZE));

    try {
      // Chunk 0 succeeds immediately; chunk 1 hangs forever — simulates the
      // connection dying partway through the second chunk.
      await page.route('**/api/upload/chunk**', async (route) => {
        const url = new URL(route.request().url());
        if (url.searchParams.get('index') === '1') {
          await new Promise(() => {}); // never resolves; reload aborts it
          return;
        }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ url: MOCK_CDN_URL }),
        });
      });

      const chunk0Done = page.waitForResponse(
        (res) => res.url().includes('/api/upload/chunk') && res.url().includes('index=0'),
      );

      await addPostPage.fileInput.setInputFiles(tmpPath);
      await chunk0Done;

      // Simulate the seller closing/reopening the tab mid-upload.
      await page.reload();
      await expect(addPostPage.nextButton).toBeVisible();

      // The server confirms it already has chunk 0; only chunk 1 is missing.
      await page.route('**/api/upload/*/chunks**', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ received: [0] }),
        }),
      );

      const sentIndices: string[] = [];
      await page.route('**/api/upload/chunk**', (route) => {
        const url = new URL(route.request().url());
        sentIndices.push(url.searchParams.get('index')!);
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ url: MOCK_CDN_URL }),
        });
      });
      await page.route('**/api/upload/*/finalize**', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ url: MOCK_CDN_URL }),
        }),
      );

      // Re-select the SAME physical file — same name/size/mtime, so
      // chunkStrategy's resumeKey matches the pre-reload attempt.
      await addPostPage.fileInput.setInputFiles(tmpPath);
      await addPostPage.waitForGalleryHasUploadedItem();

      expect(sentIndices).toEqual(['1']);
    } finally {
      fs.unlinkSync(tmpPath);
    }
  });
});
