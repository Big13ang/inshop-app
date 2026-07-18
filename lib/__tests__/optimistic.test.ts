import { QueryClient } from '@tanstack/react-query';
import { optimisticUpdate, optimistic } from '../optimistic';

describe('optimistic helpers', () => {
  let queryClient: QueryClient;
  const testKey = ['test', 'data'] as const;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    jest.spyOn(queryClient, 'cancelQueries').mockResolvedValue(undefined);
    jest.spyOn(queryClient, 'invalidateQueries').mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('optimisticUpdate (generic)', () => {
    it('should cancel queries, save previous state, and optimistically update the cache', async () => {
      queryClient.setQueryData(testKey, 'previous value');

      const config = optimisticUpdate<string, string>({
        queryClient,
        queryKey: testKey,
        updateFn: (newVal) => newVal,
      });

      const context = await config.onMutate('new value');

      expect(queryClient.cancelQueries).toHaveBeenCalledWith({ queryKey: testKey });
      expect(context).toEqual({ previous: 'previous value' });
      expect(queryClient.getQueryData(testKey)).toBe('new value');
    });

    it('should support a function to derive the query key from variables', async () => {
      queryClient.setQueryData(['test', 'id-123'], 'value-123');

      const config = optimisticUpdate<string, { id: string }>({
        queryClient,
        queryKey: (vars) => ['test', vars.id],
        updateFn: (_, current) => `${current}-updated`,
      });

      const context = await config.onMutate({ id: 'id-123' });

      expect(queryClient.cancelQueries).toHaveBeenCalledWith({ queryKey: ['test', 'id-123'] });
      expect(context).toEqual({ previous: 'value-123' });
      expect(queryClient.getQueryData(['test', 'id-123'])).toBe('value-123-updated');
    });

    it('should rollback to previous state on error', () => {
      const config = optimisticUpdate<string, string>({
        queryClient,
        queryKey: testKey,
        updateFn: (newVal) => newVal,
      });

      config.onError(new Error('test error'), 'new value', { previous: 'previous value' });

      expect(queryClient.getQueryData(testKey)).toBe('previous value');
    });

    it('should trigger custom onError callback', () => {
      const onErrorMock = jest.fn();
      const config = optimisticUpdate<string, string>({
        queryClient,
        queryKey: testKey,
        updateFn: (newVal) => newVal,
        onError: onErrorMock,
      });

      const testError = new Error('test error');
      config.onError(testError, 'new value', undefined);

      expect(onErrorMock).toHaveBeenCalledWith(testError, 'new value');
    });

    it('should trigger custom onSuccess callback', () => {
      const onSuccessMock = jest.fn();
      const config = optimisticUpdate<string, string>({
        queryClient,
        queryKey: testKey,
        updateFn: (newVal) => newVal,
        onSuccess: onSuccessMock,
      });

      config.onSuccess('result', 'variables');

      expect(onSuccessMock).toHaveBeenCalledWith('variables');
    });

    it('should invalidate queries and trigger custom onSettled callback', () => {
      const onSettledMock = jest.fn();
      const config = optimisticUpdate<string, string>({
        queryClient,
        queryKey: testKey,
        updateFn: (newVal) => newVal,
        onSettled: onSettledMock,
      });

      config.onSettled('result', null, 'variables');

      expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: testKey });
      expect(onSettledMock).toHaveBeenCalledWith('variables');
    });
  });

  describe('optimistic.deleteList', () => {
    it('should delete an item from the list', async () => {
      const initialList = [{ id: '1', name: 'Post 1' }, { id: '2', name: 'Post 2' }];
      queryClient.setQueryData(testKey, initialList);

      const config = optimistic.deleteList<{ id: string; name: string }, string>({
        queryClient,
        queryKey: testKey,
        idSelector: (id) => id,
      });

      await config.onMutate('1');

      expect(queryClient.getQueryData(testKey)).toEqual([{ id: '2', name: 'Post 2' }]);
    });
  });

  describe('optimistic.addList', () => {
    it('should append an item to the list by default', async () => {
      const initialList = [{ id: '1', name: 'Post 1' }];
      queryClient.setQueryData(testKey, initialList);

      const config = optimistic.addList<{ id: string; name: string }, string>({
        queryClient,
        queryKey: testKey,
        itemFactory: (id) => ({ id, name: `Post ${id}` }),
      });

      await config.onMutate('2');

      expect(queryClient.getQueryData(testKey)).toEqual([
        { id: '1', name: 'Post 1' },
        { id: '2', name: 'Post 2' },
      ]);
    });

    it('should prepend an item to the list when specified', async () => {
      const initialList = [{ id: '1', name: 'Post 1' }];
      queryClient.setQueryData(testKey, initialList);

      const config = optimistic.addList<{ id: string; name: string }, string>({
        queryClient,
        queryKey: testKey,
        itemFactory: (id) => ({ id, name: `Post ${id}` }),
        position: 'prepend',
      });

      await config.onMutate('2');

      expect(queryClient.getQueryData(testKey)).toEqual([
        { id: '2', name: 'Post 2' },
        { id: '1', name: 'Post 1' },
      ]);
    });
  });

  describe('optimistic.updateList', () => {
    it('should update specific item in the list', async () => {
      const initialList = [{ id: '1', name: 'Post 1' }, { id: '2', name: 'Post 2' }];
      queryClient.setQueryData(testKey, initialList);

      const config = optimistic.updateList<{ id: string; name: string }, { id: string; name: string }>({
        queryClient,
        queryKey: testKey,
        idSelector: (vars) => vars.id,
        updater: (vars, item) => ({ ...item, name: vars.name }),
      });

      await config.onMutate({ id: '2', name: 'Post 2 Updated' });

      expect(queryClient.getQueryData(testKey)).toEqual([
        { id: '1', name: 'Post 1' },
        { id: '2', name: 'Post 2 Updated' },
      ]);
    });
  });
});
