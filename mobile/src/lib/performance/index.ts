// ============================================================================
// TYPES
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

// ============================================================================
// CONFIGURATION
// ============================================================================
export {
  DEFAULT_CACHE_CONFIG,
  VIRTUALIZATION_CONFIG,
  CHUNK_SIZE,
  DEBOUNCE_DELAY,
  DOMAIN_IMPORT_MAP,
} from './config';

// ============================================================================
// QUERY CLIENT & PREFETCH
// ============================================================================
export {
  queryClient,
  prefetchData,
  prefetchBatch,
} from './query';

// ============================================================================
// CACHE UTILITIES
// ============================================================================
export {
  getCachedData,
  clearAllCaches,
  getCacheMetrics,
} from './cache';

// ============================================================================
// LAZY LOADING
// ============================================================================
export {
  withLazy,
  createLazyComponent,
  preloadComponent,
} from './lazy';

// ============================================================================
// GENERAL UTILITIES
// ============================================================================
export {
  processInChunks,
  debounce,
  shouldUseVirtualization,
  getVirtualizationConfig,
  calculateOptimalWindowSize,
  queueTask,
  preloadImages,
  createBatchUpdater,
  cleanup,
} from './utils';

// ============================================================================
// BUNDLE MANAGEMENT
// ============================================================================
export {
  importDomain,
  preloadCriticalModules,
  getLoadedModulesCount,
  isModuleLoaded,
  importDomainMap,
} from './bundle';

// ============================================================================
// PERFORMANCE MONITORING
// ============================================================================
export {
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
} from './monitor';

// ============================================================================
// PERFORMANCE HOOKS
// ============================================================================
export {
  useStableCallback,
  useDebouncedCallback,
  useThrottledCallback,
  usePrevious,
  useMemoWithEquals,
  useAsyncOperation,
  usePerformanceMonitor,
} from './hooks';