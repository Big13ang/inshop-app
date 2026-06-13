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
  http.post('/api/upload/chunk', () => HttpResponse.json({ ok: true })),
];
