# E2E Tests — Playwright

E2E tests verify the full stack: real Next.js server, real Chromium browser,
real network. They answer "does the whole thing work for the user?"

Do NOT duplicate unit or component test logic here. E2E tests cover:
- Correct page renders after navigation
- Cross-page flows (login → redirect → dashboard)
- Real API integration (not mocked)
- Accessibility in the real browser
- Mobile viewport behaviour

---

## Playwright Config

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,      // fail if test.only committed
  retries: process.env.CI ? 2 : 0,   // retry in CI only
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',          // always capture failure traces
    screenshot: 'only-on-failure',    // evidence for every failure
    video: 'on-first-retry',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile',   use: { ...devices['iPhone 14'] } },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## Page Object Model (POM)

Mandatory. Locators live in the POM — never in test files.
When the UI changes, update the POM in one place, not 20 tests.

```typescript
// e2e/pages/LoginPage.ts
import { type Page, type Locator, expect } from '@playwright/test';

export class LoginPage {
  readonly phoneInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly logo: Locator;

  constructor(readonly page: Page) {
    this.phoneInput    = page.getByRole('textbox');
    this.submitButton  = page.getByRole('button', { name: /دریافت کد تایید/ });
    this.errorMessage  = page.getByRole('alert');
    this.logo          = page.getByRole('img', { name: /لوگو/ });
  }

  async goto() {
    await this.page.goto('/auth/login');
    await expect(this.phoneInput).toBeVisible(); // ready gate — page is loaded
  }

  async fillPhone(phone: string) {
    await this.phoneInput.fill(phone);
  }

  async submit() {
    await this.submitButton.click();
  }

  async fillAndSubmit(phone: string) {
    await this.fillPhone(phone);
    await this.submit();
  }
}
```

```typescript
// e2e/pages/OtpPage.ts
export class OtpPage {
  readonly otpInput: Locator;
  readonly submitButton: Locator;

  constructor(readonly page: Page) {
    this.otpInput     = page.getByRole('textbox');
    this.submitButton = page.getByRole('button', { name: /تایید/ });
  }

  async waitForReady() {
    await expect(this.otpInput).toBeVisible();
  }

  async fillOtp(code: string) {
    await this.otpInput.fill(code);
  }
}
```

---

## Custom Fixtures

Fixtures inject page objects into every test. The fixture navigates
so tests don't repeat `goto()`.

```typescript
// e2e/fixtures/index.ts
import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { OtpPage } from '../pages/OtpPage';

type Fixtures = {
  loginPage: LoginPage;
  otpPage: OtpPage;
};

export const test = base.extend<Fixtures>({
  loginPage: async ({ page }, use) => {
    const lp = new LoginPage(page);
    await lp.goto();
    await use(lp);
  },

  otpPage: async ({ page }, use) => {
    await use(new OtpPage(page));
  },
});

export { expect } from '@playwright/test';
```

---

## Writing E2E Tests

```typescript
// e2e/auth/login.spec.ts
import { test, expect } from '../fixtures';
import { VALID_PHONES, INVALID_PHONES } from '../../features/auth/login/__tests__/fixtures/phones';

test.describe('Login page', () => {
  // ─── Initial render ─────────────────────────────────────────────────────────
  test('renders all key elements on load', async ({ loginPage }) => {
    await expect(loginPage.logo).toBeVisible();
    await expect(loginPage.phoneInput).toBeVisible();
    await expect(loginPage.submitButton).toBeVisible();
  });

  test('submit button is disabled on fresh load', async ({ loginPage }) => {
    await expect(loginPage.submitButton).toBeDisabled();
  });

  // ─── Validation ──────────────────────────────────────────────────────────────
  test('shows error message when invalid phone is entered', async ({ loginPage }) => {
    await loginPage.fillPhone(INVALID_PHONES.tooShort);
    await expect(loginPage.errorMessage).toBeVisible();
  });

  test('sets aria-invalid on invalid phone input', async ({ loginPage }) => {
    await loginPage.fillPhone(INVALID_PHONES.tooShort);
    await expect(loginPage.phoneInput).toHaveAttribute('aria-invalid', 'true');
  });

  test('clears error when phone is corrected', async ({ loginPage }) => {
    await loginPage.fillPhone(INVALID_PHONES.tooShort);
    await expect(loginPage.errorMessage).toBeVisible();

    await loginPage.phoneInput.clear();
    await loginPage.fillPhone(VALID_PHONES.standard);
    await expect(loginPage.errorMessage).not.toBeVisible();
  });

  // ─── Happy path ──────────────────────────────────────────────────────────────
  test('submit button enables when valid phone entered', async ({ loginPage }) => {
    await loginPage.fillPhone(VALID_PHONES.standard);
    await expect(loginPage.submitButton).toBeEnabled();
  });

  test('navigates to OTP page after successful submission', async ({ loginPage, page }) => {
    await loginPage.fillAndSubmit(VALID_PHONES.standard);
    await expect(page).toHaveURL(/\/auth\/otp/);
  });

  // ─── Keyboard ───────────────────────────────────────────────────────────────
  test('can submit form with Enter key', async ({ loginPage, page }) => {
    await loginPage.fillPhone(VALID_PHONES.standard);
    await loginPage.phoneInput.press('Enter');
    await expect(page).toHaveURL(/\/auth\/otp/);
  });

  test('tab moves focus from input to submit button', async ({ loginPage }) => {
    await loginPage.phoneInput.focus();
    await loginPage.page.keyboard.press('Tab');
    await expect(loginPage.submitButton).toBeFocused();
  });

  // ─── Mobile ─────────────────────────────────────────────────────────────────
  test('no horizontal scroll on mobile viewport', async ({ loginPage, page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const scrollWidth  = await page.evaluate(() => document.body.scrollWidth);
    const clientWidth  = await page.evaluate(() => document.body.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });
});
```

---

## Locator Priority (same as RTL)

```typescript
// 1. Role — always prefer
page.getByRole('button', { name: /ارسال/ })
page.getByRole('textbox')
page.getByRole('heading', { name: /ورود/ })

// 2. Label
page.getByLabel('شماره موبایل')

// 3. Text
page.getByText('دریافت کد تایید')

// 4. Test ID — last resort
page.getByTestId('phone-input')

// ❌ Never
page.locator('.submit-btn')
page.locator('//button[@class="btn"]')  // XPath
```

---

## Playwright Assertions — Deterministic Waits

All `expect()` calls in Playwright auto-retry until the condition is met or timeout.
You do not need `waitFor()`.

```typescript
// ✅ These all auto-retry
await expect(loginPage.submitButton).toBeEnabled();
await expect(loginPage.errorMessage).toBeVisible();
await expect(loginPage.phoneInput).toHaveAttribute('aria-invalid', 'true');
await expect(page).toHaveURL('/auth/otp');
await expect(page).toHaveTitle(/ورود به حساب کاربری/);

// ❌ Never
await page.waitForTimeout(1000);
```

---

## File Structure

```
e2e/
  pages/
    LoginPage.ts          ← POM: locators + actions
    OtpPage.ts
    DashboardPage.ts
  fixtures/
    index.ts              ← custom test fixtures
  auth/
    login.spec.ts         ← tests using LoginPage fixture
    otp.spec.ts

playwright.config.ts
```

---

## Running Tests

```bash
# Run all E2E tests
npx playwright test

# Run specific file
npx playwright test e2e/auth/login.spec.ts

# Debug interactively
npx playwright test e2e/auth/login.spec.ts --debug

# Open trace viewer after failure
npx playwright show-report
```

---

## E2E Coverage Checklist

For any page or flow:
```
[ ] Page loads — all key elements visible
[ ] Happy path — complete user flow succeeds
[ ] Negative path — invalid input is rejected with error
[ ] Recovery path — user can fix errors and proceed
[ ] Keyboard navigation — Tab order, Enter key
[ ] aria-* attributes correct in each state
[ ] Mobile viewport — no horizontal overflow
[ ] URL is correct after navigation / submission
[ ] Loading state shown during async actions
```
