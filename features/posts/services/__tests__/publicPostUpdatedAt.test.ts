import { mapFeedPostToPublicPost } from '../publicPostService';
import type { BackendFeedPost } from '@/features/feed/services/feedService';

describe('mapFeedPostToPublicPost updatedAt', () => {
  it('carries the last update time through to the public post', () => {
    const feedPost = {
      id: 'post-1',
      description: 'کت پاییزه',
      createdAt: '2026-09-01T10:00:00.000Z',
      updatedAt: '2026-10-24T12:11:23.591Z',
      media: [],
    } as unknown as BackendFeedPost;

    const mapped = mapFeedPostToPublicPost(feedPost);

    expect(mapped.updatedAt).toBe('2026-10-24T12:11:23.591Z');
  });
});
