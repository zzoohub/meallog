import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/lib/theme";
import { Meal } from "@/domains/meals/types";
import { OptimizedImage } from "../OptimizedImage";

interface MealItemProps {
  meal: Meal;
  onPress: (meal: Meal) => void;
}

export const MealItem = React.memo(function MealItem({ meal, onPress }: MealItemProps) {
  const { theme } = useTheme();
  
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
      style={[styles.container, { backgroundColor: theme.colors.surface }]} 
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
            <Ionicons name="checkmark-circle" size={12} color={theme.colors.success} />
          </View>
        )}
      </View>

      <View style={styles.details}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={styles.emoji}>{getMealTypeIcon(meal.mealType)}</Text>
            <Text style={[styles.name, { color: theme.colors.text }]} numberOfLines={1}>
              {meal.name}
            </Text>
            <Text style={[styles.time, { color: theme.colors.textSecondary }]}>{formatTime(meal.timestamp)}</Text>
          </View>

          {meal.aiAnalysis?.insights && (
            <View style={styles.insightsPreview}>
              <View style={styles.healthScore}>
                <Ionicons name="fitness" size={12} color={theme.colors.success} />
                <Text style={[styles.healthScoreText, { color: theme.colors.success }]}>{meal.aiAnalysis.insights.healthScore}/100</Text>
              </View>
              <Text style={[styles.nutritionBalance, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                {meal.aiAnalysis.insights.nutritionBalance}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.nutritionRow}>
          <View style={styles.nutritionItem}>
            <Text style={[styles.nutritionValue, { color: theme.colors.primary }]}>{meal.nutrition.calories}</Text>
            <Text style={[styles.nutritionLabel, { color: theme.colors.textSecondary }]}>cal</Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={[styles.nutritionValue, { color: theme.colors.primary }]}>{meal.nutrition.protein}g</Text>
            <Text style={[styles.nutritionLabel, { color: theme.colors.textSecondary }]}>protein</Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={[styles.nutritionValue, { color: theme.colors.primary }]}>{meal.nutrition.carbs}g</Text>
            <Text style={[styles.nutritionLabel, { color: theme.colors.textSecondary }]}>carbs</Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={[styles.nutritionValue, { color: theme.colors.primary }]}>{meal.nutrition.fat}g</Text>
            <Text style={[styles.nutritionLabel, { color: theme.colors.textSecondary }]}>fat</Text>
          </View>
        </View>

        <View style={styles.ingredientsPreview}>
          <Text style={[styles.ingredientsText, { color: theme.colors.textSecondary }]} numberOfLines={2}>
            {meal.ingredients.join(", ")}
          </Text>
        </View>

        {meal.aiAnalysis?.insights?.recommendations && meal.aiAnalysis.insights.recommendations.length > 0 && (
          <View style={styles.recommendationPreview}>
            <Ionicons name="bulb" size={12} color={theme.colors.warning} />
            <Text style={[styles.recommendationText, { color: theme.colors.warning }]} numberOfLines={1}>
              {meal.aiAnalysis.insights.recommendations[0]}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.editArrow}>
        <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
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
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  time: {
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
    fontSize: 12,
    fontWeight: "600",
  },
  nutritionBalance: {
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
    fontSize: 14,
    fontWeight: "600",
  },
  nutritionLabel: {
    fontSize: 10,
  },
  ingredientsPreview: {
    paddingTop: 4,
  },
  ingredientsText: {
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
    fontSize: 12,
    fontStyle: "italic",
    flex: 1,
  },
  editArrow: {
    justifyContent: "center",
    marginLeft: 8,
  },
});