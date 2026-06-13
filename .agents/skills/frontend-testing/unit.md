# Unit Tests — Jest

Unit tests target **pure logic**: schemas, validators, transformers, utilities.
No DOM. No network. No React. Just functions in, values out.

---

## Setup Checklist

```typescript
// jest.config.js — minimal config for Next.js + TypeScript
module.exports = {
  testEnvironment: 'node',          // for pure logic — no DOM overhead
  transform: { '^.+\\.tsx?$': ['ts-jest', {}] },
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/$1' },
};
```

Use `testEnvironment: 'jsdom'` only when the test imports DOM code.
For schemas and utils, `node` environment is faster.

---

## Anatomy of a Good Unit Test

```typescript
// features/auth/login/__tests__/loginSchema.test.ts

import { loginSchema } from '../loginSchema';
import { VALID_PHONE_LIST, INVALID_PHONE_LIST } from './fixtures/phones';

// Helper: run the schema and return the error message or null
const validate = (phone: string) => {
  const result = loginSchema.safeParse({ phone });
  if (result.success) return null;
  return result.error.issues[0]?.message ?? null;
};

const isValid = (phone: string) => validate(phone) === null;

// ─── Group 1: valid inputs ────────────────────────────────────────────────────
describe('loginSchema — accepts valid phone numbers', () => {
  it.each(VALID_PHONE_LIST)('accepts "$label" → "$phone"', ({ phone }) => {
    expect(isValid(phone)).toBe(true);
  });
});

// ─── Group 2: invalid inputs ──────────────────────────────────────────────────
describe('loginSchema — rejects invalid phone numbers', () => {
  it.each(INVALID_PHONE_LIST)('rejects "$label" → "$phone"', ({ phone }) => {
    expect(isValid(phone)).toBe(false);
  });
});

// ─── Group 3: error message quality ──────────────────────────────────────────
describe('loginSchema — error messages', () => {
  it('returns Persian text for an invalid phone number', () => {
    const msg = validate('12345')!;
    // Persian Unicode range: U+0600–U+06FF
    expect(/[؀-ۿ]/.test(msg)).toBe(true);
  });

  it('returns a specific error for empty input', () => {
    const msg = validate('')!;
    expect(msg).toBeTruthy();
    expect(msg.length).toBeGreaterThan(0);
  });

  it('returns a specific error for whitespace-only input', () => {
    expect(isValid('   ')).toBe(false);
  });
});
```

---

## `it.each` — Parametrised Tests

Never write the same test 10 times with different data. Use `it.each`.

```typescript
// Table syntax — column headers become variable names
it.each([
  ['09171234567', true],
  ['09001234567', false],
  ['0917123456',  false],  // too short
  ['091712345678',false],  // too long
  ['',            false],
])('validates "%s" → %s', (phone, expected) => {
  expect(isValid(phone)).toBe(expected);
});

// Object syntax — more readable for complex cases
it.each([
  { label: 'standard',     phone: '09171234567', valid: true  },
  { label: 'too short',    phone: '0917123',     valid: false },
  { label: 'letters',      phone: 'abcdefghijk', valid: false },
])('$label: "$phone" → valid=$valid', ({ phone, valid }) => {
  expect(isValid(phone)).toBe(valid);
});
```

---

## Boundary Value Analysis

For any length/range validation, always test these boundaries:

```
[ ] Valid minimum          (e.g., exactly 11 chars for a phone)
[ ] Valid maximum          (if there is one)
[ ] One below minimum      (10 chars — should fail)
[ ] One above maximum      (12 chars — should fail)
[ ] Zero / empty string    ('')
[ ] Whitespace-only        ('   ')
[ ] Null / undefined       (if the schema accepts it)
[ ] Special characters     ('#$%', 'اعداد', '١٢٣')  ← Persian numerals
[ ] Leading/trailing space (' 09171234567 ')
```

```typescript
describe('loginSchema — boundary values', () => {
  const VALID_MIN = '09171234567';    // 11 chars

  it('accepts exactly 11 digit phone', () => expect(isValid(VALID_MIN)).toBe(true));
  it('rejects 10 digit phone',         () => expect(isValid('0917123456')).toBe(false));
  it('rejects 12 digit phone',         () => expect(isValid('091712345678')).toBe(false));
  it('rejects empty string',           () => expect(isValid('')).toBe(false));
  it('rejects whitespace-only',        () => expect(isValid('   ')).toBe(false));
  it('rejects Arabic numerals',        () => expect(isValid('٠٩١٧١٢٣٤٥٦٧')).toBe(false));
});
```

---

## Pure Transformer Functions

```typescript
// utils/formatPhone.ts
export function formatPhone(raw: string): string {
  return raw.replace(/\D/g, '').replace(/^98/, '0');
}

// __tests__/formatPhone.test.ts
import { formatPhone } from '../utils/formatPhone';

describe('formatPhone', () => {
  it.each([
    { input: '+989171234567', output: '09171234567' },
    { input: '989171234567',  output: '09171234567' },
    { input: '09171234567',   output: '09171234567' },
    { input: '9171234567',    output: '09171234567' },
  ])('normalises "$input" to "$output"', ({ input, output }) => {
    expect(formatPhone(input)).toBe(output);
  });

  it('returns empty string for empty input', () => {
    expect(formatPhone('')).toBe('');
  });
});
```

---

## Testing Error Objects

Test the exact error message text — "an error exists" is not enough.

```typescript
describe('checkout — error messages', () => {
  it('throws with descriptive message when cart is empty', async () => {
    await expect(checkout([])).rejects.toThrow('سبد خرید خالی است');
  });

  it('throws with descriptive message when payment method is missing', async () => {
    await expect(checkout(cart, null)).rejects.toThrow('روش پرداخت انتخاب نشده');
  });
});
```

---

## Fake Timers

Use fake timers for any code that depends on `Date.now()`, `setTimeout`, or `setInterval`.

```typescript
describe('OTP expiry', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('marks OTP as expired after 2 minutes', () => {
    const otp = createOTP();
    expect(otp.isExpired()).toBe(false);

    jest.advanceTimersByTime(2 * 60 * 1000 + 1);
    expect(otp.isExpired()).toBe(true);
  });

  it('does not expire at exactly 2 minutes', () => {
    const otp = createOTP();
    jest.advanceTimersByTime(2 * 60 * 1000);
    expect(otp.isExpired()).toBe(false);
  });
});
```

---

## File Structure for Unit Tests

```
features/
  auth/
    login/
      __tests__/
        loginSchema.test.ts    ← unit: schema validation
        fixtures/
          phones.ts            ← shared test data
      loginSchema.ts           ← source
```

Unit tests live next to the source they test.
Fixtures live one level deeper so they're importable by other layers too.
