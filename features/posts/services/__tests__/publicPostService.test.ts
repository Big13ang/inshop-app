import { QueryClient } from '@tanstack/react-query';
import { mapFeedPostToPublicPost, findPostInQueryCache } from '../publicPostService';
import type { BackendFeedPost } from '@/features/feed/services/feedService';

describe('publicPostService cache reuse', () => {
  const mockFeedPost: BackendFeedPost = {
    id: 'post-123',
    sellerId: 'seller-abc',
    description: 'Awesome handmade leather bag',
    productName: 'Leather Bag',
    productImageUrl: null,
    productLink: null,
    status: 'APPROVED',
    reviewedBy: 'admin-1',
    reviewedAt: '2026-09-01T10:00:00Z',
    rejectReason: null,
    createdAt: '2026-09-01T10:00:00Z',
    updatedAt: '2026-09-01T10:00:00Z',
    owner: {
      shopName: 'Leather Crafts',
      username: 'leathercrafts',
      profileUrl: 'https://cdn.example.com/avatar.jpg',
    },
    media: [
      {
        id: 'media-1',
        uploadSessionId: 'sess-1',
        sellerId: 'seller-abc',
        postId: 'post-123',
        status: 'READY',
        storageKey: 'posts/123/img.jpg',
        thumbnailStorageKey: 'posts/123/thumb.jpg',
        originalFileName: 'bag.jpg',
        mimeType: 'image/jpeg',
        sizeBytes: 10240,
        order: 0,
        altText: 'Leather bag',
        createdAt: '2026-09-01T10:00:00Z',
        updatedAt: '2026-09-01T10:00:00Z',
        url: 'https://cdn.example.com/bag.jpg',
        thumbnailUrl: 'https://cdn.example.com/thumb.jpg',
      },
    ],
  };

  describe('mapFeedPostToPublicPost', () => {
    it('correctly maps feed post to PublicPost format', () => {
      const mapped = mapFeedPostToPublicPost(mockFeedPost);

      expect(mapped.id).toBe('post-123');
      expect(mapped.description).toBe('Awesome handmade leather bag');
      expect(mapped.owner?.shopName).toBe('Leather Crafts');
      expect(mapped.owner?.username).toBe('leathercrafts');
      expect(mapped.owner?.profilePhotoUrl).toBe('https://cdn.example.com/avatar.jpg');
      expect(mapped.media).toHaveLength(1);
      expect(mapped.media[0].id).toBe('media-1');
      expect(mapped.media[0].url).toBe('https://cdn.example.com/bag.jpg');
    });

    it('handles feed post without owner gracefully', () => {
      const noOwnerPost: BackendFeedPost = { ...mockFeedPost, owner: undefined };
      const mapped = mapFeedPostToPublicPost(noOwnerPost);

      expect(mapped.owner).toBeUndefined();
      expect(mapped.shop).toBeUndefined();
    });
  });

  describe('findPostInQueryCache', () => {
    let queryClient: QueryClient;

    beforeEach(() => {
      queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
        },
      });
    });

    afterEach(() => {
      queryClient.clear();
    });

    it('returns post from direct detail cache if present', () => {
      const publicPost = mapFeedPostToPublicPost(mockFeedPost);
      queryClient.setQueryData(['posts', 'public-detail', 'post-123'], publicPost);

      const found = findPostInQueryCache(queryClient, 'post-123');
      expect(found).toEqual(publicPost);
    });

    it('finds and maps post from infinite feed query cache', () => {
      queryClient.setQueryData(['posts', 'feed', 'infinite', 15], {
        pages: [
          {
            data: [mockFeedPost],
            pagination: { nextCursor: null, hasNext: false },
          },
        ],
        pageParams: [null],
      });

      const found = findPostInQueryCache(queryClient, 'post-123');
      expect(found).toBeDefined();
      expect(found?.id).toBe('post-123');
      expect(found?.owner?.shopName).toBe('Leather Crafts');
    });

    it('returns undefined when post is not in cache', () => {
      const found = findPostInQueryCache(queryClient, 'non-existent-id');
      expect(found).toBeUndefined();
    });

    it('returns undefined when id is empty', () => {
      const found = findPostInQueryCache(queryClient, '');
      expect(found).toBeUndefined();
    });
  });
});
