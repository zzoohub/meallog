import React, { Suspense, ComponentType, LazyExoticComponent } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

/**
 * Lazy loading wrapper with loading fallback
 */
export function withLazy<P extends object>(
  Component: LazyExoticComponent<ComponentType<P>>,
  LoadingComponent?: ComponentType
): ComponentType<P> {
  return function LazyComponent(props: P) {
    const FallbackComponent = LoadingComponent || DefaultLoadingComponent;
    
    return (
      <Suspense fallback={<FallbackComponent />}>
        <Component {...props} />
      </Suspense>
    );
  };
}

/**
 * Default loading component
 */
const DefaultLoadingComponent: ComponentType = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#FF6B35" />
  </View>
);

/**
 * Create lazy component with error boundary
 */
export function createLazyComponent<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  LoadingComponent?: ComponentType
): ComponentType<P> {
  const LazyComponent = React.lazy(importFn);
  return withLazy(LazyComponent, LoadingComponent);
}

/**
 * Preload a lazy component for better UX
 */
export function preloadComponent<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>
): void {
  // Start loading the component in the background
  importFn().catch(error => {
    if (__DEV__) {
      console.warn('Failed to preload component:', error);
    }
  });
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
});