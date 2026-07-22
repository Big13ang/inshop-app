import { http, navigation } from '../http';
import { env } from '@/env';

describe('http.request', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it('successfully parses JSON response body and returns a success Result', async () => {
    const mockData = { id: 1, name: 'Test' };
    const mockResponse = new Response(JSON.stringify(mockData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
    
    jest.spyOn(global, 'fetch').mockResolvedValue(mockResponse);

    const result = await http.request('/test-endpoint');

    expect(result).toEqual({ ok: true, value: mockData });
    expect(global.fetch).toHaveBeenCalledWith(`${env.NEXT_PUBLIC_API_URL}/test-endpoint`, expect.objectContaining({
      credentials: 'include',
    }));
  });

  it('handles non-2xx response error envelope parsing', async () => {
    const mockErrorPayload = {
      success: false,
      error: {
        code: 'BAD_REQUEST',
        message: 'Upload session has expired.',
      },
    };
    const mockResponse = new Response(JSON.stringify(mockErrorPayload), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
    
    jest.spyOn(global, 'fetch').mockResolvedValue(mockResponse);

    const result = await http.request('/error-endpoint');

    expect(result).toEqual({
      ok: false,
      error: {
        status: 400,
        code: 'BAD_REQUEST',
        message: 'Upload session has expired.',
        raw: mockErrorPayload,
      },
    });
  });

  it('handles network errors gracefully and returns an error Result', async () => {
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('Failed to fetch'));

    const result = await http.request('/failed-endpoint');

    expect(result).toEqual({
      ok: false,
      error: {
        message: 'Failed to fetch',
        raw: expect.any(Error),
      },
    });
  });

  it('automatically unwraps standard ApiResponse data envelope', async () => {
    const wrappedData = {
      success: true,
      message: 'Done',
      data: { id: 1, name: 'Test' },
      meta: { currentDateTime: '2026-06-29T10:55:54.956Z' },
    };
    const mockResponse = new Response(JSON.stringify(wrappedData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
    
    jest.spyOn(global, 'fetch').mockResolvedValue(mockResponse);

    const result = await http.request('/wrapped-endpoint');

    expect(result).toEqual({ ok: true, value: { id: 1, name: 'Test' } });
  });

  it('automatically unwraps and preserves pagination structure for PaginatedApiResponse', async () => {
    const wrappedData = {
      success: true,
      data: [{ id: 1 }],
      pagination: { nextCursor: 'abc', hasNext: true },
    };
    const mockResponse = new Response(JSON.stringify(wrappedData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
    
    jest.spyOn(global, 'fetch').mockResolvedValue(mockResponse);

    const result = await http.request('/paginated-endpoint');

    expect(result).toEqual({
      ok: true,
      value: {
        data: [{ id: 1 }],
        pagination: { nextCursor: 'abc', hasNext: true },
      },
    });
  });

  it('returns failure Result when success is false in ApiResponse body', async () => {
    const wrappedData = {
      success: false,
      message: 'لطفا وارد حساب کاربری خود شوید',
      data: [],
    };
    const mockResponse = new Response(JSON.stringify(wrappedData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
    
    jest.spyOn(global, 'fetch').mockResolvedValue(mockResponse);

    const result = await http.request('/error-success-false');

    expect(result).toEqual({
      ok: false,
      error: {
        status: 200,
        message: 'لطفا وارد حساب کاربری خود شوید',
        raw: wrappedData,
      },
    });
  });

  describe('interceptors & 401 redirect', () => {
    let redirectSpy: jest.SpyInstance;

    beforeEach(() => {
      redirectSpy = jest.spyOn(navigation, 'redirect').mockImplementation(() => {});
    });

    it('redirects user to /auth/login when response status is 401', async () => {
      const mockResponse = new Response(JSON.stringify({ message: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
      jest.spyOn(global, 'fetch').mockResolvedValue(mockResponse);

      const result = await http.request('/protected-endpoint');

      expect(result.ok).toBe(false);
      expect(redirectSpy).toHaveBeenCalledWith('/auth/login');
    });

    it('allows registering and unregistering custom request and response interceptors', async () => {
      const requestFn = jest.fn();
      const responseFn = jest.fn();

      const unregisterReq = http.interceptors.request.use(requestFn);
      const unregisterRes = http.interceptors.response.use(responseFn);

      const mockResponse = new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
      jest.spyOn(global, 'fetch').mockResolvedValue(mockResponse);

      await http.request('/custom-interceptor-test');

      expect(requestFn).toHaveBeenCalledTimes(1);
      expect(responseFn).toHaveBeenCalledTimes(1);

      unregisterReq();
      unregisterRes();

      await http.request('/custom-interceptor-test-2');

      expect(requestFn).toHaveBeenCalledTimes(1);
      expect(responseFn).toHaveBeenCalledTimes(1);
    });
  });
});



