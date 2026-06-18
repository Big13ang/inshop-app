/**
 * E2E — Add New Post: accessibility
 */

import { test, expect } from '../fixtures';
import { text } from '../../features/posts/new/constants';

test.describe('Add New Post — accessibility', () => {
  test('caption textarea is associated with its label via htmlFor', async ({ addPostPage }) => {
    await addPostPage.advanceToDetailsPhase();
    // If the association is broken, getByLabel returns nothing
    const labelledInput = addPostPage.page.getByLabel(text.captionLabel);
    await expect(labelledInput).toBeVisible();
  });

  test('back button is present and focusable', async ({ addPostPage }) => {
    await expect(addPostPage.backButton).toBeVisible();
    await addPostPage.backButton.focus();
    await expect(addPostPage.backButton).toBeFocused();
  });
});
