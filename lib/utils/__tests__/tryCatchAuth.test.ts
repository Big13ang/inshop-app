import { tryCatchAuth } from '../tryCatchAuth';
import { toast } from 'sonner';

jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
  },
}));

describe('tryCatchAuth utility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns data and error=null on successful promise resolution without API errors', async () => {
    const successResponse = { data: { message: 'Success!' }, error: null };
    const promise = Promise.resolve(successResponse);

    const result = await tryCatchAuth(promise, 'Fallback error');

    expect(result).toEqual({ data: successResponse, error: null });
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('toasts and returns error when promise resolves but has structured API error', async () => {
    const errorResponse = { data: null, error: { message: 'API verification error' } };
    const promise = Promise.resolve(errorResponse);

    const result = await tryCatchAuth(promise, 'Fallback error');

    expect(result).toEqual({ data: null, error: { message: 'API verification error' } });
    expect(toast.error).toHaveBeenCalledWith('API verification error');
  });

  it('toasts fallback message when promise resolves with empty API error message', async () => {
    const errorResponse = { data: null, error: {} };
    const promise = Promise.resolve(errorResponse);

    const result = await tryCatchAuth(promise, 'Fallback error');

    expect(result).toEqual({ data: null, error: {} });
    expect(toast.error).toHaveBeenCalledWith('Fallback error');
  });

  it('toasts and returns error on promise rejection (network error)', async () => {
    const networkError = new Error('DNS failure');
    const promise = Promise.reject(networkError);

    const result = await tryCatchAuth(promise, 'Fallback error');

    expect(result).toEqual({ data: null, error: networkError });
    expect(toast.error).toHaveBeenCalledWith('DNS failure');
  });
});
