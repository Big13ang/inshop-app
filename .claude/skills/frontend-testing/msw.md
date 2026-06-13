# Mock Service Worker (MSW v2)

MSW intercepts HTTP requests at the network level — not at module level.
This means your component runs exactly as it would in production, but with
controlled responses. No `jest.mock('../api/auth')`. No fakes threading
through layers. Just real code hitting fake HTTP.

---

## Installation

```bash
npm install -D msw
npx msw init public/ --save  # for browser usage (Storybook, dev server)
```

MSW v2 requires Node 18+. Use `import { http, HttpResponse } from 'msw'`.

---

## File Structure

```
src/
  mocks/
    handlers/
      auth.ts          ← handlers for /api/auth/*
      products.ts      ← handlers for /api/products/*
      index.ts         ← re-exports all handlers
    server.ts          ← Node test server (Jest)
    browser.ts         ← Browser service worker (Storybook / dev)
```

---

## Defining Handlers

```typescript
// src/mocks/handlers/auth.ts
import { http, HttpResponse, delay } from 'msw';

export const authHandlers = [
  // POST /api/auth/otp — success
  http.post('/api/auth/otp', async ({ request }) => {
    const body = await request.json() as { phone: string };
    return HttpResponse.json({ success: true, expiresIn: 120 });
  }),

  // POST /api/auth/verify — success
  http.post('/api/auth/verify', async ({ request }) => {
    const body = await request.json() as { phone: string; otp: string };
    return HttpResponse.json({
      token: 'mock-jwt-token',
      user: { id: '1', phone: body.phone },
    });
  }),

  // GET /api/user/me — authenticated user
  http.get('/api/user/me', () => {
    return HttpResponse.json({ id: '1', phone: '09171234567', name: 'کاربر' });
  }),
];
```

```typescript
// src/mocks/handlers/index.ts
import { authHandlers } from './auth';
import { productHandlers } from './products';

export const handlers = [...authHandlers, ...productHandlers];
```

---

## Node Server (for Jest)

```typescript
// src/mocks/server.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

```typescript
// jest.setup.ts
import { server } from './src/mocks/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());  // ← reset per-test overrides
afterAll(() => server.close());
```

`onUnhandledRequest: 'error'` fails tests when a request has no handler —
catches missing handlers early rather than silently returning `undefined`.

---

## Overriding Handlers Per Test

The base handlers cover the happy path. Override in specific tests for errors,
loading states, and edge cases.

```typescript
import { http, HttpResponse } from 'msw';
import { server } from '../../../mocks/server';

describe('Login — API error handling', () => {
  it('shows error message when OTP request fails', async () => {
    // Override for this test only — reset in afterEach
    server.use(
      http.post('/api/auth/otp', () => {
        return HttpResponse.json(
          { error: 'سرویس موقتاً در دسترس نیست' },
          { status: 503 }
        );
      })
    );

    const { user } = setup();
    await user.type(screen.getByRole('textbox'), '09171234567');
    await user.click(screen.getByRole('button', { name: /دریافت کد تایید/ }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/سرویس موقتاً/);
    });
  });

  it('shows network error when request fails entirely', async () => {
    server.use(
      http.post('/api/auth/otp', () => {
        return HttpResponse.error(); // network failure
      })
    );

    const { user } = setup();
    await user.type(screen.getByRole('textbox'), '09171234567');
    await user.click(screen.getByRole('button', { name: /دریافت کد تایید/ }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });
});
```

---

## Simulating Loading State

```typescript
import { delay } from 'msw';

server.use(
  http.post('/api/auth/otp', async () => {
    await delay(200); // simulate network latency
    return HttpResponse.json({ success: true });
  })
);

it('shows loading indicator while OTP is being sent', async () => {
  const { user } = setup();
  await user.type(screen.getByRole('textbox'), '09171234567');
  await user.click(screen.getByRole('button', { name: /دریافت کد تایید/ }));

  // Immediately after click — loading state
  expect(screen.getByRole('button', { name: /در حال ارسال/ })).toBeInTheDocument();

  // After the delayed response resolves
  await waitFor(() => {
    expect(screen.queryByRole('button', { name: /در حال ارسال/ })).not.toBeInTheDocument();
  });
});
```

---

## Request Inspection

Verify the request body sent to the API:

```typescript
it('sends the phone number in the request body', async () => {
  let capturedBody: unknown;

  server.use(
    http.post('/api/auth/otp', async ({ request }) => {
      capturedBody = await request.json();
      return HttpResponse.json({ success: true });
    })
  );

  const { user } = setup();
  await user.type(screen.getByRole('textbox'), '09171234567');
  await user.click(screen.getByRole('button', { name: /دریافت کد تایید/ }));

  await waitFor(() => {
    expect(capturedBody).toEqual({ phone: '09171234567' });
  });
});
```

---

## Response Helpers

```typescript
// 200 OK with JSON
HttpResponse.json({ success: true })

// 200 OK with delay
await delay(150);
HttpResponse.json({ data: [] })

// 4xx client error
HttpResponse.json({ error: 'Unauthorized' }, { status: 401 })

// 5xx server error
HttpResponse.json({ error: 'Internal error' }, { status: 500 })

// Network failure (no response at all)
HttpResponse.error()

// Empty 204 No Content
new HttpResponse(null, { status: 204 })

// Paginated response
HttpResponse.json({ items: [...], total: 100, page: 1 })
```

---

## Common Mistakes

| Mistake | Fix |
|---|---|
| `jest.mock('../api/auth')` | Use MSW — tests your real API layer |
| Missing `server.resetHandlers()` | Overrides bleed across tests |
| `onUnhandledRequest: 'warn'` | Misses uncaught requests silently |
| Mocking `fetch` directly | MSW intercepts at a higher level |
| One giant `handlers/index.ts` | Split by domain (`auth.ts`, `products.ts`) |
| Not testing error paths | Add at least one 4xx and one 5xx test per endpoint |
