import { useState, useEffect, useCallback, useRef } from "react";

// Network connection state management
const networkState = {
  isConnected: true,
  listeners: new Set<(isConnected: boolean) => void>(),
};

// Initialize network state (in a real implementation, use @react-native-community/netinfo)
const initializeNetwork = () => {
  // For now, we'll assume always connected
  // In a real implementation, you'd use @react-native-community/netinfo
  // or check connectivity with actual network requests
  networkState.isConnected = true;
};

// Network utility functions
export const networkUtils = {
  getIsConnected: (): boolean => {
    return networkState.isConnected;
  },

  waitForConnection: async (timeout: number = 10000): Promise<boolean> => {
    if (networkState.isConnected) {
      return true;
    }

    return new Promise(resolve => {
      const timeoutId = setTimeout(() => {
        cleanup();
        resolve(false);
      }, timeout);

      const listener = (isConnected: boolean) => {
        if (isConnected) {
          cleanup();
          resolve(true);
        }
      };

      const cleanup = () => {
        clearTimeout(timeoutId);
        networkState.listeners.delete(listener);
      };

      networkState.listeners.add(listener);
    });
  },

  addListener: (listener: (isConnected: boolean) => void) => {
    networkState.listeners.add(listener);
  },

  removeListener: (listener: (isConnected: boolean) => void) => {
    networkState.listeners.delete(listener);
  },

  retryWithBackoff: async <T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000,
  ): Promise<T> => {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Wait for connection if offline
        if (!networkState.isConnected) {
          const connected = await networkUtils.waitForConnection(5000);
          if (!connected) {
            throw new Error("No internet connection");
          }
        }

        return await operation();
      } catch (error) {
        lastError = error as Error;

        // Don't retry on final attempt
        if (attempt === maxRetries) {
          break;
        }

        // Calculate backoff delay (exponential with jitter)
        const delay = baseDelay * Math.pow(2, attempt);
        const jitter = Math.random() * 0.1 * delay;
        const totalDelay = delay + jitter;

        await new Promise(resolve => setTimeout(resolve, totalDelay));
      }
    }

    throw lastError!;
  },
};

// Custom hook for network connectivity state
export const useNetworkConnection = () => {
  const [isConnected, setIsConnected] = useState(() => networkUtils.getIsConnected());
  const listenerRef = useRef<((isConnected: boolean) => void) | null>(null);

  useEffect(() => {
    // Initialize network if not already done
    if (!networkState.listeners.size) {
      initializeNetwork();
    }

    // Create listener function
    const listener = (connected: boolean) => {
      setIsConnected(connected);
    };

    listenerRef.current = listener;
    networkUtils.addListener(listener);

    // Update initial state
    setIsConnected(networkUtils.getIsConnected());

    return () => {
      if (listenerRef.current) {
        networkUtils.removeListener(listenerRef.current);
      }
    };
  }, []);

  const waitForConnection = useCallback((timeout?: number) => networkUtils.waitForConnection(timeout), []);

  const retryWithBackoff = useCallback(
    <T>(operation: () => Promise<T>, maxRetries?: number, baseDelay?: number) =>
      networkUtils.retryWithBackoff(operation, maxRetries, baseDelay),
    [],
  );

  return {
    isConnected,
    waitForConnection,
    retryWithBackoff,
  };
};
