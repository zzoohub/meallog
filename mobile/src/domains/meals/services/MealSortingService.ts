import { Meal } from "@/domains/meals/types";
import { SortMethod } from "@/contexts/TimeContext";

interface SortMetadata {
  key: SortMethod;
  label: string;
  icon: string;
  description: string;
  ascending: boolean;
}

interface SortedSection {
  title: string;
  data: Meal[];
}

class MealSortingService {
  private readonly CHUNK_SIZE = 50;

  // Sort metadata for UI display
  private readonly sortOptions: SortMetadata[] = [
    {
      key: "date-desc",
      label: "Latest First",
      icon: "time",
      description: "Most recent meals first",
      ascending: false,
    },
    {
      key: "date-asc",
      label: "Oldest First",
      icon: "time-outline",
      description: "Oldest meals first",
      ascending: true,
    },
    {
      key: "calories-desc",
      label: "Highest Calories",
      icon: "flame",
      description: "Meals with most calories first",
      ascending: false,
    },
    {
      key: "calories-asc",
      label: "Lowest Calories",
      icon: "flame-outline",
      description: "Meals with least calories first",
      ascending: true,
    },
    {
      key: "protein-desc",
      label: "Highest Protein",
      icon: "fitness",
      description: "High protein meals first",
      ascending: false,
    },
    {
      key: "protein-asc",
      label: "Lowest Protein",
      icon: "fitness-outline",
      description: "Low protein meals first",
      ascending: true,
    },
    {
      key: "health-score-desc",
      label: "Healthiest First",
      icon: "heart",
      description: "Highest health score first",
      ascending: false,
    },
    {
      key: "health-score-asc",
      label: "Least Healthy",
      icon: "heart-outline",
      description: "Lowest health score first",
      ascending: true,
    },
    {
      key: "nutrition-density-desc",
      label: "Most Nutritious",
      icon: "nutrition",
      description: "Highest nutrition per calorie",
      ascending: false,
    },
    {
      key: "nutrition-density-asc",
      label: "Least Dense",
      icon: "nutrition-outline",
      description: "Lowest nutrition density",
      ascending: true,
    },
  ];

  /**
   * Gets all available sort options with metadata
   */
  getSortOptions(): SortMetadata[] {
    return [...this.sortOptions];
  }

  /**
   * Gets metadata for a specific sort method
   */
  getSortMetadata(sortMethod: SortMethod): SortMetadata {
    return this.sortOptions.find(option => option.key === sortMethod) || this.sortOptions[0];
  }

  /**
   * Calculates nutrition density score (protein + fiber) per 100 calories
   */
  private calculateNutritionDensity(meal: Meal): number {
    const calories = meal.nutrition.calories || 1; // Prevent division by zero
    const protein = meal.nutrition.protein || 0;
    const fiber = meal.nutrition.fiber || 0;

    // Calculate density as (protein + fiber) per 100 calories
    return ((protein + fiber) / calories) * 100;
  }

  /**
   * Gets health score from AI analysis or calculates a basic one
   */
  private getHealthScore(meal: Meal): number {
    if (meal.aiAnalysis?.insights?.healthScore) {
      return meal.aiAnalysis.insights.healthScore;
    }

    // Calculate basic health score based on nutrition balance
    const { calories = 0, protein = 0, carbs = 0, fat = 0, fiber = 0 } = meal.nutrition;

    if (calories === 0) return 0;

    const proteinRatio = (protein / calories) * 100;
    const fiberScore = Math.min(fiber * 4, 20); // Cap at 20
    const fatRatio = (fat / calories) * 100;

    // Basic scoring algorithm (0-100)
    let score = 50; // Base score

    // Bonus for adequate protein (>15% of calories)
    if (proteinRatio > 15) score += 20;
    else if (proteinRatio > 10) score += 10;

    // Bonus for fiber
    score += fiberScore;

    // Penalty for excessive fat (>35% of calories)
    if (fatRatio > 35) score -= 15;
    else if (fatRatio > 30) score -= 10;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Gets sort value for comparison
   */
  private getSortValue(meal: Meal, sortMethod: SortMethod): number {
    switch (sortMethod) {
      case "date-desc":
      case "date-asc":
        return meal.timestamp.getTime();

      case "calories-desc":
      case "calories-asc":
        return meal.nutrition.calories || 0;

      case "protein-desc":
      case "protein-asc":
        return meal.nutrition.protein || 0;

      case "health-score-desc":
      case "health-score-asc":
        return this.getHealthScore(meal);

      case "nutrition-density-desc":
      case "nutrition-density-asc":
        return this.calculateNutritionDensity(meal);

      default:
        return meal.timestamp.getTime();
    }
  }

  /**
   * Compares two meals based on sort method
   */
  private compareMeals(a: Meal, b: Meal, sortMethod: SortMethod): number {
    const metadata = this.getSortMetadata(sortMethod);
    const valueA = this.getSortValue(a, sortMethod);
    const valueB = this.getSortValue(b, sortMethod);

    const comparison = valueA - valueB;
    return metadata.ascending ? comparison : -comparison;
  }

  /**
   * Sorts meals in chunks for better performance with large datasets
   */
  private async sortMealsInChunks(meals: Meal[], sortMethod: SortMethod): Promise<Meal[]> {
    if (meals.length <= this.CHUNK_SIZE) {
      return meals.sort((a, b) => this.compareMeals(a, b, sortMethod));
    }

    // Split into chunks
    const chunks: Meal[][] = [];
    for (let i = 0; i < meals.length; i += this.CHUNK_SIZE) {
      chunks.push(meals.slice(i, i + this.CHUNK_SIZE));
    }

    // Sort each chunk
    const sortedChunks = await Promise.all(
      chunks.map(chunk => Promise.resolve(chunk.sort((a, b) => this.compareMeals(a, b, sortMethod)))),
    );

    // Merge sorted chunks
    let result = sortedChunks[0] || [];
    for (let i = 1; i < sortedChunks.length; i++) {
      result = this.mergeSortedArrays(result, sortedChunks[i], sortMethod);
    }

    return result;
  }

  /**
   * Merges two sorted arrays
   */
  private mergeSortedArrays(arr1: Meal[], arr2: Meal[], sortMethod: SortMethod): Meal[] {
    const result: Meal[] = [];
    let i = 0,
      j = 0;

    while (i < arr1.length && j < arr2.length) {
      if (this.compareMeals(arr1[i], arr2[j], sortMethod) <= 0) {
        result.push(arr1[i]);
        i++;
      } else {
        result.push(arr2[j]);
        j++;
      }
    }

    // Add remaining elements
    result.push(...arr1.slice(i), ...arr2.slice(j));
    return result;
  }

  /**
   * Groups sorted meals into sections
   */
  private groupMealsIntoSections(sortedMeals: Meal[], sortMethod: SortMethod): SortedSection[] {
    if (sortedMeals.length === 0) return [];

    // For date-based sorting, group by date
    if (sortMethod === "date-desc" || sortMethod === "date-asc") {
      return this.groupByDate(sortedMeals);
    }

    // For other sorting methods, group by ranges
    return this.groupByValueRange(sortedMeals, sortMethod);
  }

  /**
   * Groups meals by date
   */
  private groupByDate(meals: Meal[]): SortedSection[] {
    const grouped = meals.reduce((acc, meal) => {
      const date = meal.timestamp.toDateString();
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(meal);
      return acc;
    }, {} as Record<string, Meal[]>);

    return Object.entries(grouped)
      .map(([date, meals]) => {
        const sectionDate = new Date(date);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        let title: string;
        if (sectionDate.toDateString() === today.toDateString()) {
          title = "Today";
        } else if (sectionDate.toDateString() === yesterday.toDateString()) {
          title = "Yesterday";
        } else {
          title = sectionDate.toLocaleDateString("en-US", {
            weekday: "long",
            month: "short",
            day: "numeric",
          });
        }

        return {
          title,
          data: meals,
        };
      })
      .sort((a, b) => {
        const dateA = new Date(a.data[0]?.timestamp || 0);
        const dateB = new Date(b.data[0]?.timestamp || 0);
        return dateB.getTime() - dateA.getTime();
      });
  }

  /**
   * Groups meals by value ranges for non-date sorting
   */
  private groupByValueRange(meals: Meal[], sortMethod: SortMethod): SortedSection[] {
    const metadata = this.getSortMetadata(sortMethod);

    switch (sortMethod) {
      case "calories-desc":
      case "calories-asc":
        return this.groupByCalorieRanges(meals);

      case "protein-desc":
      case "protein-asc":
        return this.groupByProteinRanges(meals);

      case "health-score-desc":
      case "health-score-asc":
        return this.groupByHealthScore(meals);

      case "nutrition-density-desc":
      case "nutrition-density-asc":
        return this.groupByDensityRanges(meals);

      default:
        // Single section for unsupported groupings
        return [
          {
            title: `All Meals (${metadata.label})`,
            data: meals,
          },
        ];
    }
  }

  /**
   * Groups meals by calorie ranges
   */
  private groupByCalorieRanges(meals: Meal[]): SortedSection[] {
    const ranges = [
      { min: 0, max: 200, label: "Light (0-200 cal)" },
      { min: 200, max: 400, label: "Moderate (200-400 cal)" },
      { min: 400, max: 600, label: "Substantial (400-600 cal)" },
      { min: 600, max: 800, label: "Large (600-800 cal)" },
      { min: 800, max: Infinity, label: "Very Large (800+ cal)" },
    ];

    return this.groupByRanges(meals, ranges, meal => meal.nutrition.calories || 0);
  }

  /**
   * Groups meals by protein ranges
   */
  private groupByProteinRanges(meals: Meal[]): SortedSection[] {
    const ranges = [
      { min: 0, max: 10, label: "Low Protein (0-10g)" },
      { min: 10, max: 20, label: "Moderate Protein (10-20g)" },
      { min: 20, max: 30, label: "High Protein (20-30g)" },
      { min: 30, max: Infinity, label: "Very High Protein (30g+)" },
    ];

    return this.groupByRanges(meals, ranges, meal => meal.nutrition.protein || 0);
  }

  /**
   * Groups meals by health score
   */
  private groupByHealthScore(meals: Meal[]): SortedSection[] {
    const ranges = [
      { min: 80, max: 100, label: "Excellent (80-100)" },
      { min: 60, max: 80, label: "Good (60-80)" },
      { min: 40, max: 60, label: "Fair (40-60)" },
      { min: 0, max: 40, label: "Poor (0-40)" },
    ];

    return this.groupByRanges(meals, ranges, meal => this.getHealthScore(meal));
  }

  /**
   * Groups meals by nutrition density
   */
  private groupByDensityRanges(meals: Meal[]): SortedSection[] {
    const ranges = [
      { min: 10, max: Infinity, label: "Very Dense (10+)" },
      { min: 5, max: 10, label: "Dense (5-10)" },
      { min: 2, max: 5, label: "Moderate (2-5)" },
      { min: 0, max: 2, label: "Low (0-2)" },
    ];

    return this.groupByRanges(meals, ranges, meal => this.calculateNutritionDensity(meal));
  }

  /**
   * Generic function to group meals by ranges
   */
  private groupByRanges(
    meals: Meal[],
    ranges: { min: number; max: number; label: string }[],
    valueExtractor: (meal: Meal) => number,
  ): SortedSection[] {
    const sections: SortedSection[] = [];

    ranges.forEach(range => {
      const mealsInRange = meals.filter(meal => {
        const value = valueExtractor(meal);
        return value >= range.min && value < range.max;
      });

      if (mealsInRange.length > 0) {
        sections.push({
          title: `${range.label} (${mealsInRange.length})`,
          data: mealsInRange,
        });
      }
    });

    return sections;
  }

  /**
   * Main sorting function that handles large datasets efficiently
   */
  async sortMeals(meals: Meal[], sortMethod: SortMethod): Promise<SortedSection[]> {
    try {
      if (meals.length === 0) {
        return [];
      }

      // Sort meals
      const sortedMeals = await this.sortMealsInChunks(meals, sortMethod);

      // Group into sections
      return this.groupMealsIntoSections(sortedMeals, sortMethod);
    } catch (error) {
      console.error("Error sorting meals:", error);

      // Fallback to simple date-based grouping
      return this.groupByDate(meals.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()));
    }
  }

  /**
   * Gets estimated sort time for UI feedback
   */
  getEstimatedSortTime(mealCount: number): number {
    // Rough estimates in milliseconds
    if (mealCount < 50) return 10;
    if (mealCount < 200) return 50;
    if (mealCount < 500) return 150;
    if (mealCount < 1000) return 300;
    return 500;
  }

  /**
   * Checks if sorting method requires expensive calculations
   */
  isExpensiveSort(sortMethod: SortMethod): boolean {
    return ["health-score-desc", "health-score-asc", "nutrition-density-desc", "nutrition-density-asc"].includes(
      sortMethod,
    );
  }
}

export const mealSortingService = new MealSortingService();
export default MealSortingService;
