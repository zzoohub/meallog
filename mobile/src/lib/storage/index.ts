import AsyncStorage from '@react-native-async-storage/async-storage';

export interface StorageItem<T = any> {
  key: string;
  value: T;
}

/**
 * Optimized AsyncStorage service with batching and error handling
 */
export class OptimizedStorage {
  private static instance: OptimizedStorage;
  private batchQueue: Map<string, any> = new Map();
  private batchTimeout: NodeJS.Timeout | null = null;
  private readonly BATCH_DELAY = 100; // milliseconds

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
  async setItem<T>(key: string, value: T): Promise<void> {
    try {
      // Add to batch queue
      this.batchQueue.set(key, JSON.stringify(value));
      
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
      }
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
    await this.processBatch();
  }

  /**
   * Process batched operations
   */
  private async processBatch(): Promise<void> {
    if (this.batchQueue.size === 0) {
      return;
    }

    try {
      const pairs: Array<[string, string]> = Array.from(this.batchQueue.entries());
      await AsyncStorage.multiSet(pairs);
      this.batchQueue.clear();
    } catch (error) {
      console.error('Failed to process batch operations:', error);
      // Don't clear the queue on error, allow retry
    }

    this.batchTimeout = null;
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