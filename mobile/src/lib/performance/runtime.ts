import { InteractionManager } from 'react-native';
import type { 
  CacheConfig, 
  CacheEntry, 
  PerformanceMetrics, 
  PerformanceMetric, 
  NavigationMetric 
} from './types';
import { DEFAULT_CACHE_CONFIG } from './types';

// ============================================================================
// CACHE STORAGE
// ============================================================================

const cache = new Map<string, CacheEntry<any>>();
let cacheMetrics: PerformanceMetrics = {
  cacheHits: 0,
  cacheMisses: 0,
  averageProcessingTime: 0,
  memoryUsage: 0,
};

// ============================================================================
// PERFORMANCE MONITORING STORAGE
// ============================================================================

const performanceMetrics = new Map<string, PerformanceMetric>();
const navigationMetrics: NavigationMetric[] = [];
const componentRenderTimes = new Map<string, number[]>();
const apiCallMetrics = new Map<string, { count: number; totalTime: number; errors: number }>();

// ============================================================================
// CACHE HELPER FUNCTIONS
// ============================================================================

function isCacheEntryValid(entry: CacheEntry<any>, ttl: number): boolean {
  return Date.now() - entry.timestamp < ttl;
}

function updateAverageProcessingTime(newTime: number): void {
  const totalRequests = cacheMetrics.cacheHits + cacheMetrics.cacheMisses;
  const currentTotal = cacheMetrics.averageProcessingTime * (totalRequests - 1);
  cacheMetrics.averageProcessingTime = (currentTotal + newTime) / totalRequests;
}

function updateMemoryUsage(): void {
  cacheMetrics.memoryUsage = cache.size * 1024; // Assume 1KB per cache entry average
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
// CACHE API
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
    cacheMetrics.cacheHits++;
    return cachedEntry.data as T;
  }

  cacheMetrics.cacheMisses++;
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
  cacheMetrics.cacheHits = 0;
  cacheMetrics.cacheMisses = 0;
  updateMemoryUsage();
}

export function getCacheMetrics(): PerformanceMetrics {
  return { ...cacheMetrics };
}

// ============================================================================
// PERFORMANCE MONITORING API
// ============================================================================

export function markPerformance(name: string, metadata?: Record<string, any>): void {
  performanceMetrics.set(name, {
    name,
    startTime: performance.now(),
    metadata: metadata || {},
  });
}

export function measurePerformance(name: string): number | undefined {
  const metric = performanceMetrics.get(name);
  if (!metric) {
    console.warn(`No mark found for: ${name}`);
    return undefined;
  }

  const endTime = performance.now();
  const duration = endTime - metric.startTime;

  metric.endTime = endTime;
  metric.duration = duration;

  if (__DEV__) {
    console.log(`⏱ ${name}: ${duration.toFixed(2)}ms`, metric.metadata);
  }

  return duration;
}

export function startNavigation(from: string, to: string): void {
  navigationMetrics.push({
    from,
    to,
    startTime: performance.now(),
  });
}

export function endNavigation(from: string, to: string): void {
  const metric = navigationMetrics.find(
    m => m.from === from && m.to === to && !m.endTime
  );

  if (metric) {
    metric.endTime = performance.now();
    metric.duration = metric.endTime - metric.startTime;

    if (__DEV__) {
      console.log(`📍 Navigation ${from} → ${to}: ${metric.duration.toFixed(2)}ms`);
    }

    if (metric.duration > 300) {
      console.warn(`Slow navigation detected: ${from} → ${to} (${metric.duration.toFixed(2)}ms)`);
    }
  }
}

export function trackComponentRender(componentName: string, renderTime: number): void {
  if (!componentRenderTimes.has(componentName)) {
    componentRenderTimes.set(componentName, []);
  }

  const times = componentRenderTimes.get(componentName)!;
  times.push(renderTime);

  if (times.length > 10) {
    times.shift();
  }

  const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
  if (avgTime > 16.67) { // More than one frame (60fps)
    console.warn(`Slow render detected for ${componentName}: avg ${avgTime.toFixed(2)}ms`);
  }
}

export function trackAPICall(endpoint: string, duration: number, success: boolean): void {
  if (!apiCallMetrics.has(endpoint)) {
    apiCallMetrics.set(endpoint, { count: 0, totalTime: 0, errors: 0 });
  }

  const metric = apiCallMetrics.get(endpoint)!;
  metric.count++;
  metric.totalTime += duration;
  if (!success) {
    metric.errors++;
  }

  if (__DEV__) {
    const avgTime = metric.totalTime / metric.count;
    console.log(`🌐 API ${endpoint}: ${duration.toFixed(2)}ms (avg: ${avgTime.toFixed(2)}ms)`);
  }
}

export function getPerformanceSummary() {
  const navigationAvg = navigationMetrics
    .filter(m => m.duration)
    .reduce((acc, m) => acc + m.duration!, 0) / navigationMetrics.length || 0;

  const componentRenderAvg: Record<string, number> = {};
  componentRenderTimes.forEach((times, component) => {
    componentRenderAvg[component] = times.reduce((a, b) => a + b, 0) / times.length;
  });

  const apiMetrics: Record<string, any> = {};
  apiCallMetrics.forEach((metric, endpoint) => {
    apiMetrics[endpoint] = {
      avgTime: metric.totalTime / metric.count,
      errorRate: (metric.errors / metric.count) * 100,
      totalCalls: metric.count,
    };
  });

  return {
    navigation: {
      averageTime: navigationAvg,
      totalNavigations: navigationMetrics.length,
    },
    components: componentRenderAvg,
    api: apiMetrics,
    metrics: Array.from(performanceMetrics.values()).filter(m => m.duration),
  };
}

export function clearPerformanceMetrics(): void {
  performanceMetrics.clear();
  navigationMetrics.length = 0;
  componentRenderTimes.clear();
  apiCallMetrics.clear();
}

export function logPerformanceReport(): void {
  const summary = getPerformanceSummary();
  console.log('📊 Performance Report:');
  console.log('Navigation:', summary.navigation);
  console.log('Components:', summary.components);
  console.log('API Calls:', summary.api);
  
  const slowComponents = Object.entries(summary.components)
    .filter(([_, time]) => time > 16.67)
    .sort(([, a], [, b]) => b - a);
  
  if (slowComponents.length > 0) {
    console.warn('⚠️ Slow components detected:', slowComponents);
  }
}

// ============================================================================
// ASYNC UTILITIES
// ============================================================================

export async function measureAsync<T>(
  name: string,
  operation: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  markPerformance(name, metadata);
  try {
    const result = await operation();
    measurePerformance(name);
    return result;
  } catch (error) {
    measurePerformance(name);
    throw error;
  }
}

export function measureInteraction(name: string, callback: () => void): void {
  markPerformance(`interaction:${name}`);
  
  InteractionManager.runAfterInteractions(() => {
    const duration = measurePerformance(`interaction:${name}`);
    if (duration && duration > 100) {
      console.warn(`Slow interaction detected: ${name} (${duration.toFixed(2)}ms)`);
    }
    callback();
  });
}