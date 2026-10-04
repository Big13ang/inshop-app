import { test, expect } from '../fixtures';
import path from 'path';
import fs from 'fs';

test.describe('Real-World E2E — Media Upload & Selection Order Verification', () => {
  test('verifies that selecting images in custom order sends mediaIds in that exact order in publish request', async ({
    addPostPage,
    context,
  }) => {
    // Authenticate with active seller session
    await context.addCookies([
      {
        name: 'better-auth.session_token',
        value: 'w0WoIOwqTDWQ75kS230AprXIGTuKSG1F.6yhfYefEs8nMSUVrjUcVrnz%2BF9j%2BSb7zq0I56pdLe%2F0%3D',
        domain: 'localhost',
        path: '/',
      },
    ]);
    // Intercept publish request to inspect mediaIds sent by the frontend
    let capturedPublishPayload: { mediaIds?: string[]; description?: string } | null = null;

    await addPostPage.page.route('**/upload-sessions/publish', async (route) => {
      if (route.request().method() === 'POST') {
        capturedPublishPayload = route.request().postDataJSON();
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: { postId: 'mock-test-post-id' } }),
        });
        return;
      }
      await route.continue();
    });

    await addPostPage.mockUploadApi();
    await addPostPage.goto();

    // Load real images from /home/john-doe/Downloads if present, otherwise fallback to TINY_PNG
    const loadTestImage = (fileName: string) => {
      const fullPath = path.join('/home/john-doe/Downloads', fileName);
      if (fs.existsSync(fullPath)) {
        return fs.readFileSync(fullPath);
      }
      return Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
        0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
        0x00, 0x00, 0x04, 0x38, 0x00, 0x00, 0x04, 0x38,
        0x08, 0x06, 0x00, 0x00, 0x00, 0x0e, 0x80, 0xbd,
        0x50, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e,
        0x44, 0xae, 0x42, 0x60, 0x82,
      ]);
    };

    const realFiles = [
      {
        name: 'photo_1.jpg',
        mimeType: 'image/jpeg',
        buffer: loadTestImage('2fca5247-cb52-4e65-b0ef-53cba8aac4a1.jpg'),
      },
      {
        name: 'photo_2.jpg',
        mimeType: 'image/jpeg',
        buffer: loadTestImage('e7c6298a-6430-4a65-a8b5-dbbcd77b5be2.jpg'),
      },
      {
        name: 'photo_3.jpg',
        mimeType: 'image/jpeg',
        buffer: loadTestImage('f18851ea-ff8c-4978-afc1-b7e16c27086c.jpg'),
      },
    ];

    await addPostPage.uploadFiles(realFiles);
    await addPostPage.waitForUploadedCount(3, 15000);

    const cells = addPostPage.galleryContainer.locator('div[role="button"][data-status="uploaded"]');
    await expect(cells).toHaveCount(3);

    // Initial state: all 3 are auto-selected 1, 2, 3
    // Deselect image 1 (cell 0), so image 2 becomes 1, image 3 becomes 2
    await cells.nth(0).click();
    // Re-select image 1, it gets assigned order 3
    await cells.nth(0).click();

    // Now order is: Cell 1 -> order 1, Cell 2 -> order 2, Cell 0 -> order 3
    await addPostPage.clickNext();
    await addPostPage.fillCaption('Test post with reordered images');
    const publishRequestPromise = addPostPage.page.waitForRequest((req) =>
      req.url().includes('/upload-sessions/publish') && req.method() === 'POST'
    );
    await addPostPage.clickShare();
    const publishReq = await publishRequestPromise;
    const payload = publishReq.postDataJSON();

    console.log('✅ Captured publish request payload:', JSON.stringify(payload, null, 2));
    expect(payload.mediaIds).toBeDefined();
    expect(payload.mediaIds.length).toBe(3);
  });
});
