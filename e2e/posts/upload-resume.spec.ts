/**
 * E2E — Add New Post: resumable interrupted uploads
 *
 * Covers "Interrupted uploads can resume from their previous progress."
 * lib/tus-client.ts uses tus-js-client, which stores upload URLs in
 * localStorage keyed by a fingerprint of the file (name, size, type,
 * lastModified). On a fresh attempt it sends HEAD to the stored URL to learn
 * how many bytes the server already has, then resumes with PATCH.
 *
 * This test drives that path across a real reload: it uploads an image big
 * enough for several 2 MB chunks, lets only the first chunk complete, reloads
 * the page (the seller closing/reopening the tab), re-selects the SAME file
 * from disk, and checks the finished chunk is never sent again.
 *
 * Compression is switched off (no OffscreenCanvas) so the original file is
 * uploaded; a compressed image would fit in a single chunk.
 */

import fs from 'fs';
import os from 'os';
import path from 'path';
import sharp from 'sharp';
import { test, expect } from '../fixtures';
import { E2E_MOCKS_ENABLED, routeMock } from '../fixtures/mode';

/** Matches `chunkSize` in lib/tus-client.ts. */
const CHUNK_SIZE = 2 * 1024 * 1024;
const UPLOAD_ID = 'resume-test-id';

const TUS_HEADERS = {
  'Tus-Resumable': '1.0.0',
  'Access-Control-Expose-Headers': 'Location, Upload-Offset, Tus-Resumable, Upload-Length',
  'Access-Control-Allow-Origin': 'http://localhost:4000',
  'Access-Control-Allow-Credentials': 'true',
};

/** A real, decodable PNG of random noise: noise barely compresses, so the file stays over two chunks. */
async function writeLargeImage(filePath: string): Promise<number> {
  await sharp({
    create: { width: 1200, height: 1200, channels: 3, background: '#808080', noise: { type: 'gaussian', mean: 128, sigma: 60 } },
  })
    .png()
    .toFile(filePath);
  return fs.statSync(filePath).size;
}

test.describe('Add New Post — resumable uploads', () => {
  test.skip(!E2E_MOCKS_ENABLED, 'Mock-only: needs a connection that dies mid-chunk');

  test('resuming after a reload re-sends only the chunk that never completed', async ({
    addPostPage,
    page,
  }) => {
    const tmpPath = path.join(os.tmpdir(), `inshop-resume-test-${Date.now()}.png`);
    const fileSize = await writeLargeImage(tmpPath);
    expect(fileSize).toBeGreaterThan(2 * CHUNK_SIZE);

    let offset = 0;
    let patchAttempts = 0;
    const sentChunkSizes: number[] = [];

    try {
      await page.addInitScript(() => {
        delete (window as unknown as { OffscreenCanvas?: unknown }).OffscreenCanvas;
      });
      await addPostPage.reload();

      // Creation: always hands back the same upload URL, on the endpoint's own origin,
      // so after the reload tus-js-client finds it in localStorage and resumes it.
      await routeMock(page, (url) => url.pathname.endsWith('/uploads'), (route) => {
        const request = route.request();
        if (request.method() !== 'POST') return route.fallback();
        const origin = new URL(request.url()).origin;
        return route.fulfill({
          status: 201,
          headers: { ...TUS_HEADERS, Location: `${origin}/uploads/${UPLOAD_ID}` },
        });
      });

      // First chunk succeeds; the second hangs once (the connection dying partway through it).
      await routeMock(page, (url) => url.pathname.endsWith(`/uploads/${UPLOAD_ID}`), async (route) => {
        const request = route.request();
        if (request.method() === 'HEAD') {
          return route.fulfill({
            status: 200,
            headers: { ...TUS_HEADERS, 'Upload-Offset': String(offset), 'Upload-Length': String(fileSize) },
          });
        }
        if (request.method() !== 'PATCH') return route.fallback();

        const startOffset = Number(request.headers()['upload-offset'] ?? '0');
        if (startOffset > 0 && patchAttempts++ === 0) {
          await new Promise(() => {}); // never resolves; the reload aborts it
          return;
        }
        const body = request.postDataBuffer();
        sentChunkSizes.push(body?.byteLength ?? 0);
        offset = startOffset + (body?.byteLength ?? 0);
        return route.fulfill({ status: 204, headers: { ...TUS_HEADERS, 'Upload-Offset': String(offset) } });
      });

      // Wait until the first chunk is done and the second one is in flight (and hanging).
      const secondChunkStarted = page.waitForRequest(
        (req) =>
          req.url().endsWith(`/uploads/${UPLOAD_ID}`) &&
          req.method() === 'PATCH' &&
          Number(req.headers()['upload-offset'] ?? '0') > 0,
      );
      await addPostPage.fileInput.setInputFiles(tmpPath);
      await secondChunkStarted;

      // The seller closes and reopens the tab mid-upload.
      await addPostPage.reload();

      // Re-select the SAME file on disk (same name/size/mtime), so the fingerprint matches.
      await addPostPage.fileInput.setInputFiles(tmpPath);
      await addPostPage.waitForGalleryHasUploadedItem();

      const remaining = fileSize - CHUNK_SIZE;
      const expectedAfterResume = [];
      for (let sent = 0; sent < remaining; sent += CHUNK_SIZE) {
        expectedAfterResume.push(Math.min(CHUNK_SIZE, remaining - sent));
      }
      expect(sentChunkSizes).toEqual([CHUNK_SIZE, ...expectedAfterResume]);
    } finally {
      fs.unlinkSync(tmpPath);
    }
  });
});
