// Removed unused import

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

class PerformanceOptimizationService {
  private cache = new Map<string, CacheEntry<any>>();
  private metrics: PerformanceMetrics = {
    cacheHits: 0,
    cacheMisses: 0,
    averageProcessingTime: 0,
    memoryUsage: 0,
  };

  private processingQueue: ProcessingQueue[] = [];
  private isProcessingQueue = false;

  // Default configurations
  private readonly DEFAULT_CACHE_CONFIG: CacheConfig = {
    maxSize: 1000,
    ttl: 5 * 60 * 1000, // 5 minutes
  };

  private readonly VIRTUALIZATION_CONFIG: VirtualizationConfig = {
    threshold: 100,
    windowSize: 50,
    bufferSize: 10,
  };

  private readonly CHUNK_SIZE = 50;
  private readonly DEBOUNCE_DELAY = 300; // ms
  private debounceTimers = new Map<string, NodeJS.Timeout>();

  /**
   * Generic caching mechanism with LRU-like behavior
   */
  async getCachedData<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    config: Partial<CacheConfig> = {}
  ): Promise<T> {
    const finalConfig = { ...this.DEFAULT_CACHE_CONFIG, ...config };
    const cachedEntry = this.cache.get(key);

    // Check if cache hit and not expired
    if (cachedEntry && this.isCacheEntryValid(cachedEntry, finalConfig.ttl)) {
      cachedEntry.hitCount++;
      this.metrics.cacheHits++;
      return cachedEntry.data as T;
    }

    // Cache miss - fetch new data
    this.metrics.cacheMisses++;
    const startTime = Date.now();
    
    try {
      const data = await fetchFunction();
      const processingTime = Date.now() - startTime;
      
      // Update metrics
      this.updateAverageProcessingTime(processingTime);
      
      // Store in cache
      this.setCacheEntry(key, data, finalConfig);
      
      return data;
    } catch (error) {
      console.error(`Error fetching data for key ${key}:`, error);
      
      // Return stale cache if available
      if (cachedEntry) {
        return cachedEntry.data as T;
      }
      
      throw error;
    }
  }

  /**
   * Processes large datasets in chunks to prevent UI blocking
   */
  async processInChunks<T, R>(
    data: T[],
    processor: (chunk: T[]) => Promise<R[]>,
    chunkSize: number = this.CHUNK_SIZE
  ): Promise<R[]> {
    if (data.length === 0) return [];
    
    const results: R[] = [];
    const chunks = this.createChunks(data, chunkSize);
    
    for (let i = 0; i < chunks.length; i++) {
      const chunkResult = await processor(chunks[i]);
      if (chunkResult) {
        results.push(...chunkResult);
      }
      
      // Allow other tasks to run between chunks
      if (i < chunks.length - 1) {
        await this.yieldToMainThread();
      }
    }
    
    return results;
  }

  /**
   * Debounced function execution
   */
  debounce<T extends (...args: any[]) => any>(
    key: string,
    func: T,
    delay: number = this.DEBOUNCE_DELAY
  ): (...args: Parameters<T>) => void {
    return (...args: Parameters<T>) => {
      // Clear existing timer
      const existingTimer = this.debounceTimers.get(key);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }
      
      // Set new timer
      const timer = setTimeout(() => {
        func(...args);
        this.debounceTimers.delete(key);
      }, delay);
      
      this.debounceTimers.set(key, timer);
    };
  }

  /**
   * Determines if a list should use virtualization
   */
  shouldUseVirtualization(itemCount: number): boolean {
    return itemCount >= this.VIRTUALIZATION_CONFIG.threshold;
  }

  /**
   * Gets virtualization configuration
   */
  getVirtualizationConfig(): VirtualizationConfig {
    return { ...this.VIRTUALIZATION_CONFIG };
  }

  /**
   * Calculates optimal window size based on viewport and item height
   */
  calculateOptimalWindowSize(
    viewportHeight: number,
    itemHeight: number,
    bufferMultiplier: number = 2
  ): number {
    const visibleItems = Math.ceil(viewportHeight / itemHeight);
    return visibleItems * bufferMultiplier;
  }

  /**
   * Priority queue for processing tasks
   */
  async queueTask(
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

      this.processingQueue.push(queueItem);
      this.sortQueueByPriority();
      
      if (!this.isProcessingQueue) {
        this.processQueue();
      }
    });
  }

  /**
   * Image preloading for meal photos
   */
  async preloadImages(imageUris: string[], maxConcurrent: number = 5): Promise<void> {
    const chunks = this.createChunks(imageUris, maxConcurrent);
    
    for (const chunk of chunks) {
      await Promise.allSettled(
        chunk.map(uri => this.preloadSingleImage(uri))
      );
    }
  }

  /**
   * Memory usage optimization - clears old cache entries
   */
  optimizeMemory(): void {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());
    
    // Sort by last access time (hitCount) and age
    entries.sort(([, a], [, b]) => {
      const scoreA = a.hitCount / Math.max(1, (now - a.timestamp) / 1000 / 60); // hits per minute
      const scoreB = b.hitCount / Math.max(1, (now - b.timestamp) / 1000 / 60);
      return scoreA - scoreB; // Ascending - worst performing first
    });

    // Remove oldest/least used entries if over limit
    const overLimit = entries.length - this.DEFAULT_CACHE_CONFIG.maxSize;
    if (overLimit > 0) {
      for (let i = 0; i < overLimit && i < entries.length; i++) {
        const entry = entries[i];
        if (entry) {
          this.cache.delete(entry[0]);
        }
      }
    }

    // Update memory usage metric
    this.updateMemoryUsage();
  }

  /**
   * Batch update mechanism to reduce re-renders
   */
  createBatchUpdater<T>(
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

  /**
   * Gets current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Resets performance metrics
   */
  resetMetrics(): void {
    this.metrics = {
      cacheHits: 0,
      cacheMisses: 0,
      averageProcessingTime: 0,
      memoryUsage: 0,
    };
  }

  /**
   * Clears all caches and optimizes memory
   */
  clearAllCaches(): void {
    this.cache.clear();
    this.metrics.cacheHits = 0;
    this.metrics.cacheMisses = 0;
    this.updateMemoryUsage();
  }

  // Private helper methods

  private isCacheEntryValid(entry: CacheEntry<any>, ttl: number): boolean {
    return Date.now() - entry.timestamp < ttl;
  }

  private setCacheEntry<T>(key: string, data: T, config: CacheConfig): void {
    // Check if we need to make room
    if (this.cache.size >= config.maxSize) {
      this.optimizeMemory();
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      hitCount: 0,
    };

    this.cache.set(key, entry);
    this.updateMemoryUsage();
  }

  private createChunks<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  private async yieldToMainThread(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 0));
  }

  private sortQueueByPriority(): void {
    this.processingQueue.sort((a, b) => b.priority - a.priority);
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue) return;
    
    this.isProcessingQueue = true;
    
    while (this.processingQueue.length > 0) {
      const task = this.processingQueue.shift();
      if (task) {
        try {
          await task.task();
        } catch (error) {
          console.error(`Error processing queued task ${task.id}:`, error);
        }
      }
      
      // Yield between tasks
      await this.yieldToMainThread();
    }
    
    this.isProcessingQueue = false;
  }

  private async preloadSingleImage(uri: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => reject(new Error(`Failed to load image: ${uri}`));
      img.src = uri;
    });
  }

  private updateAverageProcessingTime(newTime: number): void {
    const totalRequests = this.metrics.cacheHits + this.metrics.cacheMisses;
    const currentTotal = this.metrics.averageProcessingTime * (totalRequests - 1);
    this.metrics.averageProcessingTime = (currentTotal + newTime) / totalRequests;
  }

  private updateMemoryUsage(): void {
    // Estimate memory usage based on cache size
    // This is a rough estimate - in a real app you might use more sophisticated memory monitoring
    this.metrics.memoryUsage = this.cache.size * 1024; // Assume 1KB per cache entry average
  }

  /**
   * Cleanup method to be called when the service is no longer needed
   */
  cleanup(): void {
    // Clear all timers
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();
    
    // Clear caches
    this.clearAllCaches();
    
    // Clear queue
    this.processingQueue = [];
    this.isProcessingQueue = false;
  }
}

export const performanceOptimizationService = new PerformanceOptimizationService();
export default PerformanceOptimizationService;