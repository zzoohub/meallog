import type { NutritionInfo, MealType, AIAnalysis, Location } from "@/types";

// Enhanced Meal interface with better type safety
export interface Meal {
  id: string;
  userId: string;
  name: string;
  photoUri: string;
  originalPhotoUri?: string; // Store original before compression
  timestamp: Date;
  mealType: MealType;
  nutrition: EnhancedNutritionInfo;
  ingredients: Ingredient[];
  aiAnalysis: AIAnalysisWithInsights;
  location: Location | null;
  notes: string;
  tags: string[]; // User-defined tags
  isVerified: boolean; // true if user has edited/verified the AI results
  isFavorite: boolean;
  source: MealSource;
  metadata: MealMetadata;
  createdAt: Date;
  updatedAt: Date;
}

// Enhanced nutrition info with more detailed tracking
export interface EnhancedNutritionInfo extends NutritionInfo {
  sugar?: number;
  sodium?: number;
  cholesterol?: number;
  saturatedFat?: number;
  transFat?: number;
  vitaminC?: number;
  calcium?: number;
  iron?: number;
  potassium?: number;
  // Nutritional goals tracking
  percentDailyValues?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
}

// Individual ingredient with detailed info
export interface Ingredient {
  name: string;
  quantity?: number;
  unit?: string;
  category?: IngredientCategory;
  nutrition?: Partial<EnhancedNutritionInfo>;
  allergens?: string[];
  isOrganic?: boolean;
}

export enum IngredientCategory {
  PROTEIN = 'protein',
  VEGETABLE = 'vegetable',
  FRUIT = 'fruit',
  GRAIN = 'grain',
  DAIRY = 'dairy',
  FAT = 'fat',
  SPICE = 'spice',
  OTHER = 'other'
}

export enum MealSource {
  CAMERA_CAPTURE = 'camera_capture',
  GALLERY_IMPORT = 'gallery_import',
  MANUAL_ENTRY = 'manual_entry',
  BARCODE_SCAN = 'barcode_scan',
  RECIPE_IMPORT = 'recipe_import'
}

export interface MealMetadata {
  processingTime?: number; // Time taken for AI analysis
  imageSize?: { width: number; height: number };
  compressionRatio?: number;
  deviceInfo?: string;
  appVersion?: string;
  analysisVersion?: string;
}

export interface AIAnalysisWithInsights extends AIAnalysis {
  insights?: {
    healthScore: number; // 0-100
    nutritionBalance: string; // e.g., "High protein, moderate carbs"
    recommendations: string[];
    warnings?: string[]; // e.g., "High sodium content"
    portionSize?: PortionSize;
    cookingMethod?: CookingMethod;
    freshness?: FreshnessIndicator;
    allergenAlerts?: string[];
  };
  alternativeNames?: string[]; // Other possible names for the dish
  similarity?: SimilarMeal[]; // Similar meals from history
  confidence: number;
  processingMetrics?: {
    analysisTime: number;
    modelVersion: string;
    imageQuality: number;
  };
}

export enum PortionSize {
  VERY_SMALL = 'very_small',
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large',
  VERY_LARGE = 'very_large'
}

export enum CookingMethod {
  RAW = 'raw',
  GRILLED = 'grilled',
  FRIED = 'fried',
  BAKED = 'baked',
  STEAMED = 'steamed',
  BOILED = 'boiled',
  ROASTED = 'roasted',
  SAUTEED = 'sauteed',
  OTHER = 'other'
}

export enum FreshnessIndicator {
  VERY_FRESH = 'very_fresh',
  FRESH = 'fresh',
  ACCEPTABLE = 'acceptable',
  QUESTIONABLE = 'questionable',
  POOR = 'poor'
}

export interface SimilarMeal {
  mealId: string;
  similarity: number; // 0-100
  matchingIngredients: string[];
}

// Search and filtering
export interface MealHistoryFilter {
  startDate?: Date;
  endDate?: Date;
  mealType?: MealType[];
  searchQuery?: string;
  tags?: string[];
  minHealthScore?: number;
  maxCalories?: number;
  minCalories?: number;
  ingredientCategories?: IngredientCategory[];
  isVerified?: boolean;
  isFavorite?: boolean;
  source?: MealSource[];
  sortBy?: MealSortOption;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export enum MealSortOption {
  TIMESTAMP = 'timestamp',
  CALORIES = 'calories',
  HEALTH_SCORE = 'healthScore',
  NAME = 'name',
  CREATED_AT = 'createdAt'
}

// Statistics and analytics
export interface MealStatistics {
  totalMeals: number;
  averageCalories: number;
  averageHealthScore: number;
  averageNutrition: EnhancedNutritionInfo;
  topIngredients: { ingredient: Ingredient; count: number }[];
  mealTypeDistribution: Record<MealType, number>;
  cookingMethodDistribution: Record<CookingMethod, number>;
  dailyAverages: {
    breakfast: number;
    lunch: number;
    dinner: number;
    snacks: number;
  };
  nutritionTrends: NutritionTrend[];
  favoriteIngredientsCategories: Record<IngredientCategory, number>;
}

export interface NutritionTrend {
  date: Date;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  healthScore: number;
}

// Meal planning and suggestions
export interface MealSuggestion {
  name: string;
  estimatedNutrition: EnhancedNutritionInfo;
  ingredients: Ingredient[];
  preparationTime: number; // minutes
  difficulty: DifficultyLevel;
  healthScore: number;
  tags: string[];
  reasonForSuggestion: string;
}

export enum DifficultyLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert'
}

// Photo processing and optimization
export interface PhotoProcessingOptions {
  maxWidth: number;
  maxHeight: number;
  quality: number; // 0-1
  format: 'jpeg' | 'png' | 'webp';
  preserveExif: boolean;
}

export interface PhotoProcessingResult {
  processedUri: string;
  originalSize: number;
  processedSize: number;
  compressionRatio: number;
  dimensions: { width: number; height: number };
  processingTime: number;
}

// Error types
export interface MealError {
  code: MealErrorCode;
  message: string;
  details?: Record<string, any>;
  suggestion?: string;
}

export enum MealErrorCode {
  STORAGE_ERROR = 'storage_error',
  PHOTO_PROCESSING_ERROR = 'photo_processing_error',
  AI_ANALYSIS_ERROR = 'ai_analysis_error',
  VALIDATION_ERROR = 'validation_error',
  NETWORK_ERROR = 'network_error',
  PERMISSIONS_ERROR = 'permissions_error',
  DUPLICATE_MEAL = 'duplicate_meal'
}

// Export/Import functionality
export interface MealExportData {
  meals: Meal[];
  exportDate: Date;
  format: 'json' | 'csv';
  filters?: MealHistoryFilter;
  statistics?: MealStatistics;
}

export interface MealImportOptions {
  mergeStrategy: 'skip' | 'overwrite' | 'merge';
  validateData: boolean;
  preserveIds: boolean;
}

