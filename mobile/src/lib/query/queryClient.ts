import { QueryClient } from '@tanstack/react-query';

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

// Prefetch manager for background loading
export class PrefetchManager {
  private static instance: PrefetchManager;
  private prefetchQueue: Map<string, Promise<any>> = new Map();

  static getInstance(): PrefetchManager {
    if (!PrefetchManager.instance) {
      PrefetchManager.instance = new PrefetchManager();
    }
    return PrefetchManager.instance;
  }

  async prefetchData(key: string[], fetcher: () => Promise<any>, staleTime?: number) {
    const keyStr = JSON.stringify(key);
    
    // Check if already prefetching
    if (this.prefetchQueue.has(keyStr)) {
      return this.prefetchQueue.get(keyStr);
    }

    // Start prefetch
    const promise = queryClient.prefetchQuery({
      queryKey: key,
      queryFn: fetcher,
      staleTime: staleTime || 1000 * 60 * 5,
    });

    this.prefetchQueue.set(keyStr, promise);
    
    // Clean up after completion
    promise.finally(() => {
      this.prefetchQueue.delete(keyStr);
    });

    return promise;
  }

  // Prefetch multiple queries in parallel
  async prefetchBatch(queries: Array<{
    key: string[];
    fetcher: () => Promise<any>;
    staleTime?: number;
  }>) {
    return Promise.allSettled(
      queries.map(q => this.prefetchData(q.key, q.fetcher, q.staleTime))
    );
  }
}

export const prefetchManager = PrefetchManager.getInstance();