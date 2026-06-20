/**
 * E2E — Add New Post: resumable interrupted uploads
 *
 * Covers "Interrupted uploads can resume from their previous progress."
 * chunkStrategy.ts uses tus-js-client, which persists upload URLs to
 * localStorage keyed by a fingerprint of the file (name, size, type,
 * lastModified) and, on a fresh attempt, sends a HEAD request to the
 * previously-stored upload URL to discover how many bytes the server
 * already has before resuming with PATCH. This test drives that real
 * cross-reload path: it uploads a file large enough to require two 5 MB
 * chunks, lets only the first chunk's PATCH complete, reloads the page
 * (simulating the seller closing/reopening mid-upload), re-selects the
 * SAME physical file from disk, and asserts the already-uploaded chunk is
 * never re-sent.
 */

import fs from 'fs';
import os from 'os';
import path from 'path';
import { test, expect } from '../fixtures';

// 7 MB: over the 5 MB chunk size (so the upload splits into 2 chunks),
// under the 10 MB per-image limit (so client-side validation still passes).
const RESUME_FILE_SIZE = 7 * 1024 * 1024;
const UPLOAD_ID = 'resume-test-id';

test.describe('Add New Post — resumable uploads', () => {
  test('resuming after a reload re-sends only the chunk that never completed', async ({
    addPostPage,
    page,
  }) => {
    const tmpPath = path.join(os.tmpdir(), `inshop-resume-test-${Date.now()}.png`);
    fs.writeFileSync(tmpPath, Buffer.alloc(RESUME_FILE_SIZE));

    let offset = 0;
    const sentChunkSizes: number[] = [];

    try {
      // Creation: always hands back the same upload id, so a HEAD probe
      // after reload can find it via tus-js-client's localStorage record.
      await page.route('**/api/upload', (route) => {
        if (route.request().method() !== 'POST') return route.continue();
        return route.fulfill({
          status: 201,
          headers: { Location: `/api/upload/${UPLOAD_ID}`, 'Tus-Resumable': '1.0.0' },
        });
      });

      // First chunk (offset 0) succeeds; second chunk (offset 5MB) hangs
      // forever — simulates the connection dying partway through it.
      await page.route(`**/api/upload/${UPLOAD_ID}`, async (route) => {
        const request = route.request();
        if (request.method() === 'HEAD') {
          return route.fulfill({
            status: 200,
            headers: { 'Upload-Offset': String(offset), 'Tus-Resumable': '1.0.0' },
          });
        }
        if (request.method() === 'PATCH') {
          const startOffset = Number(request.headers()['upload-offset'] ?? '0');
          if (startOffset > 0) {
            await new Promise(() => {}); // never resolves; reload aborts it
            return;
          }
          const body = request.postDataBuffer();
          sentChunkSizes.push(body?.byteLength ?? 0);
          offset = startOffset + (body?.byteLength ?? 0);
          return route.fulfill({
            status: 204,
            headers: { 'Upload-Offset': String(offset), 'Tus-Resumable': '1.0.0' },
          });
        }
        return route.continue();
      });

      const chunk0Done = page.waitForResponse(
        (res) => res.url().endsWith(`/api/upload/${UPLOAD_ID}`) && res.request().method() === 'PATCH',
      );

      await addPostPage.fileInput.setInputFiles(tmpPath);
      await chunk0Done;

      // Simulate the seller closing/reopening the tab mid-upload.
      await page.reload();
      await expect(addPostPage.nextButton).toBeVisible();

      // Re-select the SAME physical file — same name/size/mtime, so
      // tus-js-client's fingerprint matches the pre-reload attempt and it
      // resumes via HEAD instead of starting a new upload from byte 0.
      await addPostPage.fileInput.setInputFiles(tmpPath);
      await addPostPage.waitForGalleryHasUploadedItem();

      expect(sentChunkSizes).toEqual([5 * 1024 * 1024, 2 * 1024 * 1024]);
    } finally {
      fs.unlinkSync(tmpPath);
    }
  });
});
