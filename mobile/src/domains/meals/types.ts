import { NutritionInfo, MealType, AIAnalysis, Location } from "@/types";

export interface Meal {
  id: string;
  userId: string;
  name: string;
  photoUri: string;
  timestamp: Date;
  mealType: MealType;
  nutrition: NutritionInfo;
  ingredients: string[];
  aiAnalysis: AIAnalysisWithInsights;
  location: Location;
  notes: string;
  isVerified: boolean; // true if user has edited/verified the AI results
  createdAt: Date;
  updatedAt: Date;
}

export interface AIAnalysisWithInsights extends AIAnalysis {
  insights?: {
    healthScore: number; // 0-100
    nutritionBalance: string; // e.g., "High protein, moderate carbs"
    recommendations: string[];
    warnings?: string[]; // e.g., "High sodium content"
  };
}

export interface MealHistoryFilter {
  startDate?: Date;
  endDate?: Date;
  mealType?: MealType;
  searchQuery?: string;
}

export interface MealStatistics {
  totalMeals: number;
  averageCalories: number;
  averageNutrition: NutritionInfo;
  topIngredients: { name: string; count: number }[];
  mealTypeDistribution: Record<MealType, number>;
}
