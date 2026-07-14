import { http, HttpResponse } from 'msw';
import { createPendingPostsFixture } from './fixtures';

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

// Mutable so DELETE can remove an entry and a subsequent GET reflects it,
// matching the real dev route's behavior against its own in-module store.
let posts = createPendingPostsFixture();

// Tests within the same file share this module instance; call between tests
// so a DELETE in one test doesn't leak into the next.
export function resetPendingPostsFixture() {
  posts = createPendingPostsFixture();
}

export const handlers = [
  http.get('/api/posts', () => HttpResponse.json(posts)),
  http.delete('/api/posts/:id', ({ params }) => {
    const index = posts.findIndex((post) => post.id === params.id);
    if (index === -1) {
      return HttpResponse.json({ error: 'not-found' }, { status: 404 });
    }
    posts = posts.filter((post) => post.id !== params.id);
    return HttpResponse.json({ id: params.id });
  }),
  // 1. Session creation
  http.post('http://localhost:3000/upload-sessions', () => {
    return HttpResponse.json({
      success: true,
      data: {
        uploadSessionId: 'mock-session-123',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      }
    });
  }),
  http.post('/api/upload-sessions', () => {
    return HttpResponse.json({
      success: true,
      data: {
        uploadSessionId: 'mock-session-123',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      }
    });
  }),

  // 2. TUS protocol — creation (POST)
  http.post('http://localhost:3000/uploads', ({ request }) => {
    const id = `mock-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const length = Number(request.headers.get('upload-length') ?? '0');
    uploads.set(id, { offset: 0, length });
    return new HttpResponse(null, {
      status: 201,
      headers: { Location: `http://localhost:3000/uploads/${id}`, 'Tus-Resumable': '1.0.0' },
    });
  }),
  http.post('/api/uploads', ({ request }) => {
    const id = `mock-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const length = Number(request.headers.get('upload-length') ?? '0');
    uploads.set(id, { offset: 0, length });
    return new HttpResponse(null, {
      status: 201,
      headers: { Location: `/api/uploads/${id}`, 'Tus-Resumable': '1.0.0' },
    });
  }),

  // 3. TUS protocol — resume support (HEAD)
  http.head('http://localhost:3000/uploads/:id', ({ params }) => {
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
  http.head('/api/uploads/:id', ({ params }) => {
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

  // 4. TUS protocol — chunk PATCH
  http.patch('http://localhost:3000/uploads/:id', async ({ params, request }) => {
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
  http.patch('/api/uploads/:id', async ({ params, request }) => {
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

  // 5. Delete photo from session
  http.delete('http://localhost:3000/upload-sessions/:sessionId/photos/:mediaId', () => {
    return HttpResponse.json({ success: true });
  }),
  http.delete('/api/upload-sessions/:sessionId/photos/:mediaId', () => {
    return HttpResponse.json({ success: true });
  }),

  // 6. Reorder photos
  http.patch('http://localhost:3000/upload-sessions/:sessionId/photos/order', () => {
    return HttpResponse.json({ success: true });
  }),
  http.patch('/api/upload-sessions/:sessionId/photos/order', () => {
    return HttpResponse.json({ success: true });
  }),

  // 7. Publish upload-session
  http.post('http://localhost:3000/upload-sessions/publish', async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const id = `post-${crypto.randomUUID()}`;
    posts = [
      {
        id,
        title: 'پست جدید',
        sellerName: 'گالری طلای مدرن',
        sellerAvatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=500&q=80',
        isVerified: true,
        caption: (body.description as string) ?? '',
        mediaUrls: Array.isArray(body.mediaIds)
          ? (body.mediaIds as string[]).map((mid) => `http://localhost:3000/uploads/${mid}`)
          : [],
        submittedAt: new Date().toISOString(),
        status: 'pending',
      },
      ...posts,
    ];
    return HttpResponse.json({ success: true, data: { postId: id } }, { status: 201 });
  }),
  http.post('/api/upload-sessions/publish', async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const id = `post-${crypto.randomUUID()}`;
    posts = [
      {
        id,
        title: 'پست جدید',
        sellerName: 'گالری طلای مدرن',
        sellerAvatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=500&q=80',
        isVerified: true,
        caption: (body.description as string) ?? '',
        mediaUrls: Array.isArray(body.mediaIds)
          ? (body.mediaIds as string[]).map((mid) => `/api/uploads/${mid}`)
          : [],
        submittedAt: new Date().toISOString(),
        status: 'pending',
      },
      ...posts,
    ];
    return HttpResponse.json({ success: true, data: { postId: id } }, { status: 201 });
  }),

  // Legacy publish endpoint (retained for backward compatibility if other code references it)
  http.post('/api/posts', async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const id = `post-${crypto.randomUUID()}`;
    posts = [
      {
        id,
        title: (body.title as string) ?? 'پست جدید',
        sellerName: 'گالری طلای مدرن',
        sellerAvatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=500&q=80',
        isVerified: true,
        caption: (body.caption as string) ?? '',
        mediaUrls: Array.isArray(body.mediaUrls) ? (body.mediaUrls as string[]) : [],
        submittedAt: new Date().toISOString(),
        status: 'pending',
      },
      ...posts,
    ];
    return HttpResponse.json({ id }, { status: 201 });
  }),
  http.post('http://localhost:3000/api/auth/phone-number/send-otp', async ({ request }) => {
    const { phoneNumber } = (await request.json()) as { phoneNumber: string };
    if (phoneNumber === '09000000000') {
      return HttpResponse.json(
        { message: 'شماره تلفن همراه وارد شده نامعتبر است.' },
        { status: 400 }
      );
    }
    return HttpResponse.json({
      message: 'کد تایید ارسال شد',
    });
  }),
  http.post('http://localhost:3000/api/auth/phone-number/verify', async ({ request }) => {
    const { code, phoneNumber } = (await request.json()) as { code: string; phoneNumber: string };
    if (code === '0000') {
      return HttpResponse.json(
        { message: 'کد وارد شده نامعتبر است.' },
        { status: 400 }
      );
    }
    return HttpResponse.json({
      user: {
        id: 'user-1',
        phoneNumber,
      },
      session: {
        id: 'session-1',
      },
    });
  }),
];
