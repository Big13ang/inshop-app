import {
  isClientHttpError,
  isFeedSessionExpiredError,
  shouldRetryFeed,
  fetchFeedPosts,
} from '../feedService';
import { http } from '@/lib/utils';
import { HTTPError } from 'ky';

jest.mock('@/lib/utils', () => {
  const original = jest.requireActual('@/lib/utils');
  return {
    ...original,
    http: {
      get: jest.fn(),
    },
  };
});

describe('feedService error handling and retry guards', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('isClientHttpError', () => {
    it('identifies 400 Bad Request as client error', () => {
      const error = new HTTPError(
        new Response(JSON.stringify({ message: 'FEED.SESSION_EXPIRED' }), { status: 400 }),
        new Request('https://api.example.com/posts/feed'),
        {} as never
      );
      expect(isClientHttpError(error)).toBe(true);
    });

    it('identifies 429 Too Many Requests as client error', () => {
      const error = new HTTPError(
        new Response('Too Many Requests', { status: 429 }),
        new Request('https://api.example.com/posts/feed'),
        {} as never
      );
      expect(isClientHttpError(error)).toBe(true);
    });

    it('does not treat 500 Internal Server Error as client error', () => {
      const error = new HTTPError(
        new Response('Internal Server Error', { status: 500 }),
        new Request('https://api.example.com/posts/feed'),
        {} as never
      );
      expect(isClientHttpError(error)).toBe(false);
    });
  });

  describe('isFeedSessionExpiredError', () => {
    it('detects 400 HTTP error', () => {
      const error = new HTTPError(
        new Response('Bad Request', { status: 400 }),
        new Request('https://api.example.com/posts/feed'),
        {} as never
      );
      expect(isFeedSessionExpiredError(error)).toBe(true);
    });

    it('detects 404 HTTP error', () => {
      const error = new HTTPError(
        new Response('Not Found', { status: 404 }),
        new Request('https://api.example.com/posts/feed'),
        {} as never
      );
      expect(isFeedSessionExpiredError(error)).toBe(true);
    });

    it('detects FEED.SESSION_EXPIRED message', () => {
      const error = new Error('FEED.SESSION_EXPIRED');
      expect(isFeedSessionExpiredError(error)).toBe(true);
    });

    it('detects FEED.SESSION_NOT_FOUND message', () => {
      const error = new Error('FEED.SESSION_NOT_FOUND');
      expect(isFeedSessionExpiredError(error)).toBe(true);
    });

    it('detects Persian session expired message', () => {
      const error = new Error('نشست فید منقضی شده است. لطفاً فید را تازهسازی کنید.');
      expect(isFeedSessionExpiredError(error)).toBe(true);
    });

    it('detects Persian session not found message', () => {
      const error = new Error('نشست فید دیگر در دسترس نیست. لطفاً فید را تازه‌سازی کنید.');
      expect(isFeedSessionExpiredError(error)).toBe(true);
    });

    it('detects English session not found message', () => {
      const error = new Error('This feed session is no longer available. Please refresh the feed.');
      expect(isFeedSessionExpiredError(error)).toBe(true);
    });

    it('returns false for unrelated errors', () => {
      const error = new Error('Network timeout');
      expect(isFeedSessionExpiredError(error)).toBe(false);
    });
  });

  describe('shouldRetryFeed', () => {
    it('returns false on 400 error immediately without retrying', () => {
      const error = new HTTPError(
        new Response(JSON.stringify({ message: 'FEED.SESSION_EXPIRED' }), { status: 400 }),
        new Request('https://api.example.com/posts/feed'),
        {} as never
      );
      expect(shouldRetryFeed(0, error)).toBe(false);
      expect(shouldRetryFeed(1, error)).toBe(false);
    });

    it('returns true for 500 error on first attempt and false after max attempts', () => {
      const error = new HTTPError(
        new Response('Internal Server Error', { status: 500 }),
        new Request('https://api.example.com/posts/feed'),
        {} as never
      );
      expect(shouldRetryFeed(0, error)).toBe(true);
      expect(shouldRetryFeed(1, error)).toBe(true);
      expect(shouldRetryFeed(2, error)).toBe(false);
    });
  });

  describe('fetchFeedPosts', () => {
    it('omits cursor parameter when cursor is null or undefined', async () => {
      const mockResponse = {
        success: true,
        data: [{ id: 'post-1', sellerId: 'seller-1', description: 'test', status: 'APPROVED' }],
        pagination: { nextCursor: 'token-abc', hasNext: true },
      };
      (http.get as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await fetchFeedPosts(null, 15);

      expect(http.get).toHaveBeenCalledWith('/posts/feed', {
        searchParams: expect.any(URLSearchParams),
      });
      const searchParams = (http.get as jest.Mock).mock.calls[0][1].searchParams as URLSearchParams;
      expect(searchParams.get('limit')).toBe('15');
      expect(searchParams.get('cursor')).toBeNull();
      expect(result.data).toHaveLength(1);
      expect(result.pagination.nextCursor).toBe('token-abc');
      expect(result.pagination.hasNext).toBe(true);
    });

    it('sets cursor parameter when cursor string is passed', async () => {
      const mockResponse = {
        success: true,
        data: [{ id: 'post-2', sellerId: 'seller-1', description: 'test 2', status: 'APPROVED' }],
        pagination: { nextCursor: 'token-def', hasNext: false },
      };
      (http.get as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await fetchFeedPosts('token-abc', 15);

      const searchParams = (http.get as jest.Mock).mock.calls[0][1].searchParams as URLSearchParams;
      expect(searchParams.get('cursor')).toBe('token-abc');
      expect(result.data[0].id).toBe('post-2');
      expect(result.pagination.hasNext).toBe(false);
    });
  });
});
