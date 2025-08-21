import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/lib/theme';
import { Meal } from '../types';
import { MealStorageService, generateMockMeals } from '../services/mealStorage';

interface RecentMealsProps {
  onSeeAll: () => void;
}

export default function RecentMeals({ onSeeAll }: RecentMealsProps) {
  const { theme } = useTheme();
  const [recentMeals, setRecentMeals] = useState<Meal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadRecentMeals();
  }, []);

  const loadRecentMeals = async () => {
    try {
      setIsLoading(true);
      let meals = await MealStorageService.getRecentMeals(6);
      
      // For development: add mock data if no meals exist
      if (meals.length === 0) {
        const mockMeals = generateMockMeals();
        meals = mockMeals.slice(0, 6);
      }
      
      setRecentMeals(meals);
    } catch (error) {
      console.error('Error loading recent meals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMealPress = (meal: Meal) => {
    // Navigate to meal detail for editing
    router.push({
      pathname: '/meal-detail',
      params: {
        mealId: meal.id,
        photoUri: meal.photoUri || '',
        isNew: 'false',
      },
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours === 0) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return diffInMinutes < 1 ? 'Just now' : `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return diffInDays === 1 ? 'Yesterday' : `${diffInDays}d ago`;
    }
  };

  const getMealTypeIcon = (mealType: string) => {
    switch (mealType.toLowerCase()) {
      case 'breakfast':
        return '🌅';
      case 'lunch':
        return '☀️';
      case 'dinner':
        return '🌙';
      case 'snack':
        return '🍎';
      default:
        return '🍽️';
    }
  };

  const renderMealCard = (meal: Meal) => (
    <TouchableOpacity
      key={meal.id}
      style={[styles.mealCard, { backgroundColor: theme.colors.surface }]}
      onPress={() => handleMealPress(meal)}
      activeOpacity={0.7}
    >
      {/* Photo */}
      <View style={styles.photoContainer}>
        {meal.photoUri ? (
          <Image source={{ uri: meal.photoUri }} style={styles.mealPhoto} />
        ) : (
          <View style={[styles.placeholderPhoto, { backgroundColor: theme.colors.border + '40' }]}>
            <Ionicons name="camera" size={24} color={theme.colors.textSecondary} />
          </View>
        )}
        
        {/* Verification badge */}
        {meal.isVerified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={16} color={theme.colors.secondary} />
          </View>
        )}
      </View>

      {/* Meal info */}
      <View style={styles.mealInfo}>
        <View style={styles.mealHeader}>
          <Text style={styles.mealEmoji}>{getMealTypeIcon(meal.mealType)}</Text>
          <Text style={[styles.mealName, { color: theme.colors.text }]} numberOfLines={1}>{meal.name}</Text>
        </View>
        
        <Text style={[styles.mealTime, { color: theme.colors.text }]}>{formatTime(meal.timestamp)}</Text>
        <Text style={[styles.relativeTime, { color: theme.colors.textSecondary }]}>{getRelativeTime(meal.timestamp)}</Text>
        
        <View style={styles.nutritionSummary}>
          <Text style={[styles.calories, { color: theme.colors.primary }]}>{meal.nutrition.calories} cal</Text>
          <View style={styles.macros}>
            <Text style={[styles.macro, { color: theme.colors.textSecondary }]}>P: {meal.nutrition.protein}g</Text>
            <Text style={[styles.macro, { color: theme.colors.textSecondary }]}>C: {meal.nutrition.carbs}g</Text>
            <Text style={[styles.macro, { color: theme.colors.textSecondary }]}>F: {meal.nutrition.fat}g</Text>
          </View>
        </View>
      </View>

      {/* Edit indicator */}
      <View style={styles.editIndicator}>
        <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Recent Meals</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading meals...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.header}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Recent Meals</Text>
        <TouchableOpacity onPress={onSeeAll} style={styles.seeAllButton}>
          <Text style={[styles.seeAllText, { color: theme.colors.primary }]}>See All</Text>
          <Ionicons name="chevron-forward" size={16} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Meals List */}
      {recentMeals.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="camera-outline" size={48} color={theme.colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No meals yet</Text>
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>Take your first photo to start tracking!</Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
          style={styles.scrollView}
        >
          {recentMeals.map(renderMealCard)}
          
          {/* Add meal card */}
          <TouchableOpacity
            style={[styles.addMealCard, { backgroundColor: theme.colors.primary + '20', borderColor: theme.colors.primary + '40' }]}
            onPress={() => router.push('/')} // Go back to camera
            activeOpacity={0.7}
          >
            <View style={[styles.addMealIcon, { backgroundColor: theme.colors.primary + '30' }]}>
              <Ionicons name="add" size={32} color={theme.colors.primary} />
            </View>
            <Text style={[styles.addMealText, { color: theme.colors.primary }]}>Add Meal</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  scrollView: {
    marginHorizontal: -16, // Counteract parent padding
  },
  scrollContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  mealCard: {
    width: 140,
    borderRadius: 12,
    overflow: 'hidden',
  },
  photoContainer: {
    position: 'relative',
    height: 80,
  },
  mealPhoto: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderPhoto: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    padding: 2,
  },
  mealInfo: {
    padding: 12,
    flex: 1,
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  mealEmoji: {
    fontSize: 14,
  },
  mealName: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  mealTime: {
    fontSize: 12,
    fontWeight: '500',
  },
  relativeTime: {
    fontSize: 10,
    marginBottom: 8,
  },
  nutritionSummary: {
    gap: 4,
  },
  calories: {
    fontSize: 12,
    fontWeight: '600',
  },
  macros: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macro: {
    fontSize: 10,
    flex: 1,
    textAlign: 'center',
  },
  editIndicator: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    padding: 4,
  },
  addMealCard: {
    width: 140,
    height: 140,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  addMealIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addMealText: {
    fontSize: 12,
    fontWeight: '600',
  },
});