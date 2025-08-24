import { useState, useCallback, useMemo } from 'react';
import { EnhancedMealStorageService } from '../services/mealStorage';
import { mealProcessingService } from '../services/mealProcessingService';
import type { 
  Meal, 
  MealHistoryFilter, 
  MealStatistics,
  MealError,
  PhotoProcessingResult,
  AIAnalysisWithInsights,
  MealSortOption
} from '../types';

/**
 * Primary hook for meal management
 */
export function useMeals() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<MealError | null>(null);
  const [filter, setFilter] = useState<MealHistoryFilter>({});

  // Load meals with filtering
  const loadMeals = useCallback(async (newFilter: MealHistoryFilter = {}) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const filteredMeals = await EnhancedMealStorageService.getMealsFiltered(newFilter);
      setMeals(filteredMeals);
      setFilter(newFilter);
    } catch (err) {
      const error = err as MealError;
      setError(error);
      console.error('Error loading meals:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load all meals
  const loadAllMeals = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const allMeals = await EnhancedMealStorageService.getAllMeals();
      setMeals(allMeals);
    } catch (err) {
      const error = err as MealError;
      setError(error);
      console.error('Error loading all meals:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save a new meal
  const saveMeal = useCallback(async (mealData: Omit<Meal, 'id' | 'createdAt' | 'updatedAt'>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const savedMeal = await EnhancedMealStorageService.saveMeal(mealData);
      setMeals(prevMeals => [savedMeal, ...prevMeals]);
      return savedMeal;
    } catch (err) {
      const error = err as MealError;
      setError(error);
      console.error('Error saving meal:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update existing meal
  const updateMeal = useCallback(async (mealId: string, updates: Partial<Omit<Meal, 'id' | 'createdAt'>>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const updatedMeal = await EnhancedMealStorageService.updateMeal(mealId, updates);
      setMeals(prevMeals => 
        prevMeals.map(meal => meal.id === mealId ? updatedMeal : meal)
      );
      return updatedMeal;
    } catch (err) {
      const error = err as MealError;
      setError(error);
      console.error('Error updating meal:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Delete meal
  const deleteMeal = useCallback(async (mealId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await EnhancedMealStorageService.deleteMeal(mealId);
      setMeals(prevMeals => prevMeals.filter(meal => meal.id !== mealId));
    } catch (err) {
      const error = err as MealError;
      setError(error);
      console.error('Error deleting meal:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Toggle favorite status
  const toggleFavorite = useCallback(async (mealId: string) => {
    try {
      await EnhancedMealStorageService.toggleMealFavorite(mealId);
      setMeals(prevMeals => 
        prevMeals.map(meal => 
          meal.id === mealId 
            ? { ...meal, isFavorite: !meal.isFavorite, updatedAt: new Date() }
            : meal
        )
      );
    } catch (err) {
      const error = err as MealError;
      setError(error);
      console.error('Error toggling favorite:', error);
      throw error;
    }
  }, []);

  // Add tag to meal
  const addTag = useCallback(async (mealId: string, tag: string) => {
    try {
      await EnhancedMealStorageService.addTagToMeal(mealId, tag);
      setMeals(prevMeals => 
        prevMeals.map(meal => 
          meal.id === mealId 
            ? { 
                ...meal, 
                tags: [...new Set([...meal.tags, tag])],
                updatedAt: new Date() 
              }
            : meal
        )
      );
    } catch (err) {
      const error = err as MealError;
      setError(error);
      console.error('Error adding tag:', error);
      throw error;
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Memoized computed values
  const recentMeals = useMemo(() => {
    return meals.slice(0, 8);
  }, [meals]);

  const favoriteMeals = useMemo(() => {
    return meals.filter(meal => meal.isFavorite);
  }, [meals]);

  const todaysMeals = useMemo(() => {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    
    return meals.filter(meal => 
      meal.timestamp >= startOfDay && meal.timestamp <= endOfDay
    );
  }, [meals]);

  return {
    // State
    meals,
    isLoading,
    error,
    filter,
    
    // Computed values
    recentMeals,
    favoriteMeals,
    todaysMeals,
    totalMeals: meals.length,
    
    // Actions
    loadMeals,
    loadAllMeals,
    saveMeal,
    updateMeal,
    deleteMeal,
    toggleFavorite,
    addTag,
    clearError
  };
}

/**
 * Hook for meal statistics and analytics
 */
export function useMealStatistics(startDate?: Date, endDate?: Date) {
  const [statistics, setStatistics] = useState<MealStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<MealError | null>(null);

  const loadStatistics = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const stats = await EnhancedMealStorageService.getDetailedStatistics(startDate, endDate);
      setStatistics(stats);
    } catch (err) {
      const error = err as MealError;
      setError(error);
      console.error('Error loading statistics:', error);
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate]);

  return {
    statistics,
    isLoading,
    error,
    loadStatistics,
    clearError: useCallback(() => setError(null), [])
  };
}

/**
 * Hook for photo processing and AI analysis
 */
export function useMealProcessing() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [error, setError] = useState<MealError | null>(null);

  const processPhoto = useCallback(async (photoUri: string): Promise<PhotoProcessingResult> => {
    setIsProcessing(true);
    setProcessingProgress(0);
    setError(null);
    
    try {
      setProcessingProgress(25);
      
      // Validate photo first
      const isValid = await mealProcessingService.validatePhotoForAnalysis(photoUri);
      if (!isValid) {
        throw new Error('Invalid photo for analysis');
      }
      
      setProcessingProgress(50);
      
      // Process the photo
      const result = await mealProcessingService.processPhoto(photoUri);
      
      setProcessingProgress(100);
      return result;
    } catch (err) {
      const error = err as MealError;
      setError(error);
      console.error('Error processing photo:', error);
      throw error;
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
    }
  }, []);

  const analyzeMeal = useCallback(async (photoUri: string): Promise<AIAnalysisWithInsights> => {
    setIsProcessing(true);
    setProcessingProgress(0);
    setError(null);
    
    try {
      setProcessingProgress(20);
      
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProcessingProgress(prev => Math.min(prev + 10, 80));
      }, 200);
      
      const analysis = await mealProcessingService.analyzeMealPhoto(photoUri);
      
      clearInterval(progressInterval);
      setProcessingProgress(100);
      
      return analysis;
    } catch (err) {
      const error = err as MealError;
      setError(error);
      console.error('Error analyzing meal:', error);
      throw error;
    } finally {
      setIsProcessing(false);
      setTimeout(() => setProcessingProgress(0), 500);
    }
  }, []);

  const processAndAnalyze = useCallback(async (photoUri: string) => {
    const [processedPhoto, analysis] = await Promise.all([
      processPhoto(photoUri),
      analyzeMeal(photoUri)
    ]);
    
    return { processedPhoto, analysis };
  }, [processPhoto, analyzeMeal]);

  return {
    isProcessing,
    processingProgress,
    error,
    processPhoto,
    analyzeMeal,
    processAndAnalyze,
    clearError: useCallback(() => setError(null), [])
  };
}

/**
 * Hook for meal searching and filtering
 */
export function useMealSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<MealSortOption>(MealSortOption.TIMESTAMP);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<{ start?: Date; end?: Date }>({});

  const buildFilter = useCallback((): MealHistoryFilter => {
    return {
      searchQuery: searchQuery || undefined,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
      startDate: dateRange.start,
      endDate: dateRange.end,
      sortBy,
      sortOrder
    };
  }, [searchQuery, selectedTags, dateRange, sortBy, sortOrder]);

  const addTag = useCallback((tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev : [...prev, tag]
    );
  }, []);

  const removeTag = useCallback((tag: string) => {
    setSelectedTags(prev => prev.filter(t => t !== tag));
  }, []);

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedTags([]);
    setDateRange({});
    setSortBy(MealSortOption.TIMESTAMP);
    setSortOrder('desc');
  }, []);

  return {
    // Filter state
    searchQuery,
    sortBy,
    sortOrder,
    selectedTags,
    dateRange,
    
    // Actions
    setSearchQuery,
    setSortBy,
    setSortOrder,
    setSelectedTags,
    setDateRange,
    addTag,
    removeTag,
    clearFilters,
    buildFilter,
    
    // Computed
    hasActiveFilters: searchQuery.length > 0 || selectedTags.length > 0 || 
                      dateRange.start !== undefined || dateRange.end !== undefined
  };
}

/**
 * Hook for managing meal tags
 */
export function useMealTags() {
  const [tags, setTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadTags = useCallback(async () => {
    setIsLoading(true);
    try {
      const allTags = await EnhancedMealStorageService.getAllTags();
      setTags(allTags);
    } catch (error) {
      console.error('Error loading tags:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    tags,
    isLoading,
    loadTags
  };
}
