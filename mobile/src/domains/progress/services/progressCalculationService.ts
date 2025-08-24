import type { Meal } from '@/domains/meals/types';
import type {
  TimePeriod,
  PeriodType,
  PeriodStats,
  NutritionProgress,
  NutritionGoals,
  ProgressStatus,
  TrendDirection,
  ProgressInsight,
  InsightType,
  InsightPriority,
  MetricsDisplayType,
  ProgressError,
  ProgressErrorCode,
  CacheEntry,
  PerformanceMetrics,
  AnalyticsData,
  ProgressComparison,
  BehaviorPattern
} from '../types';

class ProgressCalculationService {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_CACHE_SIZE = 200;
  
  // Default nutrition goals (can be customized per user)
  private readonly defaultGoals: NutritionGoals = {
    calories: 2000,
    protein: 120,
    carbs: 250,
    fat: 70,
    fiber: 25,
    water: 8, // cups
    sodium: 2300, // mg
    sugar: 50, // g
    saturatedFat: 20 // g
  };

  // Calculate comprehensive period statistics
  async calculatePeriodStats(
    meals: Meal[], 
    period: TimePeriod, 
    goals: NutritionGoals = this.defaultGoals,
    metricsType: MetricsDisplayType = MetricsDisplayType.TOTAL
  ): Promise<PeriodStats> {
    const startTime = Date.now();
    
    try {
      // Filter meals for the period
      const periodMeals = this.filterMealsByPeriod(meals, period);
      const { startDate, endDate } = this.getPeriodDateRange(period);
      const totalDays = this.calculateDaysBetween(startDate, endDate);
      
      if (periodMeals.length === 0) {
        return this.createEmptyStats(period, goals, startDate, endDate, totalDays);
      }
      
      // Calculate nutrition progress
      const nutritionProgress = this.calculateNutritionProgress(
        periodMeals, goals, totalDays, metricsType
      );
      
      // Calculate meal statistics
      const mealStats = this.calculateMealStatistics(periodMeals);
      
      // Analyze behavioral patterns
      const patterns = this.analyzeBehaviorPatterns(periodMeals, totalDays);
      
      // Calculate goal achievements
      const goalProgress = this.calculateGoalProgress(nutritionProgress);
      
      // Generate trends
      const trends = this.generateNutritionTrends(periodMeals, period);
      
      // Generate insights
      const insights = this.generateInsights(periodMeals, nutritionProgress, patterns);
      
      const stats: PeriodStats = {
        nutrition: nutritionProgress,
        meals: mealStats,
        patterns,
        goals: goalProgress,
        period: {
          type: period.type,
          label: this.getPeriodLabel(period),
          startDate,
          endDate,
          totalDays
        },
        display: {
          metricsType,
          showTrends: true,
          showGoals: true
        },
        trends,
        insights
      };
      
      // Cache the result
      this.cacheResult(`stats_${this.generateCacheKey(period, goals, metricsType)}`, stats);
      
      return stats;
    } catch (error) {
      console.error('Error calculating period stats:', error);
      throw this.createProgressError(
        'CALCULATION_ERROR',
        'Failed to calculate progress statistics',
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  // Calculate nutrition progress for each nutrient
  private calculateNutritionProgress(
    meals: Meal[], 
    goals: NutritionGoals, 
    totalDays: number,
    metricsType: MetricsDisplayType
  ): PeriodStats['nutrition'] {
    // Aggregate nutrition totals
    const totals = meals.reduce((acc, meal) => {
      return {
        calories: acc.calories + (meal.nutrition.calories || 0),
        protein: acc.protein + (meal.nutrition.protein || 0),
        carbs: acc.carbs + (meal.nutrition.carbs || 0),
        fat: acc.fat + (meal.nutrition.fat || 0),
        fiber: acc.fiber + (meal.nutrition.fiber || 0),
        water: acc.water + (meal.nutrition.water || 0),
        sodium: acc.sodium + (meal.nutrition.sodium || 0),
        sugar: acc.sugar + (meal.nutrition.sugar || 0)
      };
    }, {
      calories: 0, protein: 0, carbs: 0, fat: 0, 
      fiber: 0, water: 0, sodium: 0, sugar: 0
    });

    // Calculate current values based on metrics type
    const getCurrentValue = (total: number) => {
      switch (metricsType) {
        case MetricsDisplayType.DAILY_AVERAGE:
          return total / totalDays;
        case MetricsDisplayType.WEEKLY_AVERAGE:
          return total / (totalDays / 7);
        default:
          return total;
      }
    };

    // Adjust targets based on metrics type
    const getTarget = (goalValue: number) => {
      switch (metricsType) {
        case MetricsDisplayType.TOTAL:
          return goalValue * totalDays;
        case MetricsDisplayType.WEEKLY_AVERAGE:
          return goalValue * 7;
        default:
          return goalValue;
      }
    };

    // Calculate trends for each nutrient
    const calculateTrend = (nutrientValues: number[]): TrendDirection => {
      if (nutrientValues.length < 3) return TrendDirection.STABLE;
      
      const recent = nutrientValues.slice(-3);
      const older = nutrientValues.slice(-6, -3);
      
      if (older.length === 0) return TrendDirection.STABLE;
      
      const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
      const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
      
      const change = (recentAvg - olderAvg) / olderAvg;
      
      if (change > 0.05) return TrendDirection.UP;
      if (change < -0.05) return TrendDirection.DOWN;
      return TrendDirection.STABLE;
    };

    // Helper to create nutrition progress object
    const createProgress = (
      current: number, 
      target: number, 
      trend: TrendDirection = TrendDirection.STABLE
    ): NutritionProgress => {
      const percentage = target > 0 ? Math.min((current / target) * 100, 150) : 0;
      
      let status: ProgressStatus;
      if (percentage < 70) status = ProgressStatus.UNDER;
      else if (percentage <= 110) status = ProgressStatus.ON_TRACK;
      else if (percentage <= 130) status = ProgressStatus.OVER;
      else status = ProgressStatus.CRITICAL;
      
      return {
        current: Math.round(current * 10) / 10,
        target,
        percentage: Math.round(percentage),
        status,
        trend
      };
    };

    // Get daily values for trend calculation (simplified)
    const dailyCalories = this.getDailyValues(meals, 'calories');
    const dailyProtein = this.getDailyValues(meals, 'protein');
    
    return {
      calories: createProgress(
        getCurrentValue(totals.calories),
        getTarget(goals.calories),
        calculateTrend(dailyCalories)
      ),
      protein: createProgress(
        getCurrentValue(totals.protein),
        getTarget(goals.protein),
        calculateTrend(dailyProtein)
      ),
      carbs: createProgress(
        getCurrentValue(totals.carbs),
        getTarget(goals.carbs)
      ),
      fat: createProgress(
        getCurrentValue(totals.fat),
        getTarget(goals.fat)
      ),
      fiber: createProgress(
        getCurrentValue(totals.fiber),
        getTarget(goals.fiber)
      ),
      water: createProgress(
        getCurrentValue(totals.water),
        getTarget(goals.water)
      ),
      sodium: createProgress(
        getCurrentValue(totals.sodium),
        getTarget(goals.sodium)
      ),
      sugar: createProgress(
        getCurrentValue(totals.sugar),
        getTarget(goals.sugar)
      )
    };
  }

  // Calculate meal-related statistics
  private calculateMealStatistics(meals: Meal[]): PeriodStats['meals'] {
    const verified = meals.filter(meal => meal.isVerified).length;
    const favorites = meals.filter(meal => meal.isFavorite).length;
    
    const healthScores = meals
      .map(meal => meal.aiAnalysis.insights?.healthScore || 0)
      .filter(score => score > 0);
    
    const averageHealthScore = healthScores.length > 0 
      ? healthScores.reduce((a, b) => a + b, 0) / healthScores.length 
      : 0;

    return {
      total: meals.length,
      verified,
      healthScoreAverage: Math.round(averageHealthScore),
      favoriteCount: favorites
    };
  }

  // Analyze behavioral patterns
  private analyzeBehaviorPatterns(meals: Meal[], totalDays: number): PeriodStats['patterns'] {
    // Calculate meal timing patterns
    const mealTimes = meals.map(meal => {
      const hour = meal.timestamp.getHours();
      const minute = meal.timestamp.getMinutes();
      return hour + minute / 60;
    });
    
    const averageMealTime = mealTimes.length > 0 
      ? mealTimes.reduce((a, b) => a + b, 0) / mealTimes.length 
      : 12;
    
    const mostCommonHour = Math.round(averageMealTime);
    const mostCommonMealTime = `${mostCommonHour.toString().padStart(2, '0')}:00`;
    
    // Calculate streaks
    const dailyMealCounts = this.calculateDailyMealCounts(meals);
    const { longestStreak, currentStreak } = this.calculateStreaks(dailyMealCounts);
    
    // Calculate missed days
    const missedDays = Math.max(0, totalDays - Object.keys(dailyMealCounts).length);
    
    return {
      mostCommonMealTime,
      averageMealsPerDay: meals.length / totalDays,
      longestStreak,
      currentStreak,
      missedDays
    };
  }

  // Calculate goal achievement progress
  private calculateGoalProgress(nutrition: PeriodStats['nutrition']): PeriodStats['goals'] {
    const nutritionMetrics = Object.values(nutrition);
    const achieved = nutritionMetrics.filter(metric => 
      metric.status === ProgressStatus.ON_TRACK
    ).length;
    
    const total = nutritionMetrics.length;
    const achievementRate = total > 0 ? (achieved / total) * 100 : 0;
    
    return {
      achieved,
      total,
      achievementRate: Math.round(achievementRate)
    };
  }

  // Generate nutrition trends over time
  private generateNutritionTrends(meals: Meal[], period: TimePeriod) {
    const dailyData = new Map<string, {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      healthScore: number;
    }>();

    meals.forEach(meal => {
      const dayKey = meal.timestamp.toDateString();
      const existing = dailyData.get(dayKey) || {
        calories: 0, protein: 0, carbs: 0, fat: 0, healthScore: 0
      };
      
      dailyData.set(dayKey, {
        calories: existing.calories + meal.nutrition.calories,
        protein: existing.protein + meal.nutrition.protein,
        carbs: existing.carbs + meal.nutrition.carbs,
        fat: existing.fat + meal.nutrition.fat,
        healthScore: existing.healthScore + (meal.aiAnalysis.insights?.healthScore || 0)
      });
    });

    return Array.from(dailyData.entries())
      .map(([dateStr, data]) => ({
        date: new Date(dateStr),
        calories: data.calories,
        protein: data.protein,
        carbs: data.carbs,
        fat: data.fat,
        healthScore: data.healthScore
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  // Generate insights and recommendations
  private generateInsights(
    meals: Meal[], 
    nutrition: PeriodStats['nutrition'], 
    patterns: PeriodStats['patterns']
  ): ProgressInsight[] {
    const insights: ProgressInsight[] = [];

    // Calorie intake insights
    if (nutrition.calories.status === ProgressStatus.UNDER) {
      insights.push({
        type: InsightType.CALORIE_INTAKE,
        priority: InsightPriority.MEDIUM,
        title: 'Calorie Intake Below Target',
        description: `You've consumed ${nutrition.calories.percentage}% of your daily calorie target.`,
        actionItems: [
          'Add healthy snacks between meals',
          'Include calorie-dense foods like nuts and avocado',
          'Consider increasing portion sizes slightly'
        ]
      });
    }

    // Protein intake insights
    if (nutrition.protein.status === ProgressStatus.UNDER) {
      insights.push({
        type: InsightType.PROTEIN_TARGET,
        priority: InsightPriority.HIGH,
        title: 'Protein Intake Needs Attention',
        description: `You're at ${nutrition.protein.percentage}% of your protein target.`,
        actionItems: [
          'Include protein in every meal',
          'Try Greek yogurt, eggs, or lean meats',
          'Consider protein smoothies as snacks'
        ]
      });
    }

    // Consistency insights
    if (patterns.missedDays > 2) {
      insights.push({
        type: InsightType.CONSISTENCY,
        priority: InsightPriority.MEDIUM,
        title: 'Improve Logging Consistency',
        description: `You've missed logging meals on ${patterns.missedDays} days.`,
        actionItems: [
          'Set daily reminders to log meals',
          'Log meals immediately after eating',
          'Use quick-log features for faster entry'
        ]
      });
    }

    // Health score insights
    const avgHealthScore = meals.reduce((sum, meal) => 
      sum + (meal.aiAnalysis.insights?.healthScore || 0), 0) / meals.length;
    
    if (avgHealthScore < 60) {
      insights.push({
        type: InsightType.HEALTH_SCORE,
        priority: InsightPriority.HIGH,
        title: 'Focus on Healthier Meal Choices',
        description: `Your average meal health score is ${Math.round(avgHealthScore)}/100.`,
        actionItems: [
          'Add more vegetables to your meals',
          'Choose whole grains over refined carbs',
          'Reduce processed foods and added sugars'
        ]
      });
    }

    return insights;
  }

  // Helper methods
  private filterMealsByPeriod(meals: Meal[], period: TimePeriod): Meal[] {
    const { startDate, endDate } = this.getPeriodDateRange(period);
    return meals.filter(meal => 
      meal.timestamp >= startDate && meal.timestamp <= endDate
    );
  }

  private getPeriodDateRange(period: TimePeriod): { startDate: Date; endDate: Date } {
    const now = new Date();
    
    switch (period.type) {
      case PeriodType.DAY:
        return {
          startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
        };
      
      case PeriodType.WEEK:
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);
        return { startDate: weekStart, endDate: weekEnd };
      
      case PeriodType.MONTH:
        return {
          startDate: new Date(now.getFullYear(), now.getMonth(), 1),
          endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
        };
      
      case PeriodType.CUSTOM:
        return {
          startDate: period.startDate || new Date(now),
          endDate: period.endDate || new Date(now)
        };
      
      default:
        return this.getPeriodDateRange({ type: PeriodType.DAY });
    }
  }

  private calculateDaysBetween(startDate: Date, endDate: Date): number {
    const diffTime = endDate.getTime() - startDate.getTime();
    return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }

  private getPeriodLabel(period: TimePeriod): string {
    if (period.customLabel) return period.customLabel;
    
    const { startDate, endDate } = this.getPeriodDateRange(period);
    
    switch (period.type) {
      case PeriodType.DAY:
        return startDate.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'short',
          day: 'numeric'
        });
      
      case PeriodType.WEEK:
        return `${startDate.toLocaleDateString('en-US', { 
          month: 'short', day: 'numeric' 
        })} - ${endDate.toLocaleDateString('en-US', { 
          month: 'short', day: 'numeric' 
        })}`;
      
      case PeriodType.MONTH:
        return startDate.toLocaleDateString('en-US', {
          month: 'long',
          year: 'numeric'
        });
      
      default:
        return 'Custom Period';
    }
  }

  private getDailyValues(meals: Meal[], nutrient: keyof Meal['nutrition']): number[] {
    const dailyTotals = new Map<string, number>();
    
    meals.forEach(meal => {
      const dayKey = meal.timestamp.toDateString();
      const value = meal.nutrition[nutrient] as number || 0;
      dailyTotals.set(dayKey, (dailyTotals.get(dayKey) || 0) + value);
    });
    
    return Array.from(dailyTotals.values());
  }

  private calculateDailyMealCounts(meals: Meal[]): Record<string, number> {
    const counts: Record<string, number> = {};
    
    meals.forEach(meal => {
      const dayKey = meal.timestamp.toDateString();
      counts[dayKey] = (counts[dayKey] || 0) + 1;
    });
    
    return counts;
  }

  private calculateStreaks(dailyCounts: Record<string, number>): {
    longestStreak: number;
    currentStreak: number;
  } {
    const sortedDates = Object.keys(dailyCounts).sort();
    
    let longestStreak = 0;
    let currentStreak = 0;
    let tempStreak = 0;
    
    for (let i = 0; i < sortedDates.length; i++) {
      if (dailyCounts[sortedDates[i]] > 0) {
        tempStreak++;
        
        // Check if this extends to today for current streak
        const date = new Date(sortedDates[i]);
        const today = new Date();
        const diffDays = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
          currentStreak = tempStreak;
        }
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 0;
      }
    }
    
    longestStreak = Math.max(longestStreak, tempStreak);
    
    return { longestStreak, currentStreak };
  }

  private createEmptyStats(
    period: TimePeriod, 
    goals: NutritionGoals, 
    startDate: Date, 
    endDate: Date, 
    totalDays: number
  ): PeriodStats {
    const createEmptyProgress = (target: number): NutritionProgress => ({
      current: 0,
      target,
      percentage: 0,
      status: ProgressStatus.UNDER,
      trend: TrendDirection.STABLE
    });

    return {
      nutrition: {
        calories: createEmptyProgress(goals.calories),
        protein: createEmptyProgress(goals.protein),
        carbs: createEmptyProgress(goals.carbs),
        fat: createEmptyProgress(goals.fat),
        fiber: createEmptyProgress(goals.fiber),
        water: createEmptyProgress(goals.water),
        sodium: createEmptyProgress(goals.sodium),
        sugar: createEmptyProgress(goals.sugar)
      },
      meals: {
        total: 0,
        verified: 0,
        healthScoreAverage: 0,
        favoriteCount: 0
      },
      patterns: {
        mostCommonMealTime: '12:00',
        averageMealsPerDay: 0,
        longestStreak: 0,
        currentStreak: 0,
        missedDays: totalDays
      },
      goals: {
        achieved: 0,
        total: 8,
        achievementRate: 0
      },
      period: {
        type: period.type,
        label: this.getPeriodLabel(period),
        startDate,
        endDate,
        totalDays
      },
      display: {
        metricsType: MetricsDisplayType.TOTAL,
        showTrends: true,
        showGoals: true
      },
      trends: [],
      insights: [{
        type: InsightType.CONSISTENCY,
        priority: InsightPriority.HIGH,
        title: 'Start Logging Your Meals',
        description: 'No meals logged yet for this period.',
        actionItems: [
          'Take a photo of your next meal',
          'Use the quick-add feature for simple logging',
          'Set reminders to log meals regularly'
        ]
      }]
    };
  }

  // Cache management
  private generateCacheKey(
    period: TimePeriod, 
    goals: NutritionGoals, 
    metricsType: MetricsDisplayType
  ): string {
    const periodKey = `${period.type}_${period.startDate?.getTime() || 'none'}_${period.endDate?.getTime() || 'none'}`;
    const goalsKey = Object.values(goals).join('_');
    return `${periodKey}_${goalsKey}_${metricsType}`;
  }

  private cacheResult<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      this.cleanupCache();
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      key,
      ttl
    });
  }

  private cleanupCache(): void {
    const now = Date.now();
    const toDelete: string[] = [];
    
    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > entry.ttl) {
        toDelete.push(key);
      }
    });
    
    toDelete.forEach(key => this.cache.delete(key));
  }

  private createProgressError(
    code: ProgressErrorCode,
    message: string,
    details?: Record<string, any>,
    suggestion?: string
  ): ProgressError {
    return { code, message, details, suggestion };
  }

  // Public utility methods
  clearCache(): void {
    this.cache.clear();
  }

  getCacheStats() {
    return {
      size: this.cache.size,
      maxSize: this.MAX_CACHE_SIZE
    };
  }
}

export const progressCalculationService = new ProgressCalculationService();
