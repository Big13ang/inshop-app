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
// In-memory offset tracking so HEAD (resume) and PATCH (chunk) stay consistent
// for the lifetime of an upload id within a test.
const uploads = new Map<string, { offset: number; length: number }>();

export const handlers = [
  // tus protocol — creation (POST) returns the upload URL via Location.
  http.post('/api/upload', ({ request }) => {
    const id = `mock-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const length = Number(request.headers.get('upload-length') ?? '0');
    uploads.set(id, { offset: 0, length });
    return new HttpResponse(null, {
      status: 201,
      headers: { Location: `/api/upload/${id}`, 'Tus-Resumable': '1.0.0' },
    });
  }),
  // tus protocol — resume support: report the offset recorded so far.
  http.head('/api/upload/:id', ({ params }) => {
    const upload = uploads.get(String(params.id));
    if (!upload) return new HttpResponse(null, { status: 404 });
    return new HttpResponse(null, {
      status: 200,
      headers: {
        'Upload-Offset': String(upload.offset),
        'Upload-Length': String(upload.length),
        'Tus-Resumable': '1.0.0',
      },
    });
  }),
  // tus protocol — each chunk PATCH echoes back the new Upload-Offset.
  http.patch('/api/upload/:id', async ({ params, request }) => {
    const id = String(params.id);
    const upload = uploads.get(id);
    const startOffset = upload?.offset ?? Number(request.headers.get('upload-offset') ?? '0');
    const body = await request.arrayBuffer();
    const offset = startOffset + body.byteLength;
    if (upload) upload.offset = offset;
    return new HttpResponse(null, {
      status: 204,
      headers: { 'Upload-Offset': String(offset), 'Tus-Resumable': '1.0.0' },
    });
  }),
  http.post('/api/posts', () =>
    HttpResponse.json({ id: 'post-123' }, { status: 201 })
  ),
];
