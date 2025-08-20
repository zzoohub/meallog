import AsyncStorage from "@react-native-async-storage/async-storage";
import { Meal, MealHistoryFilter } from "../types";
import { MealType, NutritionInfo } from "@/types";

const MEALS_STORAGE_KEY = "@food_log_meals";

export class MealStorageService {
  // Save a new meal
  static async saveMeal(meal: Omit<Meal, "id" | "createdAt" | "updatedAt">): Promise<Meal> {
    try {
      const newMeal: Meal = {
        ...meal,
        id: generateMealId(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const existingMeals = await this.getAllMeals();
      const updatedMeals = [newMeal, ...existingMeals];

      await AsyncStorage.setItem(MEALS_STORAGE_KEY, JSON.stringify(updatedMeals));
      return newMeal;
    } catch (error) {
      console.error("Error saving meal:", error);
      throw new Error("Failed to save meal");
    }
  }

  // Update an existing meal
  static async updateMeal(mealId: string, updates: Partial<Omit<Meal, "id" | "createdAt">>): Promise<Meal> {
    try {
      const meals = await this.getAllMeals();
      const mealIndex = meals.findIndex(meal => meal.id === mealId);

      if (mealIndex === -1) {
        throw new Error("Meal not found");
      }

      const existingMeal = meals[mealIndex]!;
      const updatedMeal: Meal = {
        id: existingMeal.id,
        userId: updates.userId ?? existingMeal.userId,
        name: updates.name ?? existingMeal.name,
        photoUri: updates.photoUri ?? existingMeal.photoUri,
        timestamp: updates.timestamp ?? existingMeal.timestamp,
        mealType: updates.mealType ?? existingMeal.mealType,
        nutrition: updates.nutrition ?? existingMeal.nutrition,
        ingredients: updates.ingredients ?? existingMeal.ingredients,
        aiAnalysis: updates.aiAnalysis ?? existingMeal.aiAnalysis,
        location: updates.location ?? existingMeal.location,
        notes: updates.notes ?? existingMeal.notes,
        isVerified: updates.isVerified ?? existingMeal.isVerified,
        createdAt: existingMeal.createdAt,
        updatedAt: new Date(),
      };

      meals[mealIndex] = updatedMeal;
      await AsyncStorage.setItem(MEALS_STORAGE_KEY, JSON.stringify(meals));

      return updatedMeal;
    } catch (error) {
      console.error("Error updating meal:", error);
      throw new Error("Failed to update meal");
    }
  }

  // Get all meals
  static async getAllMeals(): Promise<Meal[]> {
    try {
      const mealsJson = await AsyncStorage.getItem(MEALS_STORAGE_KEY);
      if (!mealsJson) return [];

      const meals = JSON.parse(mealsJson);
      // Convert date strings back to Date objects
      return meals.map((meal: any) => ({
        ...meal,
        timestamp: new Date(meal.timestamp),
        createdAt: new Date(meal.createdAt),
        updatedAt: new Date(meal.updatedAt),
      }));
    } catch (error) {
      console.error("Error getting meals:", error);
      return [];
    }
  }

  // Get meals with filtering
  static async getMealsFiltered(filter: MealHistoryFilter = {}): Promise<Meal[]> {
    try {
      let meals = await this.getAllMeals();

      // Sort by timestamp (newest first)
      meals = meals.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      // Apply filters
      if (filter.startDate) {
        meals = meals.filter(meal => meal.timestamp >= filter.startDate!);
      }

      if (filter.endDate) {
        meals = meals.filter(meal => meal.timestamp <= filter.endDate!);
      }

      if (filter.mealType) {
        meals = meals.filter(meal => meal.mealType === filter.mealType);
      }

      if (filter.searchQuery) {
        const query = filter.searchQuery.toLowerCase();
        meals = meals.filter(
          meal =>
            meal.name.toLowerCase().includes(query) ||
            meal.ingredients.some(ingredient => ingredient.toLowerCase().includes(query)),
        );
      }

      return meals;
    } catch (error) {
      console.error("Error filtering meals:", error);
      return [];
    }
  }

  // Get recent meals (for dashboard)
  static async getRecentMeals(limit: number = 8): Promise<Meal[]> {
    try {
      const meals = await this.getAllMeals();
      return meals.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, limit);
    } catch (error) {
      console.error("Error getting recent meals:", error);
      return [];
    }
  }

  // Get meals for a specific date
  static async getMealsForDate(date: Date): Promise<Meal[]> {
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);

    return this.getMealsFiltered({
      startDate: startOfDay,
      endDate: endOfDay,
    });
  }

  // Get meals for today
  static async getTodaysMeals(): Promise<Meal[]> {
    return this.getMealsForDate(new Date());
  }

  // Delete a meal
  static async deleteMeal(mealId: string): Promise<void> {
    try {
      const meals = await this.getAllMeals();
      const filteredMeals = meals.filter(meal => meal.id !== mealId);
      await AsyncStorage.setItem(MEALS_STORAGE_KEY, JSON.stringify(filteredMeals));
    } catch (error) {
      console.error("Error deleting meal:", error);
      throw new Error("Failed to delete meal");
    }
  }

  // Clear all meals (for testing/reset)
  static async clearAllMeals(): Promise<void> {
    try {
      await AsyncStorage.removeItem(MEALS_STORAGE_KEY);
    } catch (error) {
      console.error("Error clearing meals:", error);
      throw new Error("Failed to clear meals");
    }
  }

  // Get nutrition statistics for a date range
  static async getNutritionStats(
    startDate: Date,
    endDate: Date,
  ): Promise<{
    totalMeals: number;
    averageCalories: number;
    totalNutrition: NutritionInfo;
  }> {
    try {
      const meals = await this.getMealsFiltered({ startDate, endDate });

      if (meals.length === 0) {
        return {
          totalMeals: 0,
          averageCalories: 0,
          totalNutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 },
        };
      }

      const totalNutrition = meals.reduce(
        (acc, meal) => ({
          calories: acc.calories + meal.nutrition.calories,
          protein: acc.protein + meal.nutrition.protein,
          carbs: acc.carbs + meal.nutrition.carbs,
          fat: acc.fat + meal.nutrition.fat,
          fiber: (acc.fiber || 0) + (meal.nutrition.fiber || 0),
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
      );

      return {
        totalMeals: meals.length,
        averageCalories: Math.round(totalNutrition.calories / meals.length),
        totalNutrition,
      };
    } catch (error) {
      console.error("Error getting nutrition stats:", error);
      return {
        totalMeals: 0,
        averageCalories: 0,
        totalNutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 },
      };
    }
  }
}

// Helper function to generate unique meal IDs
function generateMealId(): string {
  return `meal_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

// Mock data generator for testing
export function generateMockMeals(): Meal[] {
  const mockMeals: Meal[] = [
    {
      id: "meal_1",
      userId: "user_1",
      name: "Grilled Chicken Salad",
      photoUri: "https://via.placeholder.com/300x200",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      mealType: MealType.LUNCH,
      nutrition: { calories: 380, protein: 32, carbs: 18, fat: 22, fiber: 8 },
      ingredients: ["Grilled chicken breast", "Mixed greens", "Cherry tomatoes", "Cucumber", "Olive oil dressing"],
      aiAnalysis: {
        detectedFoods: ["chicken", "salad", "tomatoes"],
        confidence: 85,
        estimatedCalories: 380,
        mealCategory: MealType.LUNCH,
        ingredients: ["chicken", "lettuce", "tomatoes", "cucumber"],
        insights: {
          healthScore: 85,
          nutritionBalance: "High protein, low carbs",
          recommendations: ["Great protein source!", "Add some healthy fats"],
        },
      },
      location: { latitude: 37.7749, longitude: -122.4194, address: "San Francisco, CA" },
      notes: "",
      isVerified: true,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
    {
      id: "meal_2",
      userId: "user_1",
      name: "Overnight Oats",
      photoUri: "https://via.placeholder.com/300x200",
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
      mealType: MealType.BREAKFAST,
      nutrition: { calories: 320, protein: 12, carbs: 45, fat: 8, fiber: 6 },
      ingredients: ["Rolled oats", "Greek yogurt", "Blueberries", "Chia seeds", "Honey"],
      aiAnalysis: {
        detectedFoods: ["oats", "yogurt", "berries"],
        confidence: 92,
        estimatedCalories: 320,
        mealCategory: MealType.BREAKFAST,
        ingredients: ["oats", "yogurt", "blueberries", "seeds"],
        insights: {
          healthScore: 90,
          nutritionBalance: "High fiber, balanced macros",
          recommendations: ["Perfect breakfast choice!", "Good source of probiotics"],
        },
      },
      location: { latitude: 34.0522, longitude: -118.2437, address: "Los Angeles, CA" },
      notes: "",
      isVerified: false,
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
    },
    {
      id: "meal_3",
      userId: "user_1",
      name: "Salmon with Sweet Potato",
      photoUri: "https://via.placeholder.com/300x200",
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
      mealType: MealType.DINNER,
      nutrition: { calories: 520, protein: 35, carbs: 32, fat: 28, fiber: 4 },
      ingredients: ["Grilled salmon", "Roasted sweet potato", "Steamed broccoli", "Lemon"],
      aiAnalysis: {
        detectedFoods: ["salmon", "sweet potato", "broccoli"],
        confidence: 88,
        estimatedCalories: 520,
        mealCategory: MealType.DINNER,
        ingredients: ["salmon", "sweet potato", "broccoli"],
        insights: {
          healthScore: 95,
          nutritionBalance: "Excellent omega-3 source",
          recommendations: ["Perfect balance of nutrients", "Great for heart health"],
        },
      },
      location: { latitude: 40.7128, longitude: -74.006, address: "New York, NY" },
      notes: "",
      isVerified: true,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
  ];

  return mockMeals;
}
