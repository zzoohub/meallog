import AsyncStorage from "@react-native-async-storage/async-storage";
import { Meal, MealHistoryFilter } from "../types";
import { MealType, NutritionInfo } from "@/types";

const MEALS_STORAGE_KEY = "@meal_log_meals";

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

  // Get all meals
  static async getAllMeals(): Promise<Meal[]> {
    try {
      const mealsJson = await AsyncStorage.getItem(MEALS_STORAGE_KEY);
      if (!mealsJson) return [];
      
      const meals = JSON.parse(mealsJson);
      // Convert date strings back to Date objects
      return meals.map((meal: any) => ({
        ...meal,
        createdAt: new Date(meal.createdAt),
        updatedAt: new Date(meal.updatedAt),
      }));
    } catch (error) {
      console.error("Error getting meals:", error);
      return [];
    }
  }

  // Get meal by ID
  static async getMealById(id: string): Promise<Meal | null> {
    try {
      const meals = await this.getAllMeals();
      return meals.find(meal => meal.id === id) || null;
    } catch (error) {
      console.error("Error getting meal by ID:", error);
      return null;
    }
  }

  // Update meal
  static async updateMeal(id: string, updates: Partial<Meal>): Promise<Meal | null> {
    try {
      const meals = await this.getAllMeals();
      const mealIndex = meals.findIndex(meal => meal.id === id);
      
      if (mealIndex === -1) {
        throw new Error("Meal not found");
      }

      const updatedMeal = {
        ...meals[mealIndex],
        ...updates,
        updatedAt: new Date(),
      };

      meals[mealIndex] = updatedMeal;
      await AsyncStorage.setItem(MEALS_STORAGE_KEY, JSON.stringify(meals));
      
      return updatedMeal;
    } catch (error) {
      console.error("Error updating meal:", error);
      return null;
    }
  }

  // Delete meal
  static async deleteMeal(id: string): Promise<boolean> {
    try {
      const meals = await this.getAllMeals();
      const filteredMeals = meals.filter(meal => meal.id !== id);
      
      await AsyncStorage.setItem(MEALS_STORAGE_KEY, JSON.stringify(filteredMeals));
      return true;
    } catch (error) {
      console.error("Error deleting meal:", error);
      return false;
    }
  }

  // Get meals with filtering
  static async getMealsWithFilter(filter: MealHistoryFilter): Promise<Meal[]> {
    try {
      const allMeals = await this.getAllMeals();
      let filteredMeals = allMeals;

      // Filter by date range
      if (filter.startDate) {
        filteredMeals = filteredMeals.filter(
          meal => meal.createdAt >= filter.startDate!
        );
      }
      if (filter.endDate) {
        filteredMeals = filteredMeals.filter(
          meal => meal.createdAt <= filter.endDate!
        );
      }

      // Filter by meal type
      if (filter.mealType) {
        filteredMeals = filteredMeals.filter(
          meal => meal.mealType === filter.mealType
        );
      }

      // Filter by search query
      if (filter.searchQuery) {
        const query = filter.searchQuery.toLowerCase();
        filteredMeals = filteredMeals.filter(meal =>
          meal.name.toLowerCase().includes(query) ||
          meal.description?.toLowerCase().includes(query)
        );
      }

      return filteredMeals;
    } catch (error) {
      console.error("Error filtering meals:", error);
      return [];
    }
  }

  // Clear all meals
  static async clearAllMeals(): Promise<void> {
    try {
      await AsyncStorage.removeItem(MEALS_STORAGE_KEY);
    } catch (error) {
      console.error("Error clearing meals:", error);
      throw new Error("Failed to clear meals");
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
      description: "Fresh mixed greens with grilled chicken breast",
      photoUri: "mock://chicken-salad.jpg",
      mealType: MealType.LUNCH,
      nutrition: {
        calories: 420,
        protein: 35,
        carbs: 15,
        fat: 18,
      },
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    },
    {
      id: "meal_2", 
      userId: "user_1",
      name: "Oatmeal with Berries",
      description: "Steel-cut oats with mixed berries and honey",
      photoUri: "mock://oatmeal.jpg",
      mealType: MealType.BREAKFAST,
      nutrition: {
        calories: 320,
        protein: 12,
        carbs: 58,
        fat: 8,
      },
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12), // 12 hours ago
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 12),
    },
  ];

  return mockMeals;
}