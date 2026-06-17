import { http, HttpResponse } from 'msw';

/**
 * API request handlers for MSW.
 *
 * Add route handlers here when you need to mock API calls in tests.
 *
 * Example:
 *   http.post('/api/auth/login', () => {
 *     return HttpResponse.json({ success: true });
 *   }),
 */
export const handlers = [
  http.post('/api/upload/chunk', () =>
    HttpResponse.json({ url: 'https://cdn.test/uploaded.jpg' })
  ),
  http.post('/api/upload/:fileId/finalize', () =>
    HttpResponse.json({ url: 'https://cdn.test/uploaded.jpg' })
  ),
  http.get('/api/upload/:fileId/chunks', () =>
    HttpResponse.json({ received: [] })
  ),
  http.post('/api/posts', () =>
    HttpResponse.json({ id: 'post-123' }, { status: 201 })
  ),
];
