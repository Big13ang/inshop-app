# Shared Test Fixtures — Single Source of Truth

Test data must never be hardcoded in test files, and must never diverge between
unit, component, and E2E layers. Define it once, import everywhere.

---

## The Problem Without Fixtures

```typescript
// loginSchema.test.ts — hardcoded
expect(isValid('09171234567')).toBe(true);

// Login.test.tsx — different hardcoded value
await user.type(input, '0917-123-4567');  // different format — subtle divergence

// login.spec.ts — yet another one
await loginPage.fillPhone('+989171234567'); // international format
```

These three tests might pass, but they don't cover the same thing.
When the schema changes, you find the bug only in one layer.

---

## The Solution — Fixtures File

```
features/
  auth/
    login/
      __tests__/
        fixtures/
          phones.ts    ← single source of truth
        loginSchema.test.ts   ← imports from fixtures
        Login.test.tsx        ← imports from fixtures
      Login.tsx

e2e/
  auth/
    login.spec.ts             ← imports from features/.../fixtures
```

---

## Phone Fixtures Example

```typescript
// features/auth/login/__tests__/fixtures/phones.ts

// Named objects — use for specific, semantic access
export const VALID_PHONES = {
  standard:            '09171234567',  // typical 09xx format
  withoutLeadingZero:  '9171234567',   // 10-digit without leading 0
  internationalPlus:   '+989171234567',
  international98:     '989171234567',
} as const;

export const INVALID_PHONES = {
  tooShort:            '0917123',
  tooLong:             '091712345678',
  letters:             'abcdefghijk',
  persianDigits:       '۰۹۱۷۱۲۳۴۵۶۷',  // Arabic-Indic numerals
  whitespaceOnly:      '   ',
  empty:               '',
  specialChars:        '#$%^&*!@()',
  withHyphens:         '0917-123-4567',
} as const;

// Flat arrays for `it.each` — include label for test names
export const VALID_PHONE_LIST = Object.entries(VALID_PHONES)
  .map(([label, phone]) => ({ label, phone }));

export const INVALID_PHONE_LIST = Object.entries(INVALID_PHONES)
  .map(([label, phone]) => ({ label, phone }));

// Type-safe access
export type ValidPhone = typeof VALID_PHONES[keyof typeof VALID_PHONES];
export type InvalidPhone = typeof INVALID_PHONES[keyof typeof INVALID_PHONES];
```

---

## Using Fixtures Across Layers

### Unit test
```typescript
// loginSchema.test.ts
import { VALID_PHONE_LIST, INVALID_PHONE_LIST } from './fixtures/phones';

it.each(VALID_PHONE_LIST)('accepts "$label" → "$phone"', ({ phone }) => {
  expect(isValid(phone)).toBe(true);
});

it.each(INVALID_PHONE_LIST)('rejects "$label" → "$phone"', ({ phone }) => {
  expect(isValid(phone)).toBe(false);
});
```

### Component test
```typescript
// Login.test.tsx
import { VALID_PHONES, INVALID_PHONES } from './fixtures/phones';

it('submit button enables when valid phone entered', async () => {
  const { user } = setup();
  await user.type(screen.getByRole('textbox'), VALID_PHONES.standard);
  await waitFor(() => expect(submitBtn()).not.toBeDisabled());
});

it('shows error for too-short phone', async () => {
  const { user } = setup();
  await user.type(screen.getByRole('textbox'), INVALID_PHONES.tooShort);
  await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
});
```

### E2E test
```typescript
// e2e/auth/login.spec.ts
import { VALID_PHONES, INVALID_PHONES } from '../../features/auth/login/__tests__/fixtures/phones';

test('shows error for invalid phone', async ({ loginPage }) => {
  await loginPage.fillPhone(INVALID_PHONES.tooShort);
  await expect(loginPage.errorMessage).toBeVisible();
});

test('navigates to OTP page after valid phone submit', async ({ loginPage, page }) => {
  await loginPage.fillAndSubmit(VALID_PHONES.standard);
  await expect(page).toHaveURL(/\/auth\/otp/);
});
```

---

## More Fixture Patterns

### API response fixtures

```typescript
// features/auth/__tests__/fixtures/api.ts
export const OTP_SUCCESS_RESPONSE = {
  success: true,
  expiresIn: 120,
} as const;

export const OTP_ERROR_RESPONSES = {
  serverError:   { error: 'سرویس موقتاً در دسترس نیست', status: 503 },
  tooManyRequests: { error: 'تعداد درخواست‌ها بیش از حد مجاز است', status: 429 },
  invalidPhone:  { error: 'شماره تلفن نامعتبر است', status: 400 },
} as const;
```

```typescript
// In MSW handler overrides
import { OTP_ERROR_RESPONSES } from '../fixtures/api';

server.use(
  http.post('/api/auth/otp', () =>
    HttpResponse.json(
      { error: OTP_ERROR_RESPONSES.serverError.error },
      { status: OTP_ERROR_RESPONSES.serverError.status }
    )
  )
);
```

### User fixtures

```typescript
// features/user/__tests__/fixtures/users.ts
export const USERS = {
  authenticated: {
    id: 'user-1',
    phone: '09171234567',
    name: 'کاربر تست',
    token: 'mock-jwt-token',
  },
  unauthenticated: null,
} as const;
```

---

## Rules

1. **If a value appears in more than one test, it goes in a fixture.**
2. **Fixture files live with the feature** (`__tests__/fixtures/`) — not in a shared root.
3. **E2E tests import from feature fixtures** — do not duplicate them in `e2e/fixtures/`.
4. **Use `as const`** to get precise literal types instead of `string`.
5. **Include a `label` in `it.each` arrays** so test names are human-readable.
6. **Name fixtures semantically** (`VALID_PHONES.standard`) not positionally (`PHONES[0]`).
