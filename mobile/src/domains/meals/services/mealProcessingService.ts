import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import type { 
  PhotoProcessingOptions, 
  PhotoProcessingResult, 
  MealError, 
  MealErrorCode,
  AIAnalysisWithInsights,
  Meal,
  Ingredient,
  IngredientCategory,
  PortionSize,
  CookingMethod,
  FreshnessIndicator
} from '../types';
import type { MealType } from '@/types';

class MealProcessingService {
  private readonly DEFAULT_PROCESSING_OPTIONS: PhotoProcessingOptions = {
    maxWidth: 1024,
    maxHeight: 1024,
    quality: 0.8,
    format: 'jpeg',
    preserveExif: false
  };

  // Photo processing and optimization
  async processPhoto(
    photoUri: string, 
    options: Partial<PhotoProcessingOptions> = {}
  ): Promise<PhotoProcessingResult> {
    const startTime = Date.now();
    const processingOptions = { ...this.DEFAULT_PROCESSING_OPTIONS, ...options };
    
    try {
      // Get original file info
      const originalInfo = await FileSystem.getInfoAsync(photoUri);
      const originalSize = originalInfo.exists ? originalInfo.size || 0 : 0;
      
      // Process the image
      const result = await ImageManipulator.manipulateAsync(
        photoUri,
        [
          {
            resize: {
              width: processingOptions.maxWidth,
              height: processingOptions.maxHeight
            }
          }
        ],
        {
          compress: processingOptions.quality,
          format: ImageManipulator.SaveFormat[processingOptions.format.toUpperCase() as keyof typeof ImageManipulator.SaveFormat],
          base64: false
        }
      );
      
      // Get processed file info
      const processedInfo = await FileSystem.getInfoAsync(result.uri);
      const processedSize = processedInfo.exists ? processedInfo.size || 0 : 0;
      
      const processingTime = Date.now() - startTime;
      
      return {
        processedUri: result.uri,
        originalSize,
        processedSize,
        compressionRatio: originalSize > 0 ? processedSize / originalSize : 1,
        dimensions: {
          width: result.width,
          height: result.height
        },
        processingTime
      };
    } catch (error) {
      throw this.createMealError(
        'PHOTO_PROCESSING_ERROR',
        'Failed to process photo',
        { error: error instanceof Error ? error.message : 'Unknown error' },
        'Please try taking the photo again or check your device storage'
      );
    }
  }

  // AI analysis simulation (replace with actual API integration)
  async analyzeMealPhoto(photoUri: string): Promise<AIAnalysisWithInsights> {
    const startTime = Date.now();
    
    try {
      // Simulate AI processing delay
      await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));
      
      // Simulate various analysis scenarios
      const analysisScenarios = [
        this.generateSaladAnalysis(),
        this.generatePastaAnalysis(),
        this.generateSandwichAnalysis(),
        this.generateBurgerAnalysis(),
        this.generateSoupAnalysis()
      ];
      
      const randomAnalysis = analysisScenarios[Math.floor(Math.random() * analysisScenarios.length)];
      const processingTime = Date.now() - startTime;
      
      return {
        ...randomAnalysis,
        processingMetrics: {
          analysisTime: processingTime,
          modelVersion: '2.1.0',
          imageQuality: 0.85 + Math.random() * 0.15 // 0.85-1.0
        }
      };
    } catch (error) {
      throw this.createMealError(
        'AI_ANALYSIS_ERROR',
        'Failed to analyze meal photo',
        { error: error instanceof Error ? error.message : 'Unknown error' },
        'Please ensure the photo shows the meal clearly and try again'
      );
    }
  }

  // Enhanced ingredient parsing with categories
  parseIngredients(ingredientStrings: string[]): Ingredient[] {
    return ingredientStrings.map(ingredientString => {
      const ingredient = this.parseIndividualIngredient(ingredientString);
      return {
        ...ingredient,
        category: this.categorizeIngredient(ingredient.name),
        allergens: this.detectAllergens(ingredient.name)
      };
    });
  }

  private parseIndividualIngredient(ingredientString: string): Ingredient {
    // Parse quantity and unit from ingredient string
    const quantityMatch = ingredientString.match(/^([\d\.]+)\s*([a-zA-Z]+)?\s+(.+)$/);
    
    if (quantityMatch) {
      const [, quantity, unit, name] = quantityMatch;
      return {
        name: name.trim(),
        quantity: parseFloat(quantity),
        unit: unit || 'piece'
      };
    }
    
    return {
      name: ingredientString.trim()
    };
  }

  private categorizeIngredient(ingredientName: string): IngredientCategory {
    const name = ingredientName.toLowerCase();
    
    // Protein sources
    if (/chicken|beef|pork|fish|salmon|tuna|egg|tofu|beans|lentils|quinoa/.test(name)) {
      return IngredientCategory.PROTEIN;
    }
    
    // Vegetables
    if (/broccoli|spinach|lettuce|tomato|carrot|onion|pepper|cucumber|celery|kale/.test(name)) {
      return IngredientCategory.VEGETABLE;
    }
    
    // Fruits
    if (/apple|banana|berry|orange|grape|lemon|lime|avocado|mango/.test(name)) {
      return IngredientCategory.FRUIT;
    }
    
    // Grains
    if (/rice|pasta|bread|oats|wheat|barley|corn|flour/.test(name)) {
      return IngredientCategory.GRAIN;
    }
    
    // Dairy
    if (/milk|cheese|yogurt|butter|cream|ice cream/.test(name)) {
      return IngredientCategory.DAIRY;
    }
    
    // Fats
    if (/oil|nuts|seeds|avocado|olive/.test(name)) {
      return IngredientCategory.FAT;
    }
    
    // Spices and seasonings
    if (/salt|pepper|garlic|herb|spice|cinnamon|oregano|basil/.test(name)) {
      return IngredientCategory.SPICE;
    }
    
    return IngredientCategory.OTHER;
  }

  private detectAllergens(ingredientName: string): string[] {
    const allergens: string[] = [];
    const name = ingredientName.toLowerCase();
    
    if (/milk|cheese|yogurt|butter|cream|lactose/.test(name)) {
      allergens.push('dairy');
    }
    if (/wheat|flour|bread|pasta|gluten/.test(name)) {
      allergens.push('gluten');
    }
    if (/nuts|peanut|almond|walnut|cashew/.test(name)) {
      allergens.push('nuts');
    }
    if (/egg/.test(name)) {
      allergens.push('eggs');
    }
    if (/fish|salmon|tuna|shellfish|shrimp|crab/.test(name)) {
      allergens.push('seafood');
    }
    if (/soy|soybeans|tofu/.test(name)) {
      allergens.push('soy');
    }
    
    return allergens;
  }

  // Calculate health score based on ingredients and nutrition
  calculateHealthScore(ingredients: Ingredient[], nutrition: any): number {
    let score = 50; // Base score
    
    // Boost score for healthy ingredients
    const healthyCount = ingredients.filter(ing => 
      ing.category === IngredientCategory.VEGETABLE || 
      ing.category === IngredientCategory.FRUIT ||
      (ing.category === IngredientCategory.PROTEIN && !ing.name.toLowerCase().includes('fried'))
    ).length;
    
    score += healthyCount * 8;
    
    // Reduce score for unhealthy indicators
    const unhealthyCount = ingredients.filter(ing => 
      ing.name.toLowerCase().includes('fried') ||
      ing.name.toLowerCase().includes('sugar') ||
      ing.name.toLowerCase().includes('cream')
    ).length;
    
    score -= unhealthyCount * 10;
    
    // Adjust based on nutrition
    if (nutrition.calories > 800) score -= 10;
    if (nutrition.calories < 200) score -= 5;
    if (nutrition.protein > 20) score += 5;
    if (nutrition.fiber && nutrition.fiber > 5) score += 5;
    
    return Math.max(0, Math.min(100, score));
  }

  // Generate mock AI analysis scenarios
  private generateSaladAnalysis(): AIAnalysisWithInsights {
    return {
      detectedMeals: ['salad', 'greens', 'vegetables'],
      confidence: 88 + Math.random() * 10,
      estimatedCalories: 250 + Math.floor(Math.random() * 200),
      mealCategory: 'lunch' as MealType,
      ingredients: ['mixed greens', 'cherry tomatoes', 'cucumber', 'carrots', 'dressing'],
      insights: {
        healthScore: 85 + Math.floor(Math.random() * 15),
        nutritionBalance: 'High fiber, low calories',
        recommendations: [
          'Great source of vitamins and minerals!',
          'Consider adding protein like grilled chicken'
        ],
        portionSize: PortionSize.MEDIUM,
        cookingMethod: CookingMethod.RAW,
        freshness: FreshnessIndicator.FRESH,
        allergenAlerts: []
      },
      alternativeNames: ['garden salad', 'mixed salad', 'green salad']
    };
  }

  private generatePastaAnalysis(): AIAnalysisWithInsights {
    return {
      detectedMeals: ['pasta', 'spaghetti', 'tomato sauce'],
      confidence: 92 + Math.random() * 8,
      estimatedCalories: 450 + Math.floor(Math.random() * 250),
      mealCategory: 'dinner' as MealType,
      ingredients: ['pasta', 'tomato sauce', 'basil', 'parmesan cheese'],
      insights: {
        healthScore: 65 + Math.floor(Math.random() * 20),
        nutritionBalance: 'High carbs, moderate protein',
        recommendations: [
          'Good source of energy',
          'Consider adding vegetables for more nutrients'
        ],
        warnings: ['High in refined carbohydrates'],
        portionSize: PortionSize.LARGE,
        cookingMethod: CookingMethod.BOILED,
        freshness: FreshnessIndicator.FRESH
      },
      alternativeNames: ['spaghetti', 'pasta marinara', 'tomato pasta']
    };
  }

  private generateSandwichAnalysis(): AIAnalysisWithInsights {
    return {
      detectedMeals: ['sandwich', 'bread', 'filling'],
      confidence: 85 + Math.random() * 10,
      estimatedCalories: 380 + Math.floor(Math.random() * 220),
      mealCategory: 'lunch' as MealType,
      ingredients: ['bread', 'turkey', 'lettuce', 'tomato', 'mayo'],
      insights: {
        healthScore: 70 + Math.floor(Math.random() * 15),
        nutritionBalance: 'Balanced macros',
        recommendations: [
          'Good protein source',
          'Try whole grain bread for more fiber'
        ],
        portionSize: PortionSize.MEDIUM,
        cookingMethod: CookingMethod.RAW,
        freshness: FreshnessIndicator.FRESH
      },
      alternativeNames: ['sub', 'hoagie', 'deli sandwich']
    };
  }

  private generateBurgerAnalysis(): AIAnalysisWithInsights {
    return {
      detectedMeals: ['burger', 'hamburger', 'bun'],
      confidence: 90 + Math.random() * 10,
      estimatedCalories: 550 + Math.floor(Math.random() * 300),
      mealCategory: 'lunch' as MealType,
      ingredients: ['beef patty', 'bun', 'lettuce', 'tomato', 'cheese'],
      insights: {
        healthScore: 45 + Math.floor(Math.random() * 20),
        nutritionBalance: 'High calories, high fat',
        recommendations: [
          'Rich in protein',
          'Consider a smaller portion'
        ],
        warnings: ['High in saturated fat', 'High calorie content'],
        portionSize: PortionSize.LARGE,
        cookingMethod: CookingMethod.GRILLED,
        freshness: FreshnessIndicator.FRESH
      },
      alternativeNames: ['cheeseburger', 'hamburger', 'beef burger']
    };
  }

  private generateSoupAnalysis(): AIAnalysisWithInsights {
    return {
      detectedMeals: ['soup', 'broth', 'vegetables'],
      confidence: 82 + Math.random() * 15,
      estimatedCalories: 180 + Math.floor(Math.random() * 150),
      mealCategory: 'lunch' as MealType,
      ingredients: ['broth', 'vegetables', 'herbs', 'spices'],
      insights: {
        healthScore: 80 + Math.floor(Math.random() * 15),
        nutritionBalance: 'Low calories, high in vitamins',
        recommendations: [
          'Great for hydration',
          'Good source of vitamins and minerals'
        ],
        portionSize: PortionSize.MEDIUM,
        cookingMethod: CookingMethod.BOILED,
        freshness: FreshnessIndicator.FRESH
      },
      alternativeNames: ['vegetable soup', 'broth', 'clear soup']
    };
  }

  // Utility methods
  private createMealError(
    code: MealErrorCode, 
    message: string, 
    details?: Record<string, any>, 
    suggestion?: string
  ): MealError {
    return {
      code,
      message,
      details,
      suggestion
    };
  }

  // Photo validation
  validatePhotoForAnalysis(photoUri: string): Promise<boolean> {
    return new Promise(async (resolve) => {
      try {
        const info = await FileSystem.getInfoAsync(photoUri);
        if (!info.exists) {
          resolve(false);
          return;
        }
        
        // Check file size (max 10MB)
        const maxSize = 10 * 1024 * 1024;
        if (info.size && info.size > maxSize) {
          resolve(false);
          return;
        }
        
        resolve(true);
      } catch (error) {
        resolve(false);
      }
    });
  }

  // Duplicate detection
  async detectDuplicateMeal(newMeal: Partial<Meal>, existingMeals: Meal[]): Promise<Meal[]> {
    const potentialDuplicates: Meal[] = [];
    
    // Check for meals within 30 minutes of each other
    const timeWindow = 30 * 60 * 1000; // 30 minutes
    
    for (const meal of existingMeals) {
      const timeDiff = Math.abs(meal.timestamp.getTime() - (newMeal.timestamp?.getTime() || Date.now()));
      
      if (timeDiff <= timeWindow) {
        // Check for ingredient similarity
        if (newMeal.ingredients && this.calculateIngredientSimilarity(newMeal.ingredients, meal.ingredients) > 0.7) {
          potentialDuplicates.push(meal);
        }
      }
    }
    
    return potentialDuplicates;
  }

  private calculateIngredientSimilarity(ingredients1: Ingredient[], ingredients2: Ingredient[]): number {
    if (ingredients1.length === 0 || ingredients2.length === 0) return 0;
    
    const names1 = ingredients1.map(ing => ing.name.toLowerCase());
    const names2 = ingredients2.map(ing => ing.name.toLowerCase());
    
    const intersection = names1.filter(name => names2.includes(name));
    const union = [...new Set([...names1, ...names2])];
    
    return intersection.length / union.length;
  }
}

export const mealProcessingService = new MealProcessingService();
