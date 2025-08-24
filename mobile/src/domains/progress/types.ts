import type { Meal, NutritionTrend } from '@/domains/meals/types';

// Enhanced time period types
export interface TimePeriod {
  type: PeriodType;
  startDate?: Date;
  endDate?: Date;
  customLabel?: string;
}

export enum PeriodType {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  QUARTER = 'quarter',
  YEAR = 'year',
  CUSTOM = 'custom'
}

// Enhanced nutrition tracking
export interface NutritionGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  water: number; // in cups
  sodium: number; // in mg
  sugar: number; // in g
  saturatedFat: number; // in g
}

export interface NutritionProgress {
  current: number;
  target: number;
  percentage: number;
  status: ProgressStatus;
  trend: TrendDirection;
  weeklyChange?: number;
}

export enum ProgressStatus {
  UNDER = 'under',
  ON_TRACK = 'on_track',
  OVER = 'over',
  CRITICAL = 'critical'
}

export enum TrendDirection {
  UP = 'up',
  DOWN = 'down',
  STABLE = 'stable'
}

// Comprehensive period statistics
export interface PeriodStats {
  // Core nutrition metrics
  nutrition: {
    calories: NutritionProgress;
    protein: NutritionProgress;
    carbs: NutritionProgress;
    fat: NutritionProgress;
    fiber: NutritionProgress;
    water: NutritionProgress;
    sodium: NutritionProgress;
    sugar: NutritionProgress;
  };
  
  // Activity metrics
  meals: {
    total: number;
    verified: number;
    healthScoreAverage: number;
    favoriteCount: number;
  };
  
  // Behavioral insights
  patterns: {
    mostCommonMealTime: string;
    averageMealsPerDay: number;
    longestStreak: number;
    currentStreak: number;
    missedDays: number;
  };
  
  // Goals and targets
  goals: {
    achieved: number;
    total: number;
    achievementRate: number;
  };
  
  // Period metadata
  period: {
    type: PeriodType;
    label: string;
    startDate: Date;
    endDate: Date;
    totalDays: number;
  };
  
  // Display configuration
  display: {
    metricsType: MetricsDisplayType;
    showTrends: boolean;
    showGoals: boolean;
  };
  
  // Trends and insights
  trends: NutritionTrend[];
  insights: ProgressInsight[];
}

export enum MetricsDisplayType {
  TOTAL = 'total',
  DAILY_AVERAGE = 'daily_average',
  WEEKLY_AVERAGE = 'weekly_average'
}

// Progress insights and recommendations
export interface ProgressInsight {
  type: InsightType;
  priority: InsightPriority;
  title: string;
  description: string;
  actionItems: string[];
  data?: Record<string, any>;
}

export enum InsightType {
  NUTRITION_BALANCE = 'nutrition_balance',
  CALORIE_INTAKE = 'calorie_intake',
  PROTEIN_TARGET = 'protein_target',
  HYDRATION = 'hydration',
  MEAL_TIMING = 'meal_timing',
  HEALTH_SCORE = 'health_score',
  CONSISTENCY = 'consistency',
  VARIETY = 'variety'
}

export enum InsightPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Goal setting and tracking
export interface ProgressGoal {
  id: string;
  name: string;
  description: string;
  type: GoalType;
  target: number;
  unit: string;
  category: GoalCategory;
  timeframe: TimePeriod;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  progress?: {
    current: number;
    percentage: number;
    trend: TrendDirection;
    lastUpdated: Date;
  };
}

export enum GoalType {
  NUMERIC = 'numeric',
  PERCENTAGE = 'percentage',
  FREQUENCY = 'frequency',
  STREAK = 'streak',
  HABIT = 'habit'
}

export enum GoalCategory {
  NUTRITION = 'nutrition',
  HABITS = 'habits',
  HEALTH = 'health',
  CONSISTENCY = 'consistency',
  VARIETY = 'variety'
}

// Advanced analytics
export interface AnalyticsData {
  correlations: NutritionCorrelation[];
  patterns: BehaviorPattern[];
  predictions: ProgressPrediction[];
  benchmarks: UserBenchmark[];
}

export interface NutritionCorrelation {
  metric1: string;
  metric2: string;
  correlation: number; // -1 to 1
  significance: number;
  description: string;
}

export interface BehaviorPattern {
  pattern: string;
  frequency: number;
  strength: number;
  description: string;
  recommendation: string;
}

export interface ProgressPrediction {
  metric: string;
  predictedValue: number;
  confidence: number;
  timeframe: number; // days
  factors: string[];
}

export interface UserBenchmark {
  metric: string;
  userValue: number;
  populationAverage: number;
  percentile: number;
  category: 'below_average' | 'average' | 'above_average';
}

// Comparison and historical data
export interface ProgressComparison {
  current: PeriodStats;
  previous: PeriodStats;
  changes: {
    [key: string]: {
      absolute: number;
      percentage: number;
      trend: TrendDirection;
    };
  };
}

export interface HistoricalData {
  periods: PeriodStats[];
  aggregated: {
    bestPeriod: PeriodStats;
    worstPeriod: PeriodStats;
    averages: Partial<PeriodStats>;
    trends: Record<string, TrendDirection>;
  };
}

// Export and reporting
export interface ProgressReport {
  period: TimePeriod;
  generatedAt: Date;
  stats: PeriodStats;
  comparison?: ProgressComparison;
  goals: {
    achieved: ProgressGoal[];
    missed: ProgressGoal[];
    inProgress: ProgressGoal[];
  };
  insights: ProgressInsight[];
  recommendations: string[];
  charts: ChartData[];
}

export interface ChartData {
  type: ChartType;
  title: string;
  data: any[];
  config: ChartConfig;
}

export enum ChartType {
  LINE = 'line',
  BAR = 'bar',
  PIE = 'pie',
  AREA = 'area',
  SCATTER = 'scatter',
  RADAR = 'radar'
}

export interface ChartConfig {
  xAxis?: string;
  yAxis?: string;
  colors?: string[];
  showLegend?: boolean;
  showGrid?: boolean;
  animations?: boolean;
}

// User preferences and settings
export interface ProgressSettings {
  goals: NutritionGoals;
  preferences: {
    defaultPeriod: PeriodType;
    metricsDisplay: MetricsDisplayType;
    showTrends: boolean;
    showInsights: boolean;
    reminderFrequency: ReminderFrequency;
  };
  notifications: {
    goalAchieved: boolean;
    weeklyReport: boolean;
    insightAvailable: boolean;
    streakMilestone: boolean;
  };
}

export enum ReminderFrequency {
  NEVER = 'never',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly'
}

// Error handling
export interface ProgressError {
  code: ProgressErrorCode;
  message: string;
  details?: Record<string, any>;
  suggestion?: string;
}

export enum ProgressErrorCode {
  CALCULATION_ERROR = 'calculation_error',
  INSUFFICIENT_DATA = 'insufficient_data',
  INVALID_PERIOD = 'invalid_period',
  GOAL_VALIDATION_ERROR = 'goal_validation_error',
  SETTINGS_ERROR = 'settings_error'
}

// Cache and performance
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  key: string;
  ttl: number;
}

export interface PerformanceMetrics {
  calculationTime: number;
  cacheHitRate: number;
  dataPoints: number;
  complexity: 'low' | 'medium' | 'high';
}
