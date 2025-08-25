import { CacheConfig, VirtualizationConfig } from "./types";

// ============================================================================
// PERFORMANCE CONSTANTS
// ============================================================================

export const DEFAULT_CACHE_CONFIG: CacheConfig = {
  maxSize: 1000,
  ttl: 5 * 60 * 1000, // 5 minutes
};

export const VIRTUALIZATION_CONFIG: VirtualizationConfig = {
  threshold: 100,
  windowSize: 50,
  bufferSize: 10,
};

export const CHUNK_SIZE = 50;
export const DEBOUNCE_DELAY = 300; // ms

// ============================================================================
// DOMAIN IMPORT MAP
// ============================================================================

export const DOMAIN_IMPORT_MAP = {
  camera: () => import("@/domains/camera/components/Camera"),
  meals: () => import("../../../app/meal-history"),
  aiCoach: () => import("@/domains/ai-coach/components/AICoach"),
  settings: () => import("@/domains/settings/components/SettingsOrbital"),
  progress: () => import("@/domains/progress/components/ProgressDashboard"),
} as const;
