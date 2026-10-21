import { type Locator, type Page } from '@playwright/test';

/** The signed-in user's edit page at /app/profile/edit */
export class ProfileEditPage {
  readonly page: Page;
  /** Shown to a verified seller who has no shop profile yet */
  readonly newSellerNotice: Locator;

  constructor(page: Page) {
    this.page = page;
    this.newSellerNotice = page.locator('#first-time-seller-alert');
  }
}
