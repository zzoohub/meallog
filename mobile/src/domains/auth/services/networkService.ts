// NetInfo removed for simplification

interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string;
}

class NetworkService {
  private networkState: NetworkState = {
    isConnected: true,
    isInternetReachable: null,
    type: 'unknown'
  };
  private listeners: Array<(state: NetworkState) => void> = [];
  private unsubscribe?: () => void;

  constructor() {
    this.init();
  }

  private init() {
    // Simplified network monitoring - assume connected by default
    // Advanced network state detection removed for app simplification
    this.networkState = {
      isConnected: true,
      isInternetReachable: true,
      type: 'wifi'
    };
    
    // Notify listeners of initial state
    this.notifyListeners(this.networkState);
  }

  private notifyListeners(state: NetworkState) {
    this.listeners.forEach(listener => {
      try {
        listener(state);
      } catch (error) {
        console.error('Network listener error:', error);
      }
    });
  }

  // Cleanup method
  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = undefined;
    }
    this.listeners = [];
  }

  public getIsConnected(): boolean {
    return this.networkState.isConnected;
  }

  public getNetworkState(): NetworkState {
    return { ...this.networkState };
  }

  public isOnWifi(): boolean {
    return this.networkState.type === 'wifi';
  }

  public isOnCellular(): boolean {
    return this.networkState.type === 'cellular';
  }

  public async waitForConnection(timeout: number = 10000): Promise<boolean> {
    if (this.networkState.isConnected) {
      return true;
    }

    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        cleanup();
        resolve(false);
      }, timeout);

      const listener = (state: NetworkState) => {
        if (state.isConnected) {
          cleanup();
          resolve(true);
        }
      };

      const cleanup = () => {
        clearTimeout(timeoutId);
        this.removeListener(listener);
      };

      this.addListener(listener);
    });
  }

  public addListener(listener: (state: NetworkState) => void) {
    this.listeners.push(listener);
    // Immediately call with current state
    listener(this.networkState);
  }

  public removeListener(listener: (state: NetworkState) => void) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  public async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000,
    shouldRetry?: (error: Error) => boolean
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Wait for connection if offline
        if (!this.networkState.isConnected) {
          const connected = await this.waitForConnection(5000);
          if (!connected) {
            throw new Error('No internet connection');
          }
        }

        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on final attempt
        if (attempt === maxRetries) {
          break;
        }

        // Check if we should retry this specific error
        if (shouldRetry && !shouldRetry(lastError)) {
          break;
        }

        // Don't retry on certain error types
        if (this.isNonRetryableError(lastError)) {
          break;
        }

        // Calculate backoff delay (exponential with jitter)
        const delay = baseDelay * Math.pow(2, attempt);
        const jitter = Math.random() * 0.1 * delay;
        const totalDelay = delay + jitter;

        console.log(`Retrying operation in ${Math.round(totalDelay)}ms (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, totalDelay));
      }
    }

    throw lastError!;
  }

  // Check if error should not be retried
  private isNonRetryableError(error: Error): boolean {
    const nonRetryablePatterns = [
      /authentication/i,
      /authorization/i,
      /forbidden/i,
      /not found/i,
      /bad request/i,
      /invalid/i
    ];
    
    return nonRetryablePatterns.some(pattern => pattern.test(error.message));
  }

  // Perform a simple connectivity test
  public async testConnectivity(testUrl: string = 'https://www.google.com'): Promise<boolean> {
    try {
      const response = await fetch(testUrl, {
        method: 'HEAD',
        cache: 'no-cache'
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}

export const networkService = new NetworkService();

// Export types for use in other modules
export type { NetworkState };

// Cleanup on app termination (for testing environments)
if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
  process.on('exit', () => {
    networkService.destroy();
  });
}