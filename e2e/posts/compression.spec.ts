/**
 * E2E — Add New Post: client-side image compression
 *
 * Real browser, real compression worker (WASM). Only the tus API is mocked
 * (see AddPostPage.mockUploadApi); the bytes the page PATCHes are captured and
 * decoded in Node with sharp, so assertions are about what would hit the server.
 */

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';
import type { Page } from '@playwright/test';

import { test, expect } from '../fixtures';

const IMAGES_DIR = join(__dirname, '..', 'fixtures', 'images');
const MAX_UPLOAD_BYTES = 100 * 1024;
const OPTIMIZING_LABEL = 'بهینه‌سازی…';
const WORKER_REQUEST = /compress[._-]?worker/i;

type CapturedUpload = {
  metadata: Record<string, string>;
  uploadLength: number;
  body: Buffer;
};

async function loadFixture(name: string, mimeType: string) {
  return { name, mimeType, buffer: await readFile(join(IMAGES_DIR, name)) };
}

function decodeMetadata(header: string): Record<string, string> {
  const entries = header
    .split(',')
    .map((pair) => pair.trim().split(' '))
    .filter(([key]) => key)
    .map(([key, value]) => [key, Buffer.from(value ?? '', 'base64').toString('utf-8')] as const);
  return Object.fromEntries(entries);
}

function isTusRequest(url: string): boolean {
  return new URL(url).pathname.includes('/uploads');
}

/** Records every tus POST (creation) and PATCH (bytes) the page sends. */
function captureUploads(page: Page) {
  // PATCH URLs are minted by the mock, so bind each to the oldest unbound creation
  // (the specs that read bodies upload one file at a time).
  const uploadsByUrl = new Map<string, CapturedUpload>();
  const creations: CapturedUpload[] = [];

  page.on('request', async (request) => {
    if (!isTusRequest(request.url())) return;
    const headers = await request.allHeaders();

    if (request.method() === 'POST') {
      creations.push({
        metadata: decodeMetadata(headers['upload-metadata'] ?? ''),
        uploadLength: Number(headers['upload-length'] ?? 0),
        body: Buffer.alloc(0),
      });
      return;
    }

    if (request.method() === 'PATCH') {
      const body = request.postDataBuffer();
      const bound = new Set(uploadsByUrl.values());
      const target = uploadsByUrl.get(request.url()) ?? creations.find((c) => !bound.has(c));
      if (!target || !body) return;
      uploadsByUrl.set(request.url(), target);
      target.body = Buffer.concat([target.body, body]);
    }
  });

  return { creations };
}

async function waitForUploads(creations: CapturedUpload[], count: number) {
  await expect.poll(() => creations.filter((c) => c.body.length > 0).length, { timeout: 30_000 }).toBe(count);
}

test.describe('Add New Post — client-side compression', () => {
  test('4000×3000 JPEG is uploaded as WebP, ≤100 KB, 1920×1440', async ({ addPostPage }) => {
    const { creations } = captureUploads(addPostPage.page);
    await addPostPage.uploadFiles([await loadFixture('photo-4000x3000.jpg', 'image/jpeg')]);
    await addPostPage.waitForUploadedCount(1, 30_000);
    await waitForUploads(creations, 1);

    const [upload] = creations;
    expect(upload.metadata.filetype).toBe('image/webp');
    expect(upload.metadata.filename).toMatch(/\.webp$/);
    expect(upload.uploadLength).toBeLessThanOrEqual(MAX_UPLOAD_BYTES);

    const info = await sharp(upload.body).metadata();
    expect(info.format).toBe('webp');
    expect(info.width).toBe(1920);
    expect(info.height).toBe(1440);
  });

  test('panorama keeps its short side ≥ 1080', async ({ addPostPage }) => {
    const { creations } = captureUploads(addPostPage.page);
    await addPostPage.uploadFiles([await loadFixture('panorama-4000x2000.jpg', 'image/jpeg')]);
    await addPostPage.waitForUploadedCount(1, 30_000);
    await waitForUploads(creations, 1);

    const info = await sharp(creations[0].body).metadata();
    expect(Math.min(info.width ?? 0, info.height ?? 0)).toBeGreaterThanOrEqual(1080);
    expect(creations[0].uploadLength).toBeLessThanOrEqual(MAX_UPLOAD_BYTES);
  });

  test('transparent PNG keeps its alpha channel', async ({ addPostPage }) => {
    const { creations } = captureUploads(addPostPage.page);
    await addPostPage.uploadFiles([await loadFixture('transparent-1600x1200.png', 'image/png')]);
    await addPostPage.waitForUploadedCount(1, 30_000);
    await waitForUploads(creations, 1);

    const info = await sharp(creations[0].body).metadata();
    expect(info.hasAlpha).toBe(true);
    const { data, info: raw } = await sharp(creations[0].body)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    // Left half of the fixture is fully transparent: sample a pixel there.
    const offset = (Math.floor(raw.height / 2) * raw.width + 5) * raw.channels;
    expect(data[offset + 3]).toBe(0);
  });

  test('status goes optimizing → uploading → uploaded with the Persian label shown', async ({ addPostPage }) => {
    const { page } = addPostPage;
    await page.evaluate(() => {
      const seen: string[] = [];
      (window as unknown as { __statuses: string[] }).__statuses = seen;
      const record = () => {
        const cell = document.querySelector('#selected-gallery-container [data-status]');
        const status = cell?.getAttribute('data-status');
        if (status && seen[seen.length - 1] !== status) seen.push(status);
      };
      new MutationObserver(record).observe(document.body, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ['data-status'],
      });
    });
    // Hold the PATCH so "uploading" is observable.
    await page.route(
      (url) => url.pathname.includes('/uploads'),
      async (route) => {
        if (route.request().method() === 'PATCH') await new Promise((r) => setTimeout(r, 400));
        await route.fallback();
      },
    );

    await addPostPage.uploadFiles([await loadFixture('photo-4000x3000.jpg', 'image/jpeg')]);
    await expect(addPostPage.galleryContainer.getByText(OPTIMIZING_LABEL)).toBeVisible({ timeout: 15_000 });
    await addPostPage.waitForUploadedCount(1, 30_000);

    const statuses = await page.evaluate(() => (window as unknown as { __statuses: string[] }).__statuses);
    const relevant = statuses.filter((s) => ['optimizing', 'uploading', 'uploaded'].includes(s));
    expect(relevant).toEqual(['optimizing', 'uploading', 'uploaded']);
  });

  test('without OffscreenCanvas the original JPEG is uploaded', async ({ addPostPage }) => {
    const { page } = addPostPage;
    // Fresh navigation so the init script runs before the app evaluates support.
    await page.addInitScript(() => {
      delete (window as unknown as { OffscreenCanvas?: unknown }).OffscreenCanvas;
    });
    await page.reload();
    await addPostPage.dismissOnboardingIfPresent();

    const { creations } = captureUploads(page);
    const original = await loadFixture('photo-4000x3000.jpg', 'image/jpeg');
    await addPostPage.uploadFiles([original]);
    await addPostPage.waitForUploadedCount(1, 30_000);
    await waitForUploads(creations, 1);

    expect(creations[0].metadata.filetype).toBe('image/jpeg');
    expect(creations[0].metadata.filename).toBe(original.name);
    expect(creations[0].body.equals(original.buffer)).toBe(true);
  });

  test('a 404 on the worker chunk falls back to the original and does not retry endlessly', async ({ addPostPage }) => {
    const { page } = addPostPage;
    let workerRequests = 0;
    await page.route(
      (url) => WORKER_REQUEST.test(url.pathname),
      (route) => {
        workerRequests += 1;
        return route.fulfill({ status: 404, body: 'not found' });
      },
    );
    // Drop warmed workers so the next compression has to fetch the script again.
    await page.reload();
    await addPostPage.dismissOnboardingIfPresent();

    const { creations } = captureUploads(page);
    const original = await loadFixture('photo-4000x3000.jpg', 'image/jpeg');
    await addPostPage.uploadFiles([original]);
    await addPostPage.waitForUploadedCount(1, 30_000);
    await waitForUploads(creations, 1);

    expect(creations[0].metadata.filetype).toBe('image/jpeg');
    expect(creations[0].body.equals(original.buffer)).toBe(true);
    expect(workerRequests).toBeGreaterThan(0);
    // The breaker trips after 3 failures, but the prewarmed worker and an
    // on-demand one can both be in flight first, so assert "stops", not "== 3".
    const settled = workerRequests;
    await page.waitForTimeout(5_000);
    expect(workerRequests).toBe(settled);
    expect(workerRequests).toBeLessThanOrEqual(5);
  });

  test('compression never triggers a file download', async ({ addPostPage }) => {
    const { page } = addPostPage;
    const downloads: string[] = [];
    page.on('download', (download) => downloads.push(download.suggestedFilename()));

    await addPostPage.uploadFiles([await loadFixture('photo-4000x3000.jpg', 'image/jpeg')]);
    await addPostPage.waitForUploadedCount(1, 30_000);
    await page.waitForTimeout(500);

    expect(downloads).toEqual([]);
  });

  test('10 photos: Next stays disabled while any is in progress and all reach uploaded', async ({ addPostPage }) => {
    const { page } = addPostPage;
    await page.evaluate(() => {
      const win = window as unknown as { __violations: number; __sawBusy: boolean };
      win.__violations = 0;
      win.__sawBusy = false;
      const check = () => {
        const busy = document.querySelector(
          '#selected-gallery-container [data-status="queued"], [data-status="optimizing"], [data-status="uploading"], [data-status="pending"]',
        );
        const next = document.querySelector<HTMLButtonElement>('#btn-next-step');
        if (!busy || !next) return;
        win.__sawBusy = true;
        if (!next.disabled) win.__violations += 1;
      };
      new MutationObserver(check).observe(document.body, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ['data-status', 'disabled'],
      });
    });

    const photo = await loadFixture('photo-4000x3000.jpg', 'image/jpeg');
    const files = Array.from({ length: 10 }, (_, i) => ({ ...photo, name: `photo-${i}.jpg` }));
    await addPostPage.uploadFiles(files);

    await expect(addPostPage.nextButton).toBeDisabled();
    await addPostPage.waitForUploadedCount(10, 90_000);
    await expect(addPostPage.nextButton).toBeEnabled();

    const result = await page.evaluate(() => {
      const win = window as unknown as { __violations: number; __sawBusy: boolean };
      return { violations: win.__violations, sawBusy: win.__sawBusy };
    });
    expect(result.sawBusy).toBe(true);
    expect(result.violations).toBe(0);
  });
});
