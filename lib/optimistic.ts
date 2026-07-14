import { QueryClient, QueryKey } from '@tanstack/react-query';

export interface OptimisticCallbacks<TVariables> {
  onSuccess?: (variables: TVariables) => void;
  onError?: (error: Error, variables: TVariables) => void;
  onSettled?: (variables: TVariables) => void;
}

export interface OptimisticConfig<TQueryData, TVariables> extends OptimisticCallbacks<TVariables> {
  queryClient: QueryClient;
  queryKey: QueryKey | ((variables: TVariables) => QueryKey);
  updateFn: (variables: TVariables, current: TQueryData | undefined) => TQueryData;
}

/**
 * Generic optimistic update helper that returns React Query mutation lifecycles.
 */
export function optimisticUpdate<TQueryData, TVariables>({
  queryClient,
  queryKey,
  updateFn,
  onSuccess,
  onError,
  onSettled,
}: OptimisticConfig<TQueryData, TVariables>) {
  const getQueryKey = (variables: TVariables): QueryKey => {
    return typeof queryKey === 'function' ? queryKey(variables) : queryKey;
  };

  return {
    onMutate: async (variables: TVariables) => {
      const activeKey = getQueryKey(variables);

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: activeKey });

      // Snapshot the previous state
      const previous = queryClient.getQueryData<TQueryData>(activeKey);

      // Optimistically update the cache
      queryClient.setQueryData<TQueryData>(activeKey, (current) => {
        return updateFn(variables, current);
      });

      return { previous };
    },
    onError: (
      err: unknown,
      variables: TVariables,
      context: { previous?: TQueryData } | undefined,
    ) => {
      const activeKey = getQueryKey(variables);

      // Rollback to the previous state on error
      if (context?.previous !== undefined) {
        queryClient.setQueryData(activeKey, context.previous);
      }
      onError?.(err instanceof Error ? err : new Error(String(err)), variables);
    },
    onSuccess: (_data: unknown, variables: TVariables) => {
      onSuccess?.(variables);
    },
    onSettled: (
      _data: unknown,
      _error: unknown,
      variables: TVariables,
    ) => {
      const activeKey = getQueryKey(variables);
      queryClient.invalidateQueries({ queryKey: activeKey });
      onSettled?.(variables);
    },
  };
}

/**
 * Specialized helpers for common array-based query cache updates.
 */
export const optimistic = {
  /**
   * Optimistically removes an item from a cached array.
   */
  deleteList: <TData extends { id: string | number }, TVariables>({
    queryClient,
    queryKey,
    idSelector,
    ...callbacks
  }: {
    queryClient: QueryClient;
    queryKey: QueryKey | ((vars: TVariables) => QueryKey);
    idSelector: (vars: TVariables) => TData['id'];
  } & OptimisticCallbacks<TVariables>) =>
    optimisticUpdate<TData[], TVariables>({
      queryClient,
      queryKey,
      updateFn: (vars, current) => {
        const targetId = idSelector(vars);
        return current?.filter((item) => item.id !== targetId) ?? [];
      },
      ...callbacks,
    }),

  /**
   * Optimistically appends or prepends an item to a cached array.
   */
  addList: <TData, TVariables>({
    queryClient,
    queryKey,
    itemFactory,
    position = 'append',
    ...callbacks
  }: {
    queryClient: QueryClient;
    queryKey: QueryKey | ((vars: TVariables) => QueryKey);
    itemFactory: (vars: TVariables) => TData;
    position?: 'append' | 'prepend';
  } & OptimisticCallbacks<TVariables>) =>
    optimisticUpdate<TData[], TVariables>({
      queryClient,
      queryKey,
      updateFn: (vars, current) => {
        const newItem = itemFactory(vars);
        const items = current ?? [];
        return position === 'prepend' ? [newItem, ...items] : [...items, newItem];
      },
      ...callbacks,
    }),

  /**
   * Optimistically updates properties of an item in a cached array.
   */
  updateList: <TData extends { id: string | number }, TVariables>({
    queryClient,
    queryKey,
    idSelector,
    updater,
    ...callbacks
  }: {
    queryClient: QueryClient;
    queryKey: QueryKey | ((vars: TVariables) => QueryKey);
    idSelector: (vars: TVariables) => TData['id'];
    updater: (vars: TVariables, item: TData) => TData;
  } & OptimisticCallbacks<TVariables>) =>
    optimisticUpdate<TData[], TVariables>({
      queryClient,
      queryKey,
      updateFn: (vars, current) => {
        const targetId = idSelector(vars);
        return current?.map((item) => (item.id === targetId ? updater(vars, item) : item)) ?? [];
      },
      ...callbacks,
    }),
};
