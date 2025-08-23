import AsyncStorage from '@react-native-async-storage/async-storage';

export interface StorageItem<T = any> {
  key: string;
  value: T;
}

export interface StorageOptions {
  debounceDelay?: number;
  enableBatching?: boolean;
}

/**
 * Optimized AsyncStorage service with batching and error handling
 */
export class OptimizedStorage {
  private static instance: OptimizedStorage;
  private batchQueue: Map<string, any> = new Map();
  private batchTimeout: NodeJS.Timeout | null = null;
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private readonly BATCH_DELAY = 100; // milliseconds
  private readonly DEFAULT_DEBOUNCE_DELAY = 500; // milliseconds
  private isProcessing = false;

  private constructor() {}

  static getInstance(): OptimizedStorage {
    if (!OptimizedStorage.instance) {
      OptimizedStorage.instance = new OptimizedStorage();
    }
    return OptimizedStorage.instance;
  }

  /**
   * Set a single item with batching optimization
   */
  async setItem<T>(key: string, value: T, options?: StorageOptions): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value);
      
      if (options?.debounceDelay) {
        // Use debounced storage for this specific item
        return this.setItemDebounced(key, serializedValue, options.debounceDelay);
      }
      
      // Add to batch queue
      this.batchQueue.set(key, serializedValue);
      
      // Clear existing timeout
      if (this.batchTimeout) {
        clearTimeout(this.batchTimeout);
      }
      
      // Set new timeout for batch processing
      this.batchTimeout = setTimeout(() => {
        this.processBatch();
      }, this.BATCH_DELAY);
      
    } catch (error) {
      console.error(`Failed to queue item for key: ${key}`, error);
      throw error;
    }
  }

  /**
   * Set item with debouncing
   */
  private async setItemDebounced(key: string, value: string, debounceDelay: number): Promise<void> {
    // Clear existing debounce timer for this key
    const existingTimer = this.debounceTimers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Add to batch queue
    this.batchQueue.set(key, value);

    // Set new debounce timer
    const timer = setTimeout(() => {
      this.debounceTimers.delete(key);
      this.processSingleItem(key, value);
    }, debounceDelay);

    this.debounceTimers.set(key, timer);
  }

  /**
   * Process a single item immediately
   */
  private async processSingleItem(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value);
      this.batchQueue.delete(key);
    } catch (error) {
      console.error(`Failed to save ${key}:`, error);
      throw error;
    }
  }

  /**
   * Get a single item with type safety and error handling
   */
  async getItem<T>(key: string, defaultValue?: T): Promise<T | null> {
    try {
      const value = await AsyncStorage.getItem(key);
      if (value === null) {
        return defaultValue ?? null;
      }
      return JSON.parse(value) as T;
    } catch (error) {
      console.error(`Failed to get item for key: ${key}`, error);
      return defaultValue ?? null;
    }
  }

  /**
   * Set multiple items efficiently
   */
  async setMultiple<T>(items: StorageItem<T>[]): Promise<void> {
    try {
      const pairs: Array<[string, string]> = items.map(({ key, value }) => [
        key,
        JSON.stringify(value),
      ]);
      await AsyncStorage.multiSet(pairs);
    } catch (error) {
      console.error('Failed to set multiple items:', error);
      throw error;
    }
  }

  /**
   * Get multiple items efficiently
   */
  async getMultiple<T>(keys: string[]): Promise<Array<StorageItem<T | null>>> {
    try {
      const result = await AsyncStorage.multiGet(keys);
      return result.map(([key, value]) => ({
        key,
        value: value ? JSON.parse(value) : null,
      }));
    } catch (error) {
      console.error('Failed to get multiple items:', error);
      throw error;
    }
  }

  /**
   * Remove a single item
   */
  async removeItem(key: string): Promise<void> {
    try {
      // Remove from batch queue if it exists
      this.batchQueue.delete(key);
      
      // Clear any pending debounce timer
      const timer = this.debounceTimers.get(key);
      if (timer) {
        clearTimeout(timer);
        this.debounceTimers.delete(key);
      }
      
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Failed to remove item for key: ${key}`, error);
      throw error;
    }
  }

  /**
   * Remove multiple items efficiently
   */
  async removeMultiple(keys: string[]): Promise<void> {
    try {
      // Remove from batch queue
      keys.forEach(key => this.batchQueue.delete(key));
      await AsyncStorage.multiRemove(keys);
    } catch (error) {
      console.error('Failed to remove multiple items:', error);
      throw error;
    }
  }

  /**
   * Clear all storage
   */
  async clear(): Promise<void> {
    try {
      this.batchQueue.clear();
      
      if (this.batchTimeout) {
        clearTimeout(this.batchTimeout);
        this.batchTimeout = null;
      }
      
      // Clear all debounce timers
      this.debounceTimers.forEach(timer => clearTimeout(timer));
      this.debounceTimers.clear();
      
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Failed to clear storage:', error);
      throw error;
    }
  }

  /**
   * Get all keys
   */
  async getAllKeys(): Promise<string[]> {
    try {
      return await AsyncStorage.getAllKeys();
    } catch (error) {
      console.error('Failed to get all keys:', error);
      throw error;
    }
  }

  /**
   * Get storage usage information
   */
  async getStorageInfo(): Promise<{
    totalKeys: number;
    estimatedSize: number;
  }> {
    try {
      const keys = await this.getAllKeys();
      const items = await this.getMultiple(keys);
      
      const totalSize = items.reduce((acc, { value }) => {
        return acc + (JSON.stringify(value)?.length || 0);
      }, 0);

      return {
        totalKeys: keys.length,
        estimatedSize: totalSize,
      };
    } catch (error) {
      console.error('Failed to get storage info:', error);
      throw error;
    }
  }

  /**
   * Flush pending batch operations immediately
   */
  async flush(): Promise<void> {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
    
    // Clear all debounce timers and process immediately
    const debouncedItems = new Map<string, string>();
    this.debounceTimers.forEach((timer, key) => {
      clearTimeout(timer);
      const value = this.batchQueue.get(key);
      if (value) {
        debouncedItems.set(key, value);
      }
    });
    this.debounceTimers.clear();
    
    await this.processBatch();
  }

  /**
   * Process batched operations
   */
  private async processBatch(): Promise<void> {
    if (this.isProcessing || this.batchQueue.size === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      const pairs: Array<[string, string]> = Array.from(this.batchQueue.entries());
      await AsyncStorage.multiSet(pairs);
      this.batchQueue.clear();
    } catch (error) {
      console.error('Failed to process batch operations:', error);
      // Don't clear the queue on error, allow retry
    } finally {
      this.isProcessing = false;
    }

    this.batchTimeout = null;
  }

  /**
   * Create a debounced setter for a specific key
   */
  createDebouncedSetter<T>(key: string, debounceDelay: number = this.DEFAULT_DEBOUNCE_DELAY) {
    return (value: T) => this.setItem(key, value, { debounceDelay });
  }
}

// Export singleton instance
export const optimizedStorage = OptimizedStorage.getInstance();

// Export convenience functions
export const {
  setItem,
  getItem,
  setMultiple,
  getMultiple,
  removeItem,
  removeMultiple,
  clear,
  getAllKeys,
  getStorageInfo,
  flush,
} = optimizedStorage;