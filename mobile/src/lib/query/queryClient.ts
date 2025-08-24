import { QueryClient, DefaultOptions } from '@tanstack/react-query';
import { AppState } from 'react-native';
// NetInfo removed for simplification
import { performanceMonitor } from '@/lib/performance';
import { NetworkOptimizer } from '@/lib/performance/optimization';
import { errorHandler, NetworkError, APIError } from '@/lib/errors';
import { ENV_CONFIG, LIMITS } from '@/constants';

// Enhanced error handler for React Query
const handleQueryError = (error: unknown): never => {
  if (error instanceof Response) {
    throw new APIError(
      error.statusText || 'API request failed',
      error.status,
      error.url,
      { response: error }
    );
  }
  
  if (error instanceof TypeError && error.message.includes('fetch')) {
    throw new NetworkError('Network request failed', { originalError: error });
  }
  
  throw errorHandler.handle(error, { context: 'react-query' });
};

// Performance-aware retry function
const createRetryFn = () => {
  return (failureCount: number, error: any) => {
    // Don't retry on authentication errors
    if (error?.status === 401 || error?.status === 403) {
      return false;
    }
    
    // Don't retry on client errors (4xx)
    if (error?.status >= 400 && error?.status < 500) {
      return false;
    }
    
    // Limit retries based on performance conditions
    const maxRetries = performanceMonitor.isLowPerformance() ? 1 : LIMITS.MAX_RETRY_ATTEMPTS;
    
    return failureCount < maxRetries;
  };
};

// Dynamic options based on network and performance conditions
const createDynamicOptions = (): DefaultOptions => {
  const isLowPerformance = performanceMonitor.isLowPerformance();
  
  return {
    queries: {
      staleTime: isLowPerformance ? 1000 * 60 * 10 : 1000 * 60 * 5, // Longer stale time on low performance
      gcTime: 1000 * 60 * 15, // 15 minutes garbage collection
      retry: createRetryFn(),
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
      refetchOnWindowFocus: !ENV_CONFIG.IS_DEVELOPMENT, // Disable in dev for better DX
      refetchOnReconnect: 'always',
      refetchOnMount: true,
      // Network-aware settings
      networkMode: 'online',
      // Error handling
      throwOnError: false,
      // Performance optimizations
      structuralSharing: !isLowPerformance, // Disable on low performance devices
    },
    mutations: {
      retry: createRetryFn(),
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
      networkMode: 'online',
      throwOnError: false,
      // Performance tracking
      onSuccess: () => {
        performanceMonitor.recordEvent({
          name: 'mutation_success',
          timestamp: new Date(),
        });
      },
      onError: (error) => {
        handleQueryError(error);
      },
    },
  };
};

export const queryClient = new QueryClient({
  defaultOptions: createDynamicOptions(),
});

// Enhanced error handling
queryClient.setDefaultOptions({
  queries: {
    ...queryClient.getDefaultOptions().queries,
    queryFn: async ({ queryKey, signal, meta }) => {
      const url = meta?.url as string;
      if (!url) {
        throw new Error('Query URL is required');
      }
      
      const startTime = performance.now();
      
      try {
        const response = await NetworkOptimizer.optimizedFetch(url, {
          signal,
          headers: {
            'Content-Type': 'application/json',
            ...(meta?.headers as Record<string, string> || {}),
          },
        });
        
        if (!response.ok) {
          throw new APIError(
            response.statusText || 'API request failed',
            response.status,
            response.url || url
          );
        }
        
        const data = await response.json();
        const requestTime = performance.now() - startTime;
        
        // Track successful queries
        performanceMonitor.recordMetric({
          name: 'query_request_time',
          value: requestTime,
          tags: {
            queryKey: JSON.stringify(queryKey),
            status: 'success',
          },
        });
        
        return data;
      } catch (error) {
        const requestTime = performance.now() - startTime;
        
        performanceMonitor.recordMetric({
          name: 'query_request_time',
          value: requestTime,
          tags: {
            queryKey: JSON.stringify(queryKey),
            status: 'error',
          },
        });
        
        throw handleQueryError(error);
      }
    },
  },
});

// Network status monitoring simplified
// Note: Advanced network monitoring removed for app simplification
// App will handle network errors through query retries and error boundaries

// App state integration
AppState.addEventListener('change', (nextAppState) => {
  if (nextAppState === 'active') {
    queryClient.resumePausedMutations();
  }
});

// Enhanced prefetch manager with priority and performance optimization
export class PrefetchManager {
  private static instance: PrefetchManager;
  private prefetchQueue: Map<string, Promise<any>> = new Map();
  private priorityQueue: Array<{ key: string; priority: number; executor: () => Promise<any> }> = [];
  private isProcessingQueue = false;
  private maxConcurrentPrefetches = 3;
  private activePrefetches = 0;

  static getInstance(): PrefetchManager {
    if (!PrefetchManager.instance) {
      PrefetchManager.instance = new PrefetchManager();
    }
    return PrefetchManager.instance;
  }

  async prefetchData(
    key: string[], 
    fetcher: () => Promise<any>, 
    options: {
      staleTime?: number;
      priority?: number;
      force?: boolean;
    } = {}
  ) {
    const { staleTime = 1000 * 60 * 5, priority = 1, force = false } = options;
    const keyStr = JSON.stringify(key);
    
    // Check if data is already fresh in cache
    if (!force) {
      const cachedData = queryClient.getQueryData(key);
      const queryState = queryClient.getQueryState(key);
      
      if (cachedData && queryState && Date.now() - queryState.dataUpdatedAt < staleTime) {
        return Promise.resolve(cachedData);
      }
    }
    
    // Check if already prefetching
    if (this.prefetchQueue.has(keyStr)) {
      return this.prefetchQueue.get(keyStr);
    }

    // Create prefetch executor
    const executor = async () => {
      this.activePrefetches++;
      
      try {
        const startTime = performance.now();
        
        const result = await queryClient.prefetchQuery({
          queryKey: key,
          queryFn: fetcher,
          staleTime,
        });
        
        const prefetchTime = performance.now() - startTime;
        
        performanceMonitor.recordMetric({
          name: 'prefetch_time',
          value: prefetchTime,
          tags: {
            queryKey: keyStr,
            priority: priority.toString(),
          },
        });
        
        return result;
      } finally {
        this.activePrefetches--;
        this.processQueue(); // Process next in queue
      }
    };

    // Handle based on current load and priority
    if (this.activePrefetches < this.maxConcurrentPrefetches || priority >= 5) {
      // Execute immediately if slots available or high priority
      const promise = executor();
      this.prefetchQueue.set(keyStr, promise);
      
      promise.finally(() => {
        this.prefetchQueue.delete(keyStr);
      });
      
      return promise;
    } else {
      // Add to priority queue
      return new Promise((resolve, reject) => {
        this.priorityQueue.push({
          key: keyStr,
          priority,
          executor: async () => {
            try {
              const result = await executor();
              resolve(result);
              return result;
            } catch (error) {
              reject(error);
              throw error;
            }
          },
        });
        
        // Sort by priority (higher first)
        this.priorityQueue.sort((a, b) => b.priority - a.priority);
      });
    }
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.priorityQueue.length === 0) {
      return;
    }
    
    if (this.activePrefetches >= this.maxConcurrentPrefetches) {
      return;
    }

    this.isProcessingQueue = true;
    
    const queueItem = this.priorityQueue.shift();
    if (queueItem) {
      const promise = queueItem.executor();
      this.prefetchQueue.set(queueItem.key, promise);
      
      promise.finally(() => {
        this.prefetchQueue.delete(queueItem.key);
      });
    }
    
    this.isProcessingQueue = false;
  }

  // Enhanced batch prefetch with priority support
  async prefetchBatch(queries: Array<{
    key: string[];
    fetcher: () => Promise<any>;
    staleTime?: number;
    priority?: number;
  }>) {
    // Sort by priority
    const sortedQueries = queries.sort((a, b) => (b.priority || 1) - (a.priority || 1));
    
    return Promise.allSettled(
      sortedQueries.map(q => 
        this.prefetchData(q.key, q.fetcher, {
          staleTime: q.staleTime,
          priority: q.priority,
        })
      )
    );
  }

  // Prefetch related data based on user navigation patterns
  async prefetchRelatedData(baseKey: string[], relatedQueries: Array<{
    key: string[];
    fetcher: () => Promise<any>;
    relevanceScore: number;
  }>) {
    // Only prefetch if user is likely to need the data
    const highRelevanceQueries = relatedQueries
      .filter(q => q.relevanceScore > 0.7)
      .map(q => ({
        key: q.key,
        fetcher: q.fetcher,
        priority: Math.floor(q.relevanceScore * 5), // Convert to priority scale
      }));
    
    return this.prefetchBatch(highRelevanceQueries);
  }

  // Clear prefetch queue
  clearQueue(): void {
    this.priorityQueue = [];
    this.prefetchQueue.clear();
  }

  // Get queue stats
  getQueueStats(): {
    activeCount: number;
    queuedCount: number;
    totalPrefetches: number;
  } {
    return {
      activeCount: this.activePrefetches,
      queuedCount: this.priorityQueue.length,
      totalPrefetches: this.prefetchQueue.size,
    };
  }

  // Adjust concurrency based on device performance
  adjustConcurrency(maxConcurrent: number): void {
    this.maxConcurrentPrefetches = Math.max(1, Math.min(maxConcurrent, 5));
  }
}

export const prefetchManager = PrefetchManager.getInstance();

// Adjust concurrency based on device performance
if (performanceMonitor.isLowPerformance()) {
  prefetchManager.adjustConcurrency(1);
} else {
  prefetchManager.adjustConcurrency(3);
}