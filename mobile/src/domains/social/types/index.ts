import { MealType, Location, NutritionInfo, AIAnalysis } from "../../meals/types";

// Social/Post domain types
export interface Post {
  id: string;
  userId: string;
  username: string;
  content: string;
  images: string[];
  likes: number;
  isLiked: boolean;
  mealType?: MealType;
  location?: Location;
  nutritionInfo?: NutritionInfo;
  aiAnalysis?: AIAnalysis;
  createdAt: Date;
  updatedAt: Date;
}
