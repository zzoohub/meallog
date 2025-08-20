import AsyncStorage from '@react-native-async-storage/async-storage';

interface BatchedOperation {
  key: string;
  value: string;
  timestamp: number;
}

class DebouncedStorageManager {
  private batchQueue = new Map<string, BatchedOperation>();
  private debounceTimer: NodeJS.Timeout | null = null;
  private readonly debounceDelay: number;
  private isProcessing = false;

  constructor(debounceDelay = 500) {
    this.debounceDelay = debounceDelay;
  }

  async setItem<T>(key: string, value: T): Promise<void> {
    const serializedValue = JSON.stringify(value);
    const operation: BatchedOperation = {
      key,
      value: serializedValue,
      timestamp: Date.now(),
    };

    this.batchQueue.set(key, operation);

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.processBatch();
    }, this.debounceDelay);
  }

  private async processBatch(): Promise<void> {
    if (this.isProcessing || this.batchQueue.size === 0) {
      return;
    }

    this.isProcessing = true;
    const operations = Array.from(this.batchQueue.values());
    this.batchQueue.clear();

    try {
      const promises = operations.map(op =>
        AsyncStorage.setItem(op.key, op.value)
          .catch(error => {
            console.error(`Failed to save ${op.key}:`, error);
            throw error;
          })
      );

      await Promise.allSettled(promises);
    } catch (error) {
      console.error('Batch storage operation failed:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  async flush(): Promise<void> {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    await this.processBatch();
  }

  clear(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    this.batchQueue.clear();
  }
}

export const debouncedStorage = new DebouncedStorageManager(500);

export const createDebouncedSetter = <T>(key: string) => {
  return (value: T) => debouncedStorage.setItem(key, value);
};