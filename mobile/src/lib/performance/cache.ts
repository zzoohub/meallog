import type { CacheConfig, CacheEntry, PerformanceMetrics } from './types';
import { DEFAULT_CACHE_CONFIG } from './config';

// ============================================================================
// CACHE STORAGE
// ============================================================================

const cache = new Map<string, CacheEntry<any>>();
let metrics: PerformanceMetrics = {
  cacheHits: 0,
  cacheMisses: 0,
  averageProcessingTime: 0,
  memoryUsage: 0,
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function isCacheEntryValid(entry: CacheEntry<any>, ttl: number): boolean {
  return Date.now() - entry.timestamp < ttl;
}

function updateAverageProcessingTime(newTime: number): void {
  const totalRequests = metrics.cacheHits + metrics.cacheMisses;
  const currentTotal = metrics.averageProcessingTime * (totalRequests - 1);
  metrics.averageProcessingTime = (currentTotal + newTime) / totalRequests;
}

function updateMemoryUsage(): void {
  metrics.memoryUsage = cache.size * 1024; // Assume 1KB per cache entry average
}

function optimizeMemory(): void {
  const now = Date.now();
  const entries = Array.from(cache.entries());
  
  entries.sort(([, a], [, b]) => {
    const scoreA = a.hitCount / Math.max(1, (now - a.timestamp) / 1000 / 60);
    const scoreB = b.hitCount / Math.max(1, (now - b.timestamp) / 1000 / 60);
    return scoreA - scoreB;
  });

  const overLimit = entries.length - DEFAULT_CACHE_CONFIG.maxSize;
  if (overLimit > 0) {
    for (let i = 0; i < overLimit && i < entries.length; i++) {
      const entry = entries[i];
      if (entry) {
        cache.delete(entry[0]);
      }
    }
  }

  updateMemoryUsage();
}

function setCacheEntry<T>(key: string, data: T, config: CacheConfig): void {
  if (cache.size >= config.maxSize) {
    optimizeMemory();
  }

  const entry: CacheEntry<T> = {
    data,
    timestamp: Date.now(),
    hitCount: 0,
  };

  cache.set(key, entry);
  updateMemoryUsage();
}

// ============================================================================
// PUBLIC API
// ============================================================================

export async function getCachedData<T>(
  key: string,
  fetchFunction: () => Promise<T>,
  config: Partial<CacheConfig> = {}
): Promise<T> {
  const finalConfig = { ...DEFAULT_CACHE_CONFIG, ...config };
  const cachedEntry = cache.get(key);

  if (cachedEntry && isCacheEntryValid(cachedEntry, finalConfig.ttl)) {
    cachedEntry.hitCount++;
    metrics.cacheHits++;
    return cachedEntry.data as T;
  }

  metrics.cacheMisses++;
  const startTime = Date.now();
  
  try {
    const data = await fetchFunction();
    const processingTime = Date.now() - startTime;
    
    updateAverageProcessingTime(processingTime);
    setCacheEntry(key, data, finalConfig);
    
    return data;
  } catch (error) {
    console.error(`Error fetching data for key ${key}:`, error);
    
    if (cachedEntry) {
      return cachedEntry.data as T;
    }
    
    throw error;
  }
}

export function clearAllCaches(): void {
  cache.clear();
  metrics.cacheHits = 0;
  metrics.cacheMisses = 0;
  updateMemoryUsage();
}

export function getCacheMetrics(): PerformanceMetrics {
  return { ...metrics };
}