import { http } from '@/lib/utils';
import { fetchSearchResults, getNextSearchPageParam, useSearchQuery } from '../searchService';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

jest.mock('@/lib/utils', () => ({
  ...jest.requireActual('@/lib/utils'),
  http: {
    get: jest.fn(),
  },
}));

describe('searchService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchSearchResults - Minimum 3 characters threshold', () => {
    it('returns empty results immediately and does NOT call http.get when query has fewer than 3 characters', async () => {
      const shortQueries = ['', ' ', '  ', 'a', 'ab', 'ک', 'کف', '  ab  '];

      for (const query of shortQueries) {
        const result = await fetchSearchResults(query);

        expect(result).toEqual({
          profiles: [],
          posts: [],
          pagination: { nextCursor: null, hasNext: false },
        });
        expect(http.get).not.toHaveBeenCalled();
      }
    });

    it('dispatches HTTP GET request when query has 3 or more characters', async () => {
      (http.get as jest.Mock).mockResolvedValueOnce({
        data: {
          profiles: [{ id: 'p1', username: 'shop1', shopName: 'Shop 1' }],
          posts: [{ id: 'post1', description: 'کفش مردانه' }],
          pagination: { nextCursor: 'next-123', hasNext: true },
        },
      });

      const result = await fetchSearchResults('کفش');

      expect(http.get).toHaveBeenCalledTimes(1);
      const [endpoint, options] = (http.get as jest.Mock).mock.calls[0];
      expect(endpoint).toBe('/search');
      expect(options.searchParams.get('q')).toBe('کفش');
      expect(result.profiles).toHaveLength(1);
      expect(result.posts).toHaveLength(1);
      expect(result.pagination.hasNext).toBe(true);
      expect(result.pagination.nextCursor).toBe('next-123');
    });

    it('sanitizes and normalizes query before checking length', async () => {
      // <b>a</b> after sanitization is "a" (< 3 chars)
      const result = await fetchSearchResults('<b>a</b>');

      expect(result.profiles).toHaveLength(0);
      expect(http.get).not.toHaveBeenCalled();
    });
  });

  describe('getNextSearchPageParam', () => {
    it('returns nextCursor when hasNext is true', () => {
      const param = getNextSearchPageParam({
        profiles: [],
        posts: [],
        pagination: { nextCursor: 'cursor_xyz', hasNext: true },
      });
      expect(param).toBe('cursor_xyz');
    });

    it('returns undefined when hasNext is false', () => {
      const param = getNextSearchPageParam({
        profiles: [],
        posts: [],
        pagination: { nextCursor: null, hasNext: false },
      });
      expect(param).toBeUndefined();
    });
  });

  describe('useSearchQuery hook enabled flag', () => {
    it('disables query execution when query length is less than 3', () => {
      const queryClient = new QueryClient();
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        React.createElement(QueryClientProvider, { client: queryClient }, children)
      );

      const { result } = renderHook(() => useSearchQuery('ab'), { wrapper });

      expect(result.current.fetchStatus).toBe('idle');
      expect(http.get).not.toHaveBeenCalled();
    });
  });
});
