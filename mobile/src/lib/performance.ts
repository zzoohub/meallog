import React, { useCallback, useRef, useMemo, DependencyList, useState, ComponentType, Suspense, LazyExoticComponent } from 'react';
import { InteractionManager, Image as RNImage, View, ActivityIndicator, StyleSheet } from 'react-native';
import { QueryClient } from '@tanstack/react-query';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface CacheConfig {
  maxSize: number;
  ttl: number; // Time to live in milliseconds
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  hitCount: number;
}

interface PerformanceMetrics {
  cacheHits: number;
  cacheMisses: number;
  averageProcessingTime: number;
  memoryUsage: number;
}

interface VirtualizationConfig {
  threshold: number; // Number of items before virtualization kicks in
  windowSize: number; // Number of items to render
  bufferSize: number; // Number of items to preload
}

interface ProcessingQueue {
  id: string;
  priority: number;
  task: () => Promise<any>;
  timestamp: number;
}

interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

interface NavigationMetric {
  from: string;
  to: string;
  startTime: number;
  endTime?: number;
  duration?: number;
}

type DomainModules = {
  camera: ComponentType<any>;
  meals: ComponentType<any>;
  aiCoach: ComponentType<any>;
  settings: ComponentType<any>;
  progress: ComponentType<any>;
};

type PreloadStrategy = 'eager' | 'on-demand' | 'idle';

// ============================================================================
// LAZY LOADING UTILITIES
// ============================================================================

/**
 * Lazy loading wrapper with loading fallback
 */
export function withLazy<P extends object>(
  Component: LazyExoticComponent<ComponentType<P>>,
  LoadingComponent?: ComponentType
): ComponentType<P> {
  return function LazyComponent(props: P) {
    const FallbackComponent = LoadingComponent || DefaultLoadingComponent;
    
    return React.createElement(
      Suspense,
      { fallback: React.createElement(FallbackComponent) },
      React.createElement(Component, props)
    );
  };
}

/**
 * Default loading component
 */
const DefaultLoadingComponent: ComponentType = () => React.createElement(
  View,
  { style: lazyStyles.loadingContainer },
  React.createElement(ActivityIndicator, { size: 'large', color: '#FF6B35' })
);

/**
 * Create lazy component with error boundary
 */
export function createLazyComponent<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  LoadingComponent?: ComponentType
): ComponentType<P> {
  const LazyComponent = React.lazy(importFn);
  return withLazy(LazyComponent, LoadingComponent);
}

/**
 * Preload a lazy component for better UX
 */
export function preloadComponent<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>
): void {
  // Start loading the component in the background
  importFn().catch(error => {
    if (__DEV__) {
      console.warn('Failed to preload component:', error);
    }
  });
}

const lazyStyles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
});

// ============================================================================
// QUERY CLIENT & PREFETCH UTILITIES
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

// Prefetch utilities
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

export async function prefetchBatch(queries: Array<{
  key: string[];
  fetcher: () => Promise<any>;
  staleTime?: number;
}>): Promise<PromiseSettledResult<any>[]> {
  return Promise.allSettled(
    queries.map(q => prefetchData(q.key, q.fetcher, q.staleTime))
  );
}

// ============================================================================
// CACHING UTILITIES
// ============================================================================

// Default configurations
const DEFAULT_CACHE_CONFIG: CacheConfig = {
  maxSize: 1000,
  ttl: 5 * 60 * 1000, // 5 minutes
};

const VIRTUALIZATION_CONFIG: VirtualizationConfig = {
  threshold: 100,
  windowSize: 50,
  bufferSize: 10,
};

const CHUNK_SIZE = 50;
const DEBOUNCE_DELAY = 300; // ms

// Cache storage and metrics
const cache = new Map<string, CacheEntry<any>>();
const debounceTimers = new Map<string, NodeJS.Timeout>();
let metrics: PerformanceMetrics = {
  cacheHits: 0,
  cacheMisses: 0,
  averageProcessingTime: 0,
  memoryUsage: 0,
};

// Processing queue
let processingQueue: ProcessingQueue[] = [];
let isProcessingQueue = false;

// Helper functions
function isCacheEntryValid(entry: CacheEntry<any>, ttl: number): boolean {
  return Date.now() - entry.timestamp < ttl;
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

function createChunks<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

async function yieldToMainThread(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0));
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

// ============================================================================
// CHUNK PROCESSING
// ============================================================================

export async function processInChunks<T, R>(
  data: T[],
  processor: (chunk: T[]) => Promise<R[]>,
  chunkSize: number = CHUNK_SIZE
): Promise<R[]> {
  if (data.length === 0) return [];
  
  const results: R[] = [];
  const chunks = createChunks(data, chunkSize);
  
  for (let i = 0; i < chunks.length; i++) {
    const chunkResult = await processor(chunks[i]!);
    if (chunkResult) {
      results.push(...chunkResult);
    }
    
    if (i < chunks.length - 1) {
      await yieldToMainThread();
    }
  }
  
  return results;
}

// ============================================================================
// DEBOUNCE & THROTTLE UTILITIES
// ============================================================================

export function debounce<T extends (...args: any[]) => any>(
  key: string,
  func: T,
  delay: number = DEBOUNCE_DELAY
): (...args: Parameters<T>) => void {
  return (...args: Parameters<T>) => {
    const existingTimer = debounceTimers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }
    
    const timer = setTimeout(() => {
      func(...args);
      debounceTimers.delete(key);
    }, delay);
    
    debounceTimers.set(key, timer);
  };
}

// ============================================================================
// VIRTUALIZATION UTILITIES
// ============================================================================

export function shouldUseVirtualization(itemCount: number): boolean {
  return itemCount >= VIRTUALIZATION_CONFIG.threshold;
}

export function getVirtualizationConfig(): VirtualizationConfig {
  return { ...VIRTUALIZATION_CONFIG };
}

export function calculateOptimalWindowSize(
  viewportHeight: number,
  itemHeight: number,
  bufferMultiplier: number = 2
): number {
  const visibleItems = Math.ceil(viewportHeight / itemHeight);
  return visibleItems * bufferMultiplier;
}

// ============================================================================
// PRIORITY QUEUE
// ============================================================================

function sortQueueByPriority(): void {
  processingQueue.sort((a, b) => b.priority - a.priority);
}

async function processQueue(): Promise<void> {
  if (isProcessingQueue) return;
  
  isProcessingQueue = true;
  
  while (processingQueue.length > 0) {
    const task = processingQueue.shift();
    if (task) {
      try {
        await task.task();
      } catch (error) {
        console.error(`Error processing queued task ${task.id}:`, error);
      }
    }
    
    await yieldToMainThread();
  }
  
  isProcessingQueue = false;
}

export async function queueTask(
  id: string,
  task: () => Promise<any>,
  priority: number = 0
): Promise<any> {
  return new Promise((resolve, reject) => {
    const queueItem: ProcessingQueue = {
      id,
      priority,
      task: async () => {
        try {
          const result = await task();
          resolve(result);
          return result;
        } catch (error) {
          reject(error);
          throw error;
        }
      },
      timestamp: Date.now(),
    };

    processingQueue.push(queueItem);
    sortQueueByPriority();
    
    if (!isProcessingQueue) {
      processQueue();
    }
  });
}

// ============================================================================
// IMAGE PRELOADING
// ============================================================================

async function preloadSingleImage(uri: string): Promise<void> {
  try {
    await RNImage.prefetch(uri);
  } catch (error) {
    throw new Error(`Failed to load image: ${uri} - ${error}`);
  }
}

export async function preloadImages(imageUris: string[], maxConcurrent: number = 5): Promise<void> {
  const chunks = createChunks(imageUris, maxConcurrent);
  
  for (const chunk of chunks) {
    await Promise.allSettled(
      chunk.map(uri => preloadSingleImage(uri))
    );
  }
}

// ============================================================================
// BATCH UPDATER
// ============================================================================

export function createBatchUpdater<T>(
  updateFunction: (items: T[]) => void,
  maxBatchSize: number = 10,
  maxWaitTime: number = 100
): (item: T) => void {
  let batch: T[] = [];
  let timer: NodeJS.Timeout | null = null;

  const processBatch = () => {
    if (batch.length > 0) {
      updateFunction([...batch]);
      batch = [];
    }
    timer = null;
  };

  return (item: T) => {
    batch.push(item);

    if (batch.length >= maxBatchSize) {
      if (timer) clearTimeout(timer);
      processBatch();
    } else if (!timer) {
      timer = setTimeout(processBatch, maxWaitTime);
    }
  };
}

// ============================================================================
// BUNDLE MANAGEMENT
// ============================================================================

const loadedModules = new Set<string>();
const preloadPromises = new Map<string, Promise<any>>();

function getDomainImportFunction<K extends keyof DomainModules>(
  domain: K
): () => Promise<{ default: DomainModules[K] }> {
  const importMap = {
    camera: () => import('@/components/orbital/Camera'),
    meals: () => import('../../app/meal-history'), 
    aiCoach: () => import('@/domains/ai-coach/components/AICoach'),
    settings: () => import('@/domains/settings/components/SettingsOrbital'),
    progress: () => import('@/domains/progress/components/ProgressDashboard'),
  };

  return importMap[domain] as () => Promise<{ default: DomainModules[K] }>;
}

async function scheduleIdlePreload(
  importFn: () => Promise<any>,
  domain: string
): Promise<void> {
  return new Promise((resolve) => {
    const callback = () => {
      if (!loadedModules.has(domain)) {
        preloadComponent(importFn);
        loadedModules.add(domain);
      }
      resolve();
    };

    if ('requestIdleCallback' in globalThis) {
      (globalThis as any).requestIdleCallback(callback, { timeout: 2000 });
    } else {
      setTimeout(callback, 100);
    }
  });
}

export async function importDomain<K extends keyof DomainModules>(
  domain: K, 
  strategy: PreloadStrategy = 'on-demand'
): Promise<() => Promise<{ default: DomainModules[K] }>> {
  const importFn = getDomainImportFunction(domain);
  
  if (strategy === 'eager' && !loadedModules.has(domain)) {
    preloadComponent(importFn);
    loadedModules.add(domain);
  } else if (strategy === 'idle' && !preloadPromises.has(domain)) {
    preloadPromises.set(domain, scheduleIdlePreload(importFn, domain));
  }

  return importFn;
}

export function preloadCriticalModules(): void {
  importDomain('camera', 'eager');
  importDomain('progress', 'idle');
}

export function getLoadedModulesCount(): number {
  return loadedModules.size;
}

export function isModuleLoaded(domain: keyof DomainModules): boolean {
  return loadedModules.has(domain);
}

export const importDomainMap = {
  camera: () => import('@/components/orbital/Camera'),
  meals: () => import('../../app/meal-history'),
  aiCoach: () => import('@/domains/ai-coach/components/AICoach'),
  settings: () => import('@/domains/settings/components/SettingsOrbital'),
  progress: () => import('@/domains/progress/components/ProgressDashboard'),
} as const;

// ============================================================================
// PERFORMANCE MONITORING
// ============================================================================

const performanceMetrics = new Map<string, PerformanceMetric>();
const navigationMetrics: NavigationMetric[] = [];
const componentRenderTimes = new Map<string, number[]>();
const apiCallMetrics = new Map<string, { count: number; totalTime: number; errors: number }>();

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

// ============================================================================
// HOOKS
// ============================================================================

export function useStableCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: DependencyList
): T {
  const callbackRef = React.useRef<T>(callback);
  const depsRef = React.useRef<DependencyList>(deps);

  const depsChanged = React.useMemo(() => {
    if (!depsRef.current) return true;
    if (depsRef.current.length !== deps.length) return true;
    return depsRef.current.some((dep, index) => dep !== deps[index]);
  }, deps);

  if (depsChanged) {
    callbackRef.current = callback;
    depsRef.current = deps;
  }

  return callbackRef.current!;
}

export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: DependencyList
): T {
  const timeoutRef = React.useRef<NodeJS.Timeout | undefined>(undefined);
  
  return React.useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    }) as T,
    [callback, delay, ...deps]
  );
}

export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: DependencyList
): T {
  const lastCallRef = React.useRef<number>(0);
  
  return React.useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastCallRef.current >= delay) {
        lastCallRef.current = now;
        callback(...args);
      }
    }) as T,
    [callback, delay, ...deps]
  );
}

export function usePrevious<T>(value: T): T | undefined {
  const ref = React.useRef<T | undefined>(undefined);
  
  const previous = ref.current;
  ref.current = value;
  
  return previous;
}

export function useMemoWithEquals<T>(
  factory: () => T,
  deps: DependencyList,
  equals?: (prev: T, next: T) => boolean
): T {
  const valueRef = React.useRef<T | undefined>(undefined);
  const depsRef = React.useRef<DependencyList | undefined>(undefined);
  
  const depsChanged = React.useMemo(() => {
    if (!depsRef.current) return true;
    if (depsRef.current.length !== deps.length) return true;
    return depsRef.current.some((dep, index) => dep !== deps[index]);
  }, deps);
  
  if (depsChanged) {
    const newValue = factory();
    
    if (!valueRef.current || !equals?.(valueRef.current, newValue)) {
      valueRef.current = newValue;
    }
    
    depsRef.current = deps;
  }
  
  return valueRef.current!;
}

export function useAsyncOperation<T, E = Error>() {
  const [state, setState] = React.useState<{
    data: T | null;
    loading: boolean;
    error: E | null;
  }>({
    data: null,
    loading: false,
    error: null,
  });
  
  const execute = React.useCallback(async (asyncFn: () => Promise<T>) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const result = await asyncFn();
      setState({ data: result, loading: false, error: null });
      return result;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error as E 
      }));
      throw error;
    }
  }, []);
  
  const reset = React.useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);
  
  return {
    ...state,
    execute,
    reset,
  };
}

export function usePerformanceMonitor(componentName: string) {
  const startTime = performance.now();

  React.useEffect(() => {
    const renderTime = performance.now() - startTime;
    trackComponentRender(componentName, renderTime);
  });

  return {
    mark: (name: string) => markPerformance(`${componentName}:${name}`),
    measure: (name: string) => measurePerformance(`${componentName}:${name}`),
  };
}

// ============================================================================
// CLEANUP
// ============================================================================

export function cleanup(): void {
  debounceTimers.forEach(timer => clearTimeout(timer));
  debounceTimers.clear();
  clearAllCaches();
  processingQueue = [];
  isProcessingQueue = false;
  clearPerformanceMetrics();
}