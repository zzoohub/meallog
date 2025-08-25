import AsyncStorage from '@react-native-async-storage/async-storage';
import { StorageItem, StorageOptions, StorageInfo, STORAGE_CONSTANTS } from './types';

// Global state for batch and debounce operations
const batchQueue = new Map<string, string>();
let batchTimeout: NodeJS.Timeout | null = null;
let isProcessing = false;
const debounceTimers = new Map<string, NodeJS.Timeout>();

// Core storage operations
export async function getItem<T>(key: string, defaultValue?: T): Promise<T | null> {
  try {
    const value = await AsyncStorage.getItem(key);
    if (value === null) {
      return defaultValue ?? null;
    }
    return JSON.parse(value) as T;
  } catch (error) {
    // Only log actual errors, not missing keys (which return null)
    if (error instanceof SyntaxError) {
      console.warn(`Failed to parse stored value for key: ${key}`, error);
    } else {
      console.error(`Failed to get item for key: ${key}`, error);
    }
    return defaultValue ?? null;
  }
}

export async function setItemImmediate<T>(key: string, value: T): Promise<void> {
  try {
    const serializedValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, serializedValue);
  } catch (error) {
    console.error(`Failed to set item for key: ${key}`, error);
    throw error;
  }
}

export async function removeItem(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error(`Failed to remove item for key: ${key}`, error);
    throw error;
  }
}

export async function clear(): Promise<void> {
  try {
    await AsyncStorage.clear();
  } catch (error) {
    console.error('Failed to clear storage:', error);
    throw error;
  }
}

export async function getAllKeys(): Promise<readonly string[]> {
  try {
    return await AsyncStorage.getAllKeys();
  } catch (error) {
    console.error('Failed to get all keys:', error);
    throw error;
  }
}

// Multi-item operations
export async function setMultiple<T>(items: StorageItem<T>[]): Promise<void> {
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

export async function getMultiple<T>(keys: string[]): Promise<Array<StorageItem<T | null>>> {
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

export async function removeMultiple(keys: string[]): Promise<void> {
  try {
    await AsyncStorage.multiRemove(keys);
  } catch (error) {
    console.error('Failed to remove multiple items:', error);
    throw error;
  }
}

// Batch operations
export function addToBatch(key: string, value: string): void {
  batchQueue.set(key, value);
  
  if (batchTimeout) {
    clearTimeout(batchTimeout);
  }
  
  batchTimeout = setTimeout(() => {
    processBatch();
  }, STORAGE_CONSTANTS.BATCH_DELAY);
}

export function removeFromBatch(key: string): void {
  batchQueue.delete(key);
}

async function processBatch(): Promise<void> {
  if (isProcessing || batchQueue.size === 0) {
    return;
  }

  isProcessing = true;

  try {
    const items = Array.from(batchQueue.entries()).map(([key, value]) => ({
      key,
      value: JSON.parse(value),
    }));
    
    await setMultiple(items);
    batchQueue.clear();
  } catch (error) {
    console.error('Failed to process batch operations:', error);
  } finally {
    isProcessing = false;
  }

  batchTimeout = null;
}

export async function flushBatch(): Promise<void> {
  if (batchTimeout) {
    clearTimeout(batchTimeout);
    batchTimeout = null;
  }
  
  await processBatch();
}

// Debounced operations
export function setItemDebounced<T>(
  key: string, 
  value: T, 
  debounceDelay: number = STORAGE_CONSTANTS.DEFAULT_DEBOUNCE_DELAY
): void {
  const existingTimer = debounceTimers.get(key);
  if (existingTimer) {
    clearTimeout(existingTimer);
  }

  const serializedValue = JSON.stringify(value);
  addToBatch(key, serializedValue);

  const timer = setTimeout(async () => {
    debounceTimers.delete(key);
    try {
      await setItemImmediate(key, value);
    } catch (error) {
      console.error(`Failed to save debounced item ${key}:`, error);
    }
  }, debounceDelay);

  debounceTimers.set(key, timer);
}

export function clearDebounceTimer(key: string): void {
  const timer = debounceTimers.get(key);
  if (timer) {
    clearTimeout(timer);
    debounceTimers.delete(key);
  }
}

export function clearAllDebounceTimers(): void {
  debounceTimers.forEach(timer => clearTimeout(timer));
  debounceTimers.clear();
}

// Non-hook function for creating debounced setters (for use outside React components)
export function createDebouncedSetter<T>(
  key: string, 
  debounceDelay: number = STORAGE_CONSTANTS.DEFAULT_DEBOUNCE_DELAY
) {
  return (value: T) => setItemDebounced(key, value, debounceDelay);
}

// Main storage interface
export async function setItem<T>(key: string, value: T, options?: StorageOptions): Promise<void> {
  try {
    if (options?.debounceDelay) {
      setItemDebounced(key, value, options.debounceDelay);
      return;
    }

    if (options?.enableBatching !== false) {
      const serializedValue = JSON.stringify(value);
      addToBatch(key, serializedValue);
      return;
    }

    await setItemImmediate(key, value);
  } catch (error) {
    console.error(`Failed to set item for key: ${key}`, error);
    throw error;
  }
}

export async function removeItemWithCleanup(key: string): Promise<void> {
  try {
    removeFromBatch(key);
    clearDebounceTimer(key);
    await removeItem(key);
  } catch (error) {
    console.error(`Failed to remove item for key: ${key}`, error);
    throw error;
  }
}

// Storage utilities
export async function getStorageInfo(): Promise<StorageInfo> {
  try {
    const keys = await getAllKeys();
    const items = await getMultiple([...keys]);
    
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

// Storage object for easy access
export const storage = {
  get: getItem,
  set: setItem,
  remove: removeItemWithCleanup,
  clear,
  getAllKeys,
  setMultiple,
  getMultiple,
  removeMultiple,
  flush: flushBatch,
  getInfo: getStorageInfo,
};