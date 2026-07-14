import { QueryClient } from '@tanstack/react-query';
import { queryCacheFactory, queryKeys } from '../query-keys';

describe('queryCacheFactory', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient();
    jest.spyOn(queryClient, 'invalidateQueries').mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('provides the correct domain-separated query keys structure', () => {
    expect(queryKeys.posts.all).toEqual(['posts']);
    expect(queryKeys.posts.pending()).toEqual(['posts', 'pending']);
  });

  it('invalidates pending posts cache queries', async () => {
    await queryCacheFactory.posts.invalidatePending(queryClient);

    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['posts', 'pending'],
    });
  });
});
