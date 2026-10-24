import { type Locator, type Page, expect } from '@playwright/test';
import type { SellerApplication } from '../support/sellers';

// Each label ends with the required marker, whose accessible name is this
const REQUIRED_MARK = 'الزامی';

/** The two-step seller application form at /seller/apply */
export class SellerApplyPage {
  readonly page: Page;
  readonly successHeading: Locator;
  readonly submitError: Locator;

  constructor(page: Page) {
    this.page = page;
    this.successHeading = page.getByRole('heading', { name: 'پیش‌ثبت‌نام با موفقیت انجام شد' });
    this.submitError = page.locator('form').getByRole('alert');
  }

  private field(label: string): Locator {
    return this.page.getByRole('textbox', { name: new RegExp(`^${label}\\s*${REQUIRED_MARK}`) });
  }

  private async choose(label: string, option: string) {
    await this.page.getByRole('combobox', { name: new RegExp(`^${label}\\s*${REQUIRED_MARK}`) }).click();
    await this.page.getByRole('option', { name: option, exact: true }).click();
    // Wait for the list to close, so the next field's list is the only one open
    await expect(this.page.getByRole('listbox')).toHaveCount(0);
  }

  async goto() {
    await this.page.goto('/seller/apply');
    await expect(this.field('نام')).toBeVisible();
  }

  /** Fills both steps and submits */
  async apply(application: SellerApplication) {
    await this.field('نام').fill(application.firstName);
    await this.field('نام خانوادگی').fill(application.lastName);
    await this.field('شماره موبایل').fill(application.phoneNumber);
    await this.field('کد ملی').fill(application.nationalId);
    await this.choose('استان', application.province);
    await this.choose('شهر', application.city);
    await this.page.getByRole('button', { name: 'مرحله بعدی' }).click();

    await expect(this.page.getByRole('heading', { name: 'اطلاعات کسب‌وکار' })).toBeVisible();
    await this.field('آیدی پیج اینستاگرام').fill(application.instagramId);
    await this.choose('فالوئر شما', application.followers);
    await this.choose('نوع فروشگاه', application.category);
    await this.field('درباره فروشگاه شما').fill(application.description);
    await this.page.getByRole('button', { name: 'تایید و پیش‌ثبت‌نام نهایی' }).click();
  }
}
