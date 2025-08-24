// Types
export type {
  TimePeriod,
  PeriodType,
  PeriodStats,
  NutritionGoals,
  NutritionProgress,
  ProgressStatus,
  TrendDirection,
  ProgressInsight,
  InsightType,
  InsightPriority,
  MetricsDisplayType,
  ProgressGoal,
  GoalType,
  GoalCategory,
  AnalyticsData,
  NutritionCorrelation,
  BehaviorPattern,
  ProgressPrediction,
  UserBenchmark,
  ProgressComparison,
  HistoricalData,
  ProgressReport,
  ChartData,
  ChartType,
  ChartConfig,
  ProgressSettings,
  ReminderFrequency,
  ProgressError,
  ProgressErrorCode,
  CacheEntry,
  PerformanceMetrics
} from './types';

// Services
export { progressCalculationService } from './services/progressCalculationService';
export { statsAggregationService } from './services/StatsAggregationService';

// Hooks
export {
  useProgress,
  useProgressComparison,
  useNutritionGoals,
  useProgressInsights,
  useHistoricalProgress,
  usePeriodManager
} from './hooks/useProgress';
export { useStatsQuery, usePrefetchStats } from './hooks/useStatsQuery';

// Components
export * from './components';
