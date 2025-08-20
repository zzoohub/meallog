import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Meal } from "@/domains/meals/types";
import { OptimizedImage } from "../OptimizedImage";

interface MealItemProps {
  meal: Meal;
  onPress: (meal: Meal) => void;
}

export const MealItem = React.memo(({ meal, onPress }: MealItemProps) => {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getMealTypeIcon = (mealType: string) => {
    switch (mealType.toLowerCase()) {
      case "breakfast":
        return "🌅";
      case "lunch":
        return "☀️";
      case "dinner":
        return "🌙";
      case "snack":
        return "🍎";
      default:
        return "🍽️";
    }
  };

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={() => onPress(meal)} 
      activeOpacity={0.7}
    >
      <View style={styles.photoContainer}>
        <OptimizedImage
          source={{ uri: meal.photoUri || '' }}
          style={styles.photo}
          priority="low"
          cachePolicy="memory-disk"
          showPlaceholder={true}
          placeholderIcon="camera"
          fadeDuration={200}
        />

        {meal.isVerified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={12} color="#4ECDC4" />
          </View>
        )}
      </View>

      <View style={styles.details}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={styles.emoji}>{getMealTypeIcon(meal.mealType)}</Text>
            <Text style={styles.name} numberOfLines={1}>
              {meal.name}
            </Text>
            <Text style={styles.time}>{formatTime(meal.timestamp)}</Text>
          </View>

          {meal.aiAnalysis?.insights && (
            <View style={styles.insightsPreview}>
              <View style={styles.healthScore}>
                <Ionicons name="fitness" size={12} color="#4ECDC4" />
                <Text style={styles.healthScoreText}>{meal.aiAnalysis.insights.healthScore}/100</Text>
              </View>
              <Text style={styles.nutritionBalance} numberOfLines={1}>
                {meal.aiAnalysis.insights.nutritionBalance}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.nutritionRow}>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{meal.nutrition.calories}</Text>
            <Text style={styles.nutritionLabel}>cal</Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{meal.nutrition.protein}g</Text>
            <Text style={styles.nutritionLabel}>protein</Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{meal.nutrition.carbs}g</Text>
            <Text style={styles.nutritionLabel}>carbs</Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{meal.nutrition.fat}g</Text>
            <Text style={styles.nutritionLabel}>fat</Text>
          </View>
        </View>

        <View style={styles.ingredientsPreview}>
          <Text style={styles.ingredientsText} numberOfLines={2}>
            {meal.ingredients.join(", ")}
          </Text>
        </View>

        {meal.aiAnalysis?.insights?.recommendations && meal.aiAnalysis.insights.recommendations.length > 0 && (
          <View style={styles.recommendationPreview}>
            <Ionicons name="bulb" size={12} color="#FFD700" />
            <Text style={styles.recommendationText} numberOfLines={1}>
              {meal.aiAnalysis.insights.recommendations[0]}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.editArrow}>
        <Ionicons name="chevron-forward" size={20} color="rgba(255, 255, 255, 0.3)" />
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: "flex-start",
  },
  photoContainer: {
    position: "relative",
    marginRight: 16,
  },
  photo: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  verifiedBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    borderRadius: 8,
    padding: 2,
  },
  details: {
    flex: 1,
    gap: 8,
  },
  header: {
    gap: 4,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  emoji: {
    fontSize: 16,
  },
  name: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  time: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
  },
  insightsPreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  healthScore: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  healthScoreText: {
    color: "#4ECDC4",
    fontSize: 12,
    fontWeight: "600",
  },
  nutritionBalance: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 12,
    flex: 1,
  },
  nutritionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  nutritionItem: {
    alignItems: "center",
    flex: 1,
  },
  nutritionValue: {
    color: "#FF6B35",
    fontSize: 14,
    fontWeight: "600",
  },
  nutritionLabel: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 10,
  },
  ingredientsPreview: {
    paddingTop: 4,
  },
  ingredientsText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 12,
    lineHeight: 16,
  },
  recommendationPreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingTop: 4,
  },
  recommendationText: {
    color: "#FFD700",
    fontSize: 12,
    fontStyle: "italic",
    flex: 1,
  },
  editArrow: {
    justifyContent: "center",
    marginLeft: 8,
  },
});