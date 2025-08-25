// ============================================================================
// TYPES & CONFIGURATION
// ============================================================================
export type {
  CacheConfig,
  CacheEntry,
  PerformanceMetrics,
  VirtualizationConfig,
  ProcessingQueue,
  PerformanceMetric,
  NavigationMetric,
  DomainModules,
  PreloadStrategy,
  PrefetchQuery,
} from './types';

export {
  DEFAULT_CACHE_CONFIG,
  VIRTUALIZATION_CONFIG,
  CHUNK_SIZE,
  DEBOUNCE_DELAY,
  DOMAIN_IMPORT_MAP,
} from './types';

// ============================================================================
// REACT QUERY & PREFETCH
// ============================================================================
export {
  queryClient,
  prefetchData,
  prefetchBatch,
} from './query';

// ============================================================================
// RUNTIME: CACHE & MONITORING
// ============================================================================
export {
  // Cache functions
  getCachedData,
  clearAllCaches,
  getCacheMetrics,
  // Performance monitoring
  markPerformance,
  measurePerformance,
  startNavigation,
  endNavigation,
  trackComponentRender,
  trackAPICall,
  getPerformanceSummary,
  clearPerformanceMetrics,
  logPerformanceReport,
  measureAsync,
  measureInteraction,
} from './runtime';

// ============================================================================
// BUNDLING: LAZY LOADING & BUNDLE MANAGEMENT
// ============================================================================
export {
  // Bundle management
  importDomain,
  preloadCriticalModules,
  getLoadedModulesCount,
  isModuleLoaded,
  importDomainMap,
  // Lazy loading
  withLazy,
  createLazyComponent,
  preloadComponent,
} from './bundling';

// ============================================================================
// HOOKS & UTILITIES
// ============================================================================
export {
  // Performance hooks
  useStableCallback,
  useDebouncedCallback,
  useThrottledCallback,
  usePrevious,
  useMemoWithEquals,
  useAsyncOperation,
  usePerformanceMonitor,
  // Utility functions
  processInChunks,
  debounce,
  shouldUseVirtualization,
  getVirtualizationConfig,
  calculateOptimalWindowSize,
  queueTask,
  preloadImages,
  createBatchUpdater,
  cleanup,
} from './hooks';