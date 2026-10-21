import { type Locator, type Page, expect } from '@playwright/test';
import { text } from '@/features/profile/constants';

/** The signed-in user's own page at /app/profile */
export class ProfilePage {
  readonly page: Page;
  readonly menuButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.menuButton = page.locator('#profile-menu-trigger-btn');
  }

  async goto() {
    await this.page.goto('/app/profile');
    await expect(this.menuButton).toBeVisible();
  }

  /** Logs out through the 3-dots menu and its confirmation sheet */
  async logOut() {
    await this.menuButton.click();
    await this.page.getByRole('button', { name: text.menu.items.logout.title }).click();
    await this.page.locator('#logout-confirm-btn').click();
  }
}
