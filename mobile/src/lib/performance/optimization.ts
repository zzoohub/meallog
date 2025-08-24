/**
 * Performance Optimization Utilities
 * Tools for optimizing React Native app performance
 */

import { InteractionManager, Platform } from 'react-native';
import { performanceMonitor } from './monitor';

// Memory management
export class MemoryManager {
  private static instance: MemoryManager;
  private memoryWarningListeners: Array<() => void> = [];
  private isLowMemoryMode = false;

  private constructor() {
    this.setupMemoryWarning();
  }

  public static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  private setupMemoryWarning(): void {
    // Platform-specific memory warning setup would go here
    // For now, we'll simulate based on available memory checks
    if (__DEV__) {
      // In development, check memory usage periodically
      setInterval(() => {
        this.checkMemoryUsage();
      }, 30000); // Check every 30 seconds
    }
  }

  private checkMemoryUsage(): void {
    // This would use platform-specific APIs to check memory
    // For now, simulate memory pressure
    const simulateMemoryPressure = Math.random() > 0.9; // 10% chance
    
    if (simulateMemoryPressure && !this.isLowMemoryMode) {
      this.triggerMemoryWarning();
    } else if (!simulateMemoryPressure && this.isLowMemoryMode) {
      this.isLowMemoryMode = false;
      console.log('Memory pressure relieved');
    }
  }

  private triggerMemoryWarning(): void {
    console.warn('Memory warning triggered');
    this.isLowMemoryMode = true;
    
    performanceMonitor.recordEvent({
      name: 'memory_warning',
      timestamp: new Date(),
      metadata: {
        memoryUsage: this.getMemoryUsage(),
      },
    });

    // Notify all listeners
    this.memoryWarningListeners.forEach(listener => {
      try {
        listener();
      } catch (error) {
        console.error('Error in memory warning listener:', error);
      }
    });
  }

  public addMemoryWarningListener(listener: () => void): () => void {
    this.memoryWarningListeners.push(listener);
    
    return () => {
      const index = this.memoryWarningListeners.indexOf(listener);
      if (index > -1) {
        this.memoryWarningListeners.splice(index, 1);
      }
    };
  }

  public getMemoryUsage(): number {
    // Platform-specific memory usage would be implemented here
    // For now, return a simulated value
    return Math.floor(Math.random() * 100);
  }

  public get isInLowMemoryMode(): boolean {
    return this.isLowMemoryMode;
  }

  public forceGarbageCollection(): void {
    if (__DEV__) {
      console.log('Force garbage collection triggered');
    }
    
    // In production, this would trigger platform-specific GC
    performanceMonitor.recordEvent({
      name: 'force_garbage_collection',
      timestamp: new Date(),
    });
  }
}

export const memoryManager = MemoryManager.getInstance();

// Image optimization utilities
export class ImageOptimizer {
  private static cache = new Map<string, string>();
  private static maxCacheSize = 50;

  public static optimizeImageUri(
    uri: string,
    options: {
      width?: number;
      height?: number;
      quality?: number;
      format?: 'jpeg' | 'png' | 'webp';
    } = {}
  ): string {
    const { width, height, quality = 0.8, format = 'jpeg' } = options;
    
    // Generate cache key
    const cacheKey = `${uri}-${width || 'auto'}-${height || 'auto'}-${quality}-${format}`;
    
    // Return cached version if available
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // For now, return original URI (in production, this would resize/optimize)
    let optimizedUri = uri;
    
    // Add resize parameters if supported by the image service
    if (width || height) {
      const separator = uri.includes('?') ? '&' : '?';
      const params = new URLSearchParams();
      
      if (width) params.append('w', width.toString());
      if (height) params.append('h', height.toString());
      params.append('q', Math.round(quality * 100).toString());
      params.append('f', format);
      
      optimizedUri = `${uri}${separator}${params.toString()}`;
    }

    // Cache the result
    this.addToCache(cacheKey, optimizedUri);
    
    return optimizedUri;
  }

  private static addToCache(key: string, value: string): void {
    // Implement LRU cache logic
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, value);
  }

  public static clearCache(): void {
    this.cache.clear();
  }

  public static getCacheSize(): number {
    return this.cache.size;
  }
}

// List optimization utilities
export class ListOptimizer {
  private static windowSize = 10;
  private static initialNumToRender = 5;

  public static getOptimizedListProps(itemCount: number) {
    // Adjust based on device performance and memory
    const isLowEndDevice = memoryManager.isInLowMemoryMode;
    
    return {
      windowSize: isLowEndDevice ? Math.max(this.windowSize - 5, 5) : this.windowSize,
      initialNumToRender: isLowEndDevice ? Math.max(this.initialNumToRender - 2, 2) : this.initialNumToRender,
      maxToRenderPerBatch: isLowEndDevice ? 3 : 5,
      updateCellsBatchingPeriod: isLowEndDevice ? 100 : 50,
      removeClippedSubviews: true,
      getItemLayout: itemCount < 100 ? undefined : this.createGetItemLayout(),
    };
  }

  private static createGetItemLayout() {
    return (data: any, index: number) => ({
      length: 60, // Assuming fixed item height
      offset: 60 * index,
      index,
    });
  }
}

// Animation optimization
export class AnimationOptimizer {
  private static isReducedMotion = false;

  public static setReducedMotion(isReduced: boolean): void {
    this.isReducedMotion = isReduced;
  }

  public static getOptimizedAnimationDuration(baseDuration: number): number {
    if (this.isReducedMotion) return 0;
    if (memoryManager.isInLowMemoryMode) return baseDuration * 0.5;
    return baseDuration;
  }

  public static shouldUseNativeDriver(): boolean {
    // Use native driver when possible for better performance
    return !memoryManager.isInLowMemoryMode;
  }

  public static getOptimizedAnimationConfig(baseConfig: any): any {
    return {
      ...baseConfig,
      duration: this.getOptimizedAnimationDuration(baseConfig.duration || 300),
      useNativeDriver: this.shouldUseNativeDriver(),
    };
  }
}

// Bundle splitting utilities
export class BundleSplitter {
  private static loadedBundles = new Set<string>();
  private static bundlePromises = new Map<string, Promise<any>>();

  public static async loadBundle(bundleName: string): Promise<void> {
    if (this.loadedBundles.has(bundleName)) {
      return; // Already loaded
    }

    if (this.bundlePromises.has(bundleName)) {
      return this.bundlePromises.get(bundleName)!; // Already loading
    }

    const loadPromise = this.performBundleLoad(bundleName);
    this.bundlePromises.set(bundleName, loadPromise);

    try {
      await loadPromise;
      this.loadedBundles.add(bundleName);
      this.bundlePromises.delete(bundleName);
    } catch (error) {
      this.bundlePromises.delete(bundleName);
      throw error;
    }
  }

  private static async performBundleLoad(bundleName: string): Promise<void> {
    const startTime = performance.now();
    
    try {
      // In a real implementation, this would load a JS bundle
      // For now, simulate bundle loading
      await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
      
      const loadTime = performance.now() - startTime;
      
      performanceMonitor.recordMetric({
        name: 'bundle_load_time',
        value: loadTime,
        tags: { bundleName },
      });

      console.log(`Bundle ${bundleName} loaded in ${loadTime.toFixed(2)}ms`);
    } catch (error) {
      performanceMonitor.recordError({
        name: `BundleLoadError_${bundleName}`,
        message: error instanceof Error ? error.message : 'Bundle load failed',
        stack: error instanceof Error ? error.stack || '' : '',
        timestamp: new Date(),
        context: { bundleName },
      });
      
      throw error;
    }
  }

  public static isLoaded(bundleName: string): boolean {
    return this.loadedBundles.has(bundleName);
  }

  public static getLoadedBundles(): string[] {
    return Array.from(this.loadedBundles);
  }
}

// Task scheduling utilities
export class TaskScheduler {
  private static taskQueue: Array<() => void> = [];
  private static isProcessing = false;

  public static scheduleTask(task: () => void, priority: 'high' | 'normal' | 'low' = 'normal'): void {
    switch (priority) {
      case 'high':
        // Execute immediately after current interaction
        InteractionManager.runAfterInteractions(task);
        break;
      
      case 'normal':
        this.taskQueue.push(task);
        this.processQueue();
        break;
      
      case 'low':
        // Execute when idle
        this.scheduleIdleTask(task);
        break;
    }
  }

  private static processQueue(): void {
    if (this.isProcessing || this.taskQueue.length === 0) return;

    this.isProcessing = true;
    
    InteractionManager.runAfterInteractions(() => {
      const task = this.taskQueue.shift();
      if (task) {
        try {
          task();
        } catch (error) {
          console.error('Task execution error:', error);
        }
      }
      
      this.isProcessing = false;
      
      // Process next task if available
      if (this.taskQueue.length > 0) {
        this.processQueue();
      }
    });
  }

  private static scheduleIdleTask(task: () => void): void {
    // Use requestIdleCallback if available, otherwise use setTimeout
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(() => {
        try {
          task();
        } catch (error) {
          console.error('Idle task execution error:', error);
        }
      });
    } else {
      setTimeout(() => {
        try {
          task();
        } catch (error) {
          console.error('Idle task execution error:', error);
        }
      }, 0);
    }
  }

  public static clearQueue(): void {
    this.taskQueue = [];
  }

  public static getQueueSize(): number {
    return this.taskQueue.length;
  }
}

// Network optimization
export class NetworkOptimizer {
  private static requestCache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private static maxCacheSize = 100;

  public static async optimizedFetch(
    url: string,
    options: RequestInit & { cacheTtl?: number } = {}
  ): Promise<Response> {
    const { cacheTtl = 5 * 60 * 1000, ...fetchOptions } = options; // Default 5 minutes TTL
    
    // Check cache for GET requests
    if (!fetchOptions.method || fetchOptions.method === 'GET') {
      const cached = this.getFromCache(url);
      if (cached) {
        return new Response(JSON.stringify(cached), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    const startTime = performance.now();
    
    try {
      const response = await fetch(url, fetchOptions);
      const requestTime = performance.now() - startTime;
      
      performanceMonitor.recordMetric({
        name: 'network_request_time',
        value: requestTime,
        tags: {
          method: fetchOptions.method || 'GET',
          status: response.status.toString(),
        },
      });

      // Cache successful GET responses
      if (response.ok && (!fetchOptions.method || fetchOptions.method === 'GET')) {
        const clonedResponse = response.clone();
        const data = await clonedResponse.json();
        this.addToCache(url, data, cacheTtl);
      }

      return response;
    } catch (error) {
      const requestTime = performance.now() - startTime;
      
      performanceMonitor.recordError({
        name: 'NetworkError',
        message: error instanceof Error ? error.message : 'Network request failed',
        stack: error instanceof Error ? error.stack || '' : '',
        timestamp: new Date(),
        context: {
          url,
          method: fetchOptions.method || 'GET',
          requestTime,
        },
      });
      
      throw error;
    }
  }

  private static getFromCache(key: string): any | null {
    const cached = this.requestCache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now > cached.timestamp + cached.ttl) {
      this.requestCache.delete(key);
      return null;
    }

    return cached.data;
  }

  private static addToCache(key: string, data: any, ttl: number): void {
    // Implement LRU cache
    if (this.requestCache.size >= this.maxCacheSize) {
      const firstKey = this.requestCache.keys().next().value;
      this.requestCache.delete(firstKey);
    }

    this.requestCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  public static clearCache(): void {
    this.requestCache.clear();
  }

  public static getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.requestCache.size,
      keys: Array.from(this.requestCache.keys()),
    };
  }
}

// Export all optimizers
export {
  MemoryManager,
  memoryManager,
  ImageOptimizer,
  ListOptimizer,
  AnimationOptimizer,
  BundleSplitter,
  TaskScheduler,
  NetworkOptimizer,
};

// Convenience function to initialize all optimizers
export function initializePerformanceOptimizations(): void {
  // Initialize memory manager
  memoryManager.addMemoryWarningListener(() => {
    console.log('Low memory detected - implementing optimizations');
    
    // Clear caches
    ImageOptimizer.clearCache();
    NetworkOptimizer.clearCache();
    
    // Force garbage collection
    memoryManager.forceGarbageCollection();
  });

  // Set up accessibility-aware animation optimization
  // This would typically be connected to the accessibility system
  AnimationOptimizer.setReducedMotion(false);

  console.log('Performance optimizations initialized');
}