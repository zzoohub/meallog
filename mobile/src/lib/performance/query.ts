import { QueryClient } from '@tanstack/react-query';
import type { PrefetchQuery } from './types';

// ============================================================================
// QUERY CLIENT
// ============================================================================

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
      retry: 2,
      refetchOnWindowFocus: false,
      refetchOnReconnect: 'always',
    },
    mutations: {
      retry: 1,
    },
  },
});

// ============================================================================
// PREFETCH UTILITIES
// ============================================================================

// Prefetch queue storage
const prefetchQueue = new Map<string, Promise<any>>();

export async function prefetchData(
  key: string[], 
  fetcher: () => Promise<any>, 
  staleTime?: number
): Promise<any> {
  const keyStr = JSON.stringify(key);
  
  if (prefetchQueue.has(keyStr)) {
    return prefetchQueue.get(keyStr);
  }

  const promise = queryClient.prefetchQuery({
    queryKey: key,
    queryFn: fetcher,
    staleTime: staleTime || 1000 * 60 * 5,
  });

  prefetchQueue.set(keyStr, promise);
  
  promise.finally(() => {
    prefetchQueue.delete(keyStr);
  });

  return promise;
}

export async function prefetchBatch(queries: PrefetchQuery[]): Promise<PromiseSettledResult<any>[]> {
  return Promise.allSettled(
    queries.map(q => prefetchData(q.key, q.fetcher, q.staleTime))
  );
}