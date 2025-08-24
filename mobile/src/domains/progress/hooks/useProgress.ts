import { useState, useCallback, useMemo, useEffect } from 'react';
import { useSuspenseQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { progressCalculationService } from '../services/progressCalculationService';
import { EnhancedMealStorageService } from '@/domains/meals/services/mealStorage';
import type {
  TimePeriod,
  PeriodType,
  PeriodStats,
  NutritionGoals,
  MetricsDisplayType,
  ProgressError,
  ProgressInsight,
  ProgressComparison,
  HistoricalData,
  ProgressSettings
} from '../types';

/**
 * Primary hook for progress statistics and analytics
 */
export function useProgress(
  period: TimePeriod,
  goals?: NutritionGoals,
  metricsType: MetricsDisplayType = MetricsDisplayType.TOTAL
) {
  const [error, setError] = useState<ProgressError | null>(null);
  const queryClient = useQueryClient();

  // Generate query key for caching
  const generateQueryKey = useCallback((
    period: TimePeriod, 
    goals?: NutritionGoals, 
    metricsType?: MetricsDisplayType
  ) => {
    return [
      'progress-stats',
      period.type,
      period.startDate?.getTime() || 'none',
      period.endDate?.getTime() || 'none',
      goals ? Object.values(goals).join('-') : 'default',
      metricsType || 'total'
    ];
  }, []);

  // Main progress query
  const progressQuery = useSuspenseQuery({
    queryKey: generateQueryKey(period, goals, metricsType),
    queryFn: async (): Promise<PeriodStats> => {
      try {
        const meals = await EnhancedMealStorageService.getAllMeals();
        return await progressCalculationService.calculatePeriodStats(
          meals, period, goals, metricsType
        );
      } catch (error) {
        const progressError = error as ProgressError;
        setError(progressError);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Refresh progress data
  const refreshProgress = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: ['progress-stats']
    });
  }, [queryClient]);

  // Prefetch related periods
  const prefetchRelatedPeriods = useCallback(async () => {
    const relatedPeriods: TimePeriod[] = [
      { type: PeriodType.DAY },
      { type: PeriodType.WEEK },
      { type: PeriodType.MONTH }
    ].filter(p => p.type !== period.type);

    await Promise.all(
      relatedPeriods.map(p => 
        queryClient.prefetchQuery({
          queryKey: generateQueryKey(p, goals, metricsType),
          queryFn: async () => {
            const meals = await EnhancedMealStorageService.getAllMeals();
            return await progressCalculationService.calculatePeriodStats(
              meals, p, goals, metricsType
            );
          },
          staleTime: 5 * 60 * 1000
        })
      )
    );
  }, [period, goals, metricsType, queryClient, generateQueryKey]);

  // Auto-prefetch on mount
  useEffect(() => {
    prefetchRelatedPeriods();
  }, [prefetchRelatedPeriods]);

  return {
    stats: progressQuery.data,
    isLoading: progressQuery.isLoading,
    error: error || (progressQuery.error as ProgressError),
    refreshProgress,
    prefetchRelatedPeriods,
    clearError: useCallback(() => setError(null), [])
  };
}

/**
 * Hook for comparing progress across different periods
 */
export function useProgressComparison(
  currentPeriod: TimePeriod,
  previousPeriod: TimePeriod,
  goals?: NutritionGoals,
  metricsType: MetricsDisplayType = MetricsDisplayType.TOTAL
) {
  const [isLoading, setIsLoading] = useState(false);
  const [comparison, setComparison] = useState<ProgressComparison | null>(null);
  const [error, setError] = useState<ProgressError | null>(null);

  const loadComparison = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const meals = await EnhancedMealStorageService.getAllMeals();
      
      const [currentStats, previousStats] = await Promise.all([
        progressCalculationService.calculatePeriodStats(
          meals, currentPeriod, goals, metricsType
        ),
        progressCalculationService.calculatePeriodStats(
          meals, previousPeriod, goals, metricsType
        )
      ]);

      // Calculate changes
      const changes: ProgressComparison['changes'] = {};
      
      // Compare nutrition metrics
      Object.entries(currentStats.nutrition).forEach(([key, current]) => {
        const previous = previousStats.nutrition[key as keyof typeof previousStats.nutrition];
        const absolute = current.current - previous.current;
        const percentage = previous.current > 0 ? (absolute / previous.current) * 100 : 0;
        
        changes[`nutrition.${key}`] = {
          absolute: Math.round(absolute * 10) / 10,
          percentage: Math.round(percentage * 10) / 10,
          trend: absolute > 0 ? 'up' : absolute < 0 ? 'down' : 'stable'
        };
      });

      // Compare meal metrics
      changes['meals.total'] = {
        absolute: currentStats.meals.total - previousStats.meals.total,
        percentage: previousStats.meals.total > 0 
          ? ((currentStats.meals.total - previousStats.meals.total) / previousStats.meals.total) * 100 
          : 0,
        trend: currentStats.meals.total > previousStats.meals.total ? 'up' : 
               currentStats.meals.total < previousStats.meals.total ? 'down' : 'stable'
      };

      setComparison({
        current: currentStats,
        previous: previousStats,
        changes
      });
    } catch (err) {
      setError(err as ProgressError);
    } finally {
      setIsLoading(false);
    }
  }, [currentPeriod, previousPeriod, goals, metricsType]);

  return {
    comparison,
    isLoading,
    error,
    loadComparison,
    clearError: useCallback(() => setError(null), [])
  };
}

/**
 * Hook for managing nutrition goals
 */
export function useNutritionGoals() {
  const [goals, setGoals] = useState<NutritionGoals>({
    calories: 2000,
    protein: 120,
    carbs: 250,
    fat: 70,
    fiber: 25,
    water: 8,
    sodium: 2300,
    sugar: 50,
    saturatedFat: 20
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ProgressError | null>(null);

  // Load goals from storage
  const loadGoals = useCallback(async () => {
    setIsLoading(true);
    try {
      // TODO: Implement goal storage service
      // const savedGoals = await ProgressStorageService.getGoals();
      // if (savedGoals) setGoals(savedGoals);
    } catch (err) {
      setError(err as ProgressError);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save goals to storage
  const saveGoals = useCallback(async (newGoals: Partial<NutritionGoals>) => {
    setIsLoading(true);
    try {
      const updatedGoals = { ...goals, ...newGoals };
      // TODO: Implement goal storage service
      // await ProgressStorageService.saveGoals(updatedGoals);
      setGoals(updatedGoals);
    } catch (err) {
      setError(err as ProgressError);
    } finally {
      setIsLoading(false);
    }
  }, [goals]);

  // Update specific goal
  const updateGoal = useCallback(async (nutrient: keyof NutritionGoals, value: number) => {
    await saveGoals({ [nutrient]: value });
  }, [saveGoals]);

  // Reset to default goals
  const resetToDefaults = useCallback(async () => {
    const defaultGoals: NutritionGoals = {
      calories: 2000,
      protein: 120,
      carbs: 250,
      fat: 70,
      fiber: 25,
      water: 8,
      sodium: 2300,
      sugar: 50,
      saturatedFat: 20
    };
    await saveGoals(defaultGoals);
  }, [saveGoals]);

  return {
    goals,
    isLoading,
    error,
    loadGoals,
    saveGoals,
    updateGoal,
    resetToDefaults,
    clearError: useCallback(() => setError(null), [])
  };
}

/**
 * Hook for progress insights and recommendations
 */
export function useProgressInsights(
  period: TimePeriod,
  goals?: NutritionGoals,
  metricsType: MetricsDisplayType = MetricsDisplayType.TOTAL
) {
  const [insights, setInsights] = useState<ProgressInsight[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ProgressError | null>(null);

  const loadInsights = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const meals = await EnhancedMealStorageService.getAllMeals();
      const stats = await progressCalculationService.calculatePeriodStats(
        meals, period, goals, metricsType
      );
      setInsights(stats.insights);
    } catch (err) {
      setError(err as ProgressError);
    } finally {
      setIsLoading(false);
    }
  }, [period, goals, metricsType]);

  // Auto-load insights when parameters change
  useEffect(() => {
    loadInsights();
  }, [loadInsights]);

  // Filter insights by priority
  const highPriorityInsights = useMemo(() => 
    insights.filter(insight => insight.priority === 'high' || insight.priority === 'critical'),
    [insights]
  );

  const actionableInsights = useMemo(() => 
    insights.filter(insight => insight.actionItems.length > 0),
    [insights]
  );

  return {
    insights,
    highPriorityInsights,
    actionableInsights,
    isLoading,
    error,
    loadInsights,
    clearError: useCallback(() => setError(null), [])
  };
}

/**
 * Hook for historical progress data
 */
export function useHistoricalProgress(
  periods: TimePeriod[],
  goals?: NutritionGoals,
  metricsType: MetricsDisplayType = MetricsDisplayType.DAILY_AVERAGE
) {
  const [historicalData, setHistoricalData] = useState<HistoricalData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ProgressError | null>(null);

  const loadHistoricalData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const meals = await EnhancedMealStorageService.getAllMeals();
      
      const periodStats = await Promise.all(
        periods.map(period => 
          progressCalculationService.calculatePeriodStats(
            meals, period, goals, metricsType
          )
        )
      );

      // Find best and worst periods
      const sortedByCalories = [...periodStats].sort((a, b) => 
        b.nutrition.calories.percentage - a.nutrition.calories.percentage
      );
      
      const bestPeriod = sortedByCalories[0];
      const worstPeriod = sortedByCalories[sortedByCalories.length - 1];

      // Calculate aggregated data (simplified)
      const totalMeals = periodStats.reduce((sum, stats) => sum + stats.meals.total, 0);
      const avgHealthScore = periodStats.reduce((sum, stats) => 
        sum + stats.meals.healthScoreAverage, 0) / periodStats.length;

      setHistoricalData({
        periods: periodStats,
        aggregated: {
          bestPeriod,
          worstPeriod,
          averages: {
            meals: {
              total: Math.round(totalMeals / periods.length),
              verified: 0,
              healthScoreAverage: Math.round(avgHealthScore),
              favoriteCount: 0
            }
          },
          trends: {
            calories: 'stable',
            protein: 'stable',
            health_score: 'stable'
          }
        }
      });
    } catch (err) {
      setError(err as ProgressError);
    } finally {
      setIsLoading(false);
    }
  }, [periods, goals, metricsType]);

  return {
    historicalData,
    isLoading,
    error,
    loadHistoricalData,
    clearError: useCallback(() => setError(null), [])
  };
}

/**
 * Hook for progress period management
 */
export function usePeriodManager() {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>({ type: PeriodType.DAY });
  const [customPeriod, setCustomPeriod] = useState<{ start?: Date; end?: Date }>({});
  const [metricsType, setMetricsType] = useState<MetricsDisplayType>(MetricsDisplayType.TOTAL);

  // Quick period selections
  const selectToday = useCallback(() => {
    setSelectedPeriod({ type: PeriodType.DAY });
  }, []);

  const selectThisWeek = useCallback(() => {
    setSelectedPeriod({ type: PeriodType.WEEK });
  }, []);

  const selectThisMonth = useCallback(() => {
    setSelectedPeriod({ type: PeriodType.MONTH });
  }, []);

  const selectCustomPeriod = useCallback((startDate?: Date, endDate?: Date) => {
    setCustomPeriod({ start: startDate, end: endDate });
    setSelectedPeriod({
      type: PeriodType.CUSTOM,
      startDate,
      endDate
    });
  }, []);

  // Get previous period for comparison
  const getPreviousPeriod = useCallback((period: TimePeriod): TimePeriod => {
    const now = new Date();
    
    switch (period.type) {
      case PeriodType.DAY:
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        return { type: PeriodType.DAY, startDate: yesterday, endDate: yesterday };
      
      case PeriodType.WEEK:
        const lastWeekStart = new Date(now);
        lastWeekStart.setDate(now.getDate() - now.getDay() - 7);
        const lastWeekEnd = new Date(lastWeekStart);
        lastWeekEnd.setDate(lastWeekStart.getDate() + 6);
        return { type: PeriodType.WEEK, startDate: lastWeekStart, endDate: lastWeekEnd };
      
      case PeriodType.MONTH:
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        return { type: PeriodType.MONTH, startDate: lastMonth, endDate: lastMonthEnd };
      
      default:
        return period;
    }
  }, []);

  return {
    selectedPeriod,
    customPeriod,
    metricsType,
    setSelectedPeriod,
    setCustomPeriod,
    setMetricsType,
    selectToday,
    selectThisWeek,
    selectThisMonth,
    selectCustomPeriod,
    getPreviousPeriod
  };
}
