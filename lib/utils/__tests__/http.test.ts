import { http } from '../http';

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
    expect(global.fetch).toHaveBeenCalledWith('/test-endpoint', expect.objectContaining({
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
});
