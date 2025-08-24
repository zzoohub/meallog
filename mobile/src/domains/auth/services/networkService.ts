class NetworkService {
  private isConnected: boolean = true;
  private listeners: Array<(isConnected: boolean) => void> = [];

  constructor() {
    this.init();
  }

  private init() {
    // For now, we'll assume always connected
    // In a real implementation, you'd use @react-native-community/netinfo
    // or check connectivity with actual network requests
    this.isConnected = true;
  }

  public getIsConnected(): boolean {
    return this.isConnected;
  }

  public async waitForConnection(timeout: number = 10000): Promise<boolean> {
    if (this.isConnected) {
      return true;
    }

    return new Promise((resolve) => {
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
        this.removeListener(listener);
      };

      this.addListener(listener);
    });
  }

  public addListener(listener: (isConnected: boolean) => void) {
    this.listeners.push(listener);
  }

  public removeListener(listener: (isConnected: boolean) => void) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  public async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Wait for connection if offline
        if (!this.isConnected) {
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

        // Calculate backoff delay (exponential with jitter)
        const delay = baseDelay * Math.pow(2, attempt);
        const jitter = Math.random() * 0.1 * delay;
        const totalDelay = delay + jitter;

        await new Promise(resolve => setTimeout(resolve, totalDelay));
      }
    }

    throw lastError!;
  }
}

export const networkService = new NetworkService();