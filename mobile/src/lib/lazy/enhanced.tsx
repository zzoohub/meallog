import React, { 
  Suspense, 
  ComponentType, 
  LazyExoticComponent, 
  useState, 
  useEffect,
  useTransition,
  startTransition,
  useCallback,
  ReactNode,
} from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useTheme } from '@/lib/theme';

// Track component loading states globally
class ComponentLoadTracker {
  private static instance: ComponentLoadTracker;
  private loadingStates: Map<string, 'loading' | 'loaded' | 'error'> = new Map();
  private listeners: Map<string, Set<() => void>> = new Map();

  static getInstance(): ComponentLoadTracker {
    if (!ComponentLoadTracker.instance) {
      ComponentLoadTracker.instance = new ComponentLoadTracker();
    }
    return ComponentLoadTracker.instance;
  }

  setLoadingState(componentName: string, state: 'loading' | 'loaded' | 'error') {
    this.loadingStates.set(componentName, state);
    this.notifyListeners(componentName);
  }

  getLoadingState(componentName: string): 'loading' | 'loaded' | 'error' | undefined {
    return this.loadingStates.get(componentName);
  }

  subscribe(componentName: string, listener: () => void) {
    if (!this.listeners.has(componentName)) {
      this.listeners.set(componentName, new Set());
    }
    this.listeners.get(componentName)!.add(listener);
    
    return () => {
      this.listeners.get(componentName)?.delete(listener);
    };
  }

  private notifyListeners(componentName: string) {
    this.listeners.get(componentName)?.forEach(listener => listener());
  }
}

const tracker = ComponentLoadTracker.getInstance();

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

// Enhanced error boundary for lazy components
class LazyErrorBoundary extends React.Component<
  { children: ReactNode; fallback?: ComponentType<{ error: Error; retry: () => void }> },
  ErrorBoundaryState
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Lazy component error:', error, errorInfo);
  }

  retry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error!} retry={this.retry} />;
    }

    return this.props.children;
  }
}

// Default error fallback component
const DefaultErrorFallback: ComponentType<{ error: Error; retry: () => void }> = ({ error, retry }) => {
  const { theme } = useTheme();
  
  return (
    <View style={[styles.errorContainer, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.errorText, { color: theme.colors.error }]}>
        Failed to load component
      </Text>
      <Text style={[styles.errorDetails, { color: theme.colors.textSecondary }]}>
        {error.message}
      </Text>
      <Text onPress={retry} style={[styles.retryButton, { color: theme.colors.primary }]}>
        Tap to retry
      </Text>
    </View>
  );
};

// Enhanced loading component with progress
interface LoadingComponentProps {
  componentName?: string;
  showProgress?: boolean;
}

const EnhancedLoadingComponent: ComponentType<LoadingComponentProps> = ({ 
  componentName, 
  showProgress = false 
}) => {
  const { theme } = useTheme();
  const [loadingTime, setLoadingTime] = useState(0);

  useEffect(() => {
    if (!showProgress) return;

    const interval = setInterval(() => {
      setLoadingTime(prev => prev + 100);
    }, 100);

    return () => clearInterval(interval);
  }, [showProgress]);

  return (
    <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      {showProgress && loadingTime > 500 && (
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
          Loading {componentName || 'component'}...
        </Text>
      )}
    </View>
  );
};

// Create enhanced lazy component with all optimizations
export function createEnhancedLazyComponent<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  options?: {
    componentName?: string;
    LoadingComponent?: ComponentType<LoadingComponentProps>;
    ErrorComponent?: ComponentType<{ error: Error; retry: () => void }>;
    preload?: boolean;
    showProgress?: boolean;
  }
): ComponentType<P> {
  const {
    componentName = 'Component',
    LoadingComponent = EnhancedLoadingComponent,
    ErrorComponent,
    preload = false,
    showProgress = false,
  } = options || {};

  // Track loading state
  const trackedImportFn = async () => {
    tracker.setLoadingState(componentName, 'loading');
    try {
      const module = await importFn();
      tracker.setLoadingState(componentName, 'loaded');
      return module;
    } catch (error) {
      tracker.setLoadingState(componentName, 'error');
      throw error;
    }
  };

  const LazyComponent = React.lazy(trackedImportFn);

  // Preload if requested
  if (preload) {
    trackedImportFn().catch(console.warn);
  }

  return function EnhancedLazyWrapper(props: P) {
    const [isPending, startTransition] = useTransition();

    return (
      <LazyErrorBoundary fallback={ErrorComponent}>
        <Suspense 
          fallback={
            <LoadingComponent 
              componentName={componentName} 
              showProgress={showProgress || isPending} 
            />
          }
        >
          <LazyComponent {...props} />
        </Suspense>
      </LazyErrorBoundary>
    );
  };
}

// Hook to preload multiple components
export function usePreloadComponents(
  components: Array<{
    name: string;
    importFn: () => Promise<any>;
    priority?: 'high' | 'normal' | 'low';
  }>
) {
  useEffect(() => {
    const sortedComponents = [...components].sort((a, b) => {
      const priorityOrder = { high: 0, normal: 1, low: 2 };
      return (priorityOrder[a.priority || 'normal'] - priorityOrder[b.priority || 'normal']);
    });

    const preloadWithDelay = async () => {
      for (const component of sortedComponents) {
        tracker.setLoadingState(component.name, 'loading');
        
        try {
          await component.importFn();
          tracker.setLoadingState(component.name, 'loaded');
        } catch (error) {
          tracker.setLoadingState(component.name, 'error');
          console.warn(`Failed to preload ${component.name}:`, error);
        }

        // Small delay between preloads to keep UI responsive
        if (component.priority !== 'high') {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }
    };

    // Start preloading after a delay to not block initial render
    const timeoutId = setTimeout(() => {
      startTransition(() => {
        preloadWithDelay();
      });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, []);
}

// Hook to check if a component is loaded
export function useComponentLoadState(componentName: string) {
  const [loadState, setLoadState] = useState<'loading' | 'loaded' | 'error' | undefined>(
    tracker.getLoadingState(componentName)
  );

  useEffect(() => {
    const unsubscribe = tracker.subscribe(componentName, () => {
      setLoadState(tracker.getLoadingState(componentName));
    });

    return unsubscribe;
  }, [componentName]);

  return loadState;
}

// Utility to create a bundle of lazy components
export function createLazyBundle<T extends Record<string, () => Promise<{ default: ComponentType<any> }>>>(
  imports: T,
  options?: {
    preloadAll?: boolean;
    showProgress?: boolean;
  }
): { [K in keyof T]: ComponentType<any> } {
  const bundle: any = {};

  for (const [name, importFn] of Object.entries(imports)) {
    bundle[name] = createEnhancedLazyComponent(importFn, {
      componentName: name,
      preload: options?.preloadAll,
      showProgress: options?.showProgress,
    });
  }

  return bundle;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  errorDetails: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    fontSize: 16,
    fontWeight: '500',
    padding: 10,
  },
});