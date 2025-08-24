// Types
export type {
  Meal,
  EnhancedNutritionInfo,
  Ingredient,
  IngredientCategory,
  MealSource,
  MealMetadata,
  AIAnalysisWithInsights,
  PortionSize,
  CookingMethod,
  FreshnessIndicator,
  SimilarMeal,
  MealHistoryFilter,
  MealSortOption,
  MealStatistics,
  NutritionTrend,
  MealSuggestion,
  DifficultyLevel,
  PhotoProcessingOptions,
  PhotoProcessingResult,
  MealError,
  MealErrorCode,
  MealExportData,
  MealImportOptions
} from './types';

// Services
export { EnhancedMealStorageService, MealStorageService } from './services/mealStorage';
export { mealProcessingService } from './services/mealProcessingService';
export { generateEnhancedMockMeals, generateMockMeals } from './services/mealStorage';

// Hooks
export {
  useMeals,
  useMealStatistics,
  useMealProcessing,
  useMealSearch,
  useMealTags
} from './hooks/useMeals';

// Components
export * from './components';
