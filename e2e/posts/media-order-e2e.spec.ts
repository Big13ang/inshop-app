/**
 * E2E — Add New Post: the publish request keeps the seller's selection order
 *
 * Uploads three images (all selected automatically, in upload order), then
 * deselects and reselects the first one so it moves to the end. The publish
 * request must list the media IDs in that new order.
 *
 * Each image's media ID comes from its tus upload URL, so the spec records
 * which upload URL belongs to which file name.
 */

import { type Page } from '@playwright/test';
import { test, expect } from '../fixtures';
import { skipUnlessPublishAllowed } from '../fixtures/mode';
import { TINY_PNG } from '../pages/AddPostPage';
import { extractMediaId } from '../../lib/utils/uuid';

const FILES = ['photo_1', 'photo_2', 'photo_3'].map((name) => ({
  name: `${name}.png`,
  mimeType: 'image/png',
  buffer: TINY_PNG,
}));

function uploadedFileName(uploadMetadata: string): string | undefined {
  const pair = uploadMetadata
    .split(',')
    .map((entry) => entry.trim().split(' '))
    .find(([key]) => key === 'filename');
  return pair ? Buffer.from(pair[1], 'base64').toString('utf-8') : undefined;
}

/** Records the media ID the app gets for each file, keyed by file name without extension (compression renames it). */
function recordMediaIds(page: Page): Map<string, string> {
  const mediaIdByFile = new Map<string, string>();
  page.on('response', async (response) => {
    const request = response.request();
    if (request.method() !== 'POST' || !new URL(response.url()).pathname.endsWith('/uploads')) return;
    const fileName = uploadedFileName((await request.allHeaders())['upload-metadata'] ?? '');
    const mediaId = extractMediaId(await response.headerValue('location'));
    if (fileName && mediaId) mediaIdByFile.set(fileName.replace(/\.[^.]+$/, ''), mediaId);
  });
  return mediaIdByFile;
}

test.describe('Add New Post — publish keeps the selection order', () => {
  test('reordering the selection changes the order of mediaIds in the publish request', async ({
    addPostPage,
  }) => {
    skipUnlessPublishAllowed();
    const mediaIdByFile = recordMediaIds(addPostPage.page);

    await addPostPage.uploadFiles(FILES);
    await addPostPage.waitForUploadedCount(3);
    await addPostPage.waitForSelectionCount(3);

    // Deselect the first image and select it again: it moves from 1st to 3rd.
    await addPostPage.clickGalleryCell(0);
    await addPostPage.waitForSelectionCount(2);
    await addPostPage.clickGalleryCell(0);
    await addPostPage.waitForSelectionCount(3);

    await addPostPage.clickNext();
    await addPostPage.fillCaption('محصول با ترتیب جدید تصاویر');
    // Read the body through a pass-through route: against a real backend the request event
    // does not expose fetch bodies. fallback() sends the request on unchanged.
    const publishPayload = new Promise<{ mediaIds: string[] }>((resolve) => {
      void addPostPage.page.route(
        (url) => url.pathname.endsWith('/upload-sessions/publish'),
        (route) => {
          if (route.request().method() === 'POST') resolve(route.request().postDataJSON());
          return route.fallback();
        },
      );
    });
    await addPostPage.clickShare();
    const payload = await publishPayload;

    expect(payload.mediaIds).toEqual([
      mediaIdByFile.get('photo_2'),
      mediaIdByFile.get('photo_3'),
      mediaIdByFile.get('photo_1'),
    ]);
  });
});
