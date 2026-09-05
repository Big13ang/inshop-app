import { isClientNavigation } from '../serverNavigation';
import { headers } from 'next/headers';

jest.mock('next/headers', () => ({
  headers: jest.fn(),
}));

describe('isClientNavigation util', () => {
  it('returns true when rsc header is 1', async () => {
    (headers as jest.Mock).mockResolvedValue({
      get: (headerName: string) => (headerName.toLowerCase() === 'rsc' ? '1' : null),
    });

    const result = await isClientNavigation();
    expect(result).toBe(true);
  });

  it('returns false when rsc header is missing or not 1', async () => {
    (headers as jest.Mock).mockResolvedValue({
      get: () => null,
    });

    const result = await isClientNavigation();
    expect(result).toBe(false);
  });
});
