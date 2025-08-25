import React, { useCallback, useRef, useMemo, DependencyList, useState } from 'react';
import { Image as RNImage } from 'react-native';
import type { VirtualizationConfig, ProcessingQueue } from './types';
import { CHUNK_SIZE, DEBOUNCE_DELAY, VIRTUALIZATION_CONFIG } from './types';

// ============================================================================
// PERFORMANCE HOOKS
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
    // Import runtime functions dynamically to avoid circular dependencies
    import('./runtime').then(({ trackComponentRender }) => {
      trackComponentRender(componentName, renderTime);
    });
  });

  return {
    mark: (name: string) => {
      import('./runtime').then(({ markPerformance }) => {
        markPerformance(`${componentName}:${name}`);
      });
    },
    measure: (name: string) => {
      import('./runtime').then(({ measurePerformance }) => {
        measurePerformance(`${componentName}:${name}`);
      });
    },
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

// Chunk processing
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

// Debounce utilities
const debounceTimers = new Map<string, NodeJS.Timeout>();

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

// Virtualization utilities
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

// Priority queue
let processingQueue: ProcessingQueue[] = [];
let isProcessingQueue = false;

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

// Image preloading
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

// Batch updater
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

// Cleanup
export function cleanup(): void {
  debounceTimers.forEach(timer => clearTimeout(timer));
  debounceTimers.clear();
  processingQueue = [];
  isProcessingQueue = false;
}