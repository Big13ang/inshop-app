import { FetchHttpStack, FetchRequest } from '../services/chunkStrategy';

// ── FetchRequest/FetchHttpStack ──────────────────────────────────────────────
//
// chunkStrategy.test.ts mocks tus-js-client entirely, so it never exercises
// this module's actual fetch-based httpStack — in particular the duck-typed
// Blob → ArrayBuffer conversion in FetchRequest.send(), which exists because
// MSW's fetch interceptor (used under jsdom) mishandles Blob bodies. These
// tests target that class directly, with only global.fetch mocked, so a
// regression here fails with a clear, local signal instead of a confusing
// timeout deep inside an integration test.

describe('FetchRequest.send', () => {
  const okResponse = () =>
    Promise.resolve(
      new Response('ok-body', { status: 200, headers: { 'Upload-Offset': '10' } }),
    );

  beforeEach(() => {
    global.fetch = jest.fn(okResponse) as jest.Mock;
  });

  it('converts a Blob body to an ArrayBuffer before calling fetch', async () => {
    const blob = new Blob([new Uint8Array([1, 2, 3, 4])]);
    const request = new FetchRequest('PATCH', '/api/upload/abc');

    await request.send(blob);

    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(init.body).not.toBeInstanceOf(Blob);
    expect(typeof init.body.byteLength).toBe('number');
    expect(init.body.byteLength).toBe(4);
  });

  it('passes a non-Blob body through unchanged', async () => {
    const request = new FetchRequest('PATCH', '/api/upload/abc');

    await request.send('raw-string-body');

    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(init.body).toBe('raw-string-body');
  });

  it('sends no body when none is given (e.g. HEAD requests)', async () => {
    const request = new FetchRequest('HEAD', '/api/upload/abc');

    await request.send();

    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(init.body).toBeUndefined();
  });

  it('sends the configured method, url, and headers', async () => {
    const request = new FetchRequest('POST', '/api/upload');
    request.setHeader('Upload-Length', '100');

    await request.send();

    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe('/api/upload');
    expect(init.method).toBe('POST');
    expect(init.headers).toEqual({ 'Upload-Length': '100' });
    expect(init.credentials).toBe('include');
  });

  it('wraps the fetch Response in a FetchResponse exposing status/header/body/underlyingObject', async () => {
    const request = new FetchRequest('PATCH', '/api/upload/abc');

    const response = await request.send();

    expect(response.getStatus()).toBe(200);
    expect(response.getHeader('Upload-Offset')).toBe('10');
    expect(response.getBody()).toBe('ok-body');
    expect(response.getUnderlyingObject()).toBeInstanceOf(Response);
  });

  it('exposes set headers via getHeader', () => {
    const request = new FetchRequest('POST', '/api/upload');
    request.setHeader('Upload-Length', '100');
    expect(request.getHeader('Upload-Length')).toBe('100');
    expect(request.getHeader('Non-Existent')).toBeUndefined();
  });

  it('returns itself as the underlying object', () => {
    const request = new FetchRequest('POST', '/api/upload');
    expect(request.getUnderlyingObject()).toBe(request);
  });

  it('aborts the in-flight request via the AbortController signal', async () => {
    const request = new FetchRequest('PATCH', '/api/upload/abc');

    const sendPromise = request.send();
    await request.abort();

    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(init.signal.aborted).toBe(true);
    await sendPromise;
  });
});

describe('FetchHttpStack', () => {
  it('creates FetchRequest instances for the given method and url', () => {
    const stack = new FetchHttpStack();

    const request = stack.createRequest('PATCH', '/api/upload/abc');

    expect(request).toBeInstanceOf(FetchRequest);
    expect(request.getMethod()).toBe('PATCH');
    expect(request.getURL()).toBe('/api/upload/abc');
  });

  it('exposes a stack name', () => {
    expect(new FetchHttpStack().getName()).toBe('FetchHttpStack');
  });
});
