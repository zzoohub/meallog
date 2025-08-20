import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  SectionList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Meal, MealHistoryFilter } from '@/domains/meals/types';
import { MealStorageService, generateMockMeals } from '@/domains/meals/services/mealStorage';
import { MealType } from '@/types';

interface MealSection {
  title: string;
  data: Meal[];
}

export default function MealHistory() {
  const router = useRouter();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [sections, setSections] = useState<MealSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<MealType | 'all'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  useEffect(() => {
    loadMeals();
  }, [searchQuery, selectedFilter]);

  const loadMeals = async () => {
    try {
      setIsLoading(true);
      
      const filter: MealHistoryFilter = {};
      if (searchQuery) filter.searchQuery = searchQuery;
      if (selectedFilter !== 'all') filter.mealType = selectedFilter as MealType;
      
      let loadedMeals = await MealStorageService.getMealsFiltered(filter);
      
      // For development: add mock data if no meals exist
      if (loadedMeals.length === 0 && !searchQuery && selectedFilter === 'all') {
        const mockMeals = generateMockMeals();
        // Save mock meals to storage for persistence
        for (const mockMeal of mockMeals) {
          try {
            await MealStorageService.saveMeal({
              userId: mockMeal.userId,
              name: mockMeal.name,
              photoUri: mockMeal.photoUri,
              timestamp: mockMeal.timestamp,
              mealType: mockMeal.mealType,
              nutrition: mockMeal.nutrition,
              ingredients: mockMeal.ingredients,
              aiAnalysis: mockMeal.aiAnalysis,
              isVerified: mockMeal.isVerified,
            });
          } catch (error) {
            console.error('Error saving mock meal:', error);
          }
        }
        loadedMeals = await MealStorageService.getMealsFiltered(filter);
      }
      
      setMeals(loadedMeals);
      setSections(groupMealsByDate(loadedMeals));
    } catch (error) {
      console.error('Error loading meals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const groupMealsByDate = (meals: Meal[]): MealSection[] => {
    const grouped = meals.reduce((acc, meal) => {
      const date = meal.timestamp.toDateString();
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(meal);
      return acc;
    }, {} as Record<string, Meal[]>);

    return Object.entries(grouped)
      .map(([date, meals]) => ({
        title: formatSectionDate(new Date(date)),
        data: meals.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()),
      }))
      .sort((a, b) => new Date(b.data[0].timestamp).getTime() - new Date(a.data[0].timestamp).getTime());
  };

  const formatSectionDate = (date: Date): string => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const handleMealPress = (meal: Meal) => {
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

  const renderMealItem = ({ item: meal }: { item: Meal }) => (
    <TouchableOpacity
      style={styles.mealItem}
      onPress={() => handleMealPress(meal)}
      activeOpacity={0.7}
    >
      {/* Photo */}
      <View style={styles.mealPhotoContainer}>
        {meal.photoUri ? (
          <Image source={{ uri: meal.photoUri }} style={styles.mealPhoto} />
        ) : (
          <View style={styles.placeholderPhoto}>
            <Ionicons name="camera" size={20} color="rgba(255, 255, 255, 0.3)" />
          </View>
        )}
        
        {/* Verification badge */}
        {meal.isVerified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={12} color="#4ECDC4" />
          </View>
        )}
      </View>

      {/* Meal Details */}
      <View style={styles.mealDetails}>
        <View style={styles.mealHeader}>
          <View style={styles.mealTitleRow}>
            <Text style={styles.mealEmoji}>{getMealTypeIcon(meal.mealType)}</Text>
            <Text style={styles.mealName} numberOfLines={1}>{meal.name}</Text>
            <Text style={styles.mealTime}>{formatTime(meal.timestamp)}</Text>
          </View>
          
          {/* AI Insights Preview */}
          {meal.aiAnalysis?.insights && (
            <View style={styles.insightsPreview}>
              <View style={styles.healthScore}>
                <Ionicons name="fitness" size={12} color="#4ECDC4" />
                <Text style={styles.healthScoreText}>
                  {meal.aiAnalysis.insights.healthScore}/100
                </Text>
              </View>
              <Text style={styles.nutritionBalance} numberOfLines={1}>
                {meal.aiAnalysis.insights.nutritionBalance}
              </Text>
            </View>
          )}
        </View>

        {/* Nutrition Summary */}
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

        {/* Ingredients Preview */}
        <View style={styles.ingredientsPreview}>
          <Text style={styles.ingredientsText} numberOfLines={2}>
            {meal.ingredients.join(', ')}
          </Text>
        </View>

        {/* AI Recommendations */}
        {meal.aiAnalysis?.insights?.recommendations && meal.aiAnalysis.insights.recommendations.length > 0 && (
          <View style={styles.recommendationPreview}>
            <Ionicons name="bulb" size={12} color="#FFD700" />
            <Text style={styles.recommendationText} numberOfLines={1}>
              {meal.aiAnalysis.insights.recommendations[0]}
            </Text>
          </View>
        )}
      </View>

      {/* Edit Arrow */}
      <View style={styles.editArrow}>
        <Ionicons name="chevron-forward" size={20} color="rgba(255, 255, 255, 0.3)" />
      </View>
    </TouchableOpacity>
  );

  const renderSectionHeader = ({ section }: { section: MealSection }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      <Text style={styles.sectionCount}>{section.data.length} meals</Text>
    </View>
  );

  const filterButtons = [
    { key: 'all', label: 'All', icon: 'grid' },
    { key: MealType.BREAKFAST, label: 'Breakfast', icon: 'sunny' },
    { key: MealType.LUNCH, label: 'Lunch', icon: 'partly-sunny' },
    { key: MealType.DINNER, label: 'Dinner', icon: 'moon' },
    { key: MealType.SNACK, label: 'Snacks', icon: 'nutrition' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meal History</Text>
        <TouchableOpacity 
          onPress={() => setViewMode(viewMode === 'list' ? 'calendar' : 'list')}
          style={styles.viewToggle}
        >
          <Ionicons 
            name={viewMode === 'list' ? 'calendar' : 'list'} 
            size={24} 
            color="white" 
          />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="rgba(255, 255, 255, 0.5)" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search meals or ingredients..."
            placeholderTextColor="rgba(255, 255, 255, 0.5)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="rgba(255, 255, 255, 0.5)" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Buttons */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterContainer}
        style={styles.filterScrollView}
      >
        {filterButtons.map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterButton,
              selectedFilter === filter.key && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedFilter(filter.key as MealType | 'all')}
          >
            <Ionicons
              name={filter.icon as any}
              size={16}
              color={selectedFilter === filter.key ? 'white' : 'rgba(255, 255, 255, 0.7)'}
            />
            <Text
              style={[
                styles.filterButtonText,
                selectedFilter === filter.key && styles.filterButtonTextActive,
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>Loading your meals...</Text>
        </View>
      ) : sections.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="restaurant-outline" size={64} color="rgba(255, 255, 255, 0.3)" />
          <Text style={styles.emptyTitle}>No meals found</Text>
          <Text style={styles.emptyText}>
            {searchQuery || selectedFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Start logging meals to see your history here!'}
          </Text>
          <TouchableOpacity
            style={styles.addMealButton}
            onPress={() => router.push('/')}
          >
            <Ionicons name="camera" size={20} color="white" />
            <Text style={styles.addMealButtonText}>Take Photo</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={renderMealItem}
          renderSectionHeader={renderSectionHeader}
          style={styles.mealsList}
          contentContainerStyle={styles.mealsListContent}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  viewToggle: {
    padding: 4,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    color: 'white',
    fontSize: 16,
  },
  filterScrollView: {
    marginBottom: 16,
  },
  filterContainer: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  filterButtonActive: {
    backgroundColor: '#FF6B35',
  },
  filterButtonText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: 'white',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 16,
  },
  emptyTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '600',
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  addMealButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B35',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  addMealButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  mealsList: {
    flex: 1,
  },
  mealsListContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#000000',
  },
  sectionTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  sectionCount: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14,
  },
  mealItem: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  mealPhotoContainer: {
    position: 'relative',
    marginRight: 16,
  },
  mealPhoto: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  placeholderPhoto: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 8,
    padding: 2,
  },
  mealDetails: {
    flex: 1,
    gap: 8,
  },
  mealHeader: {
    gap: 4,
  },
  mealTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mealEmoji: {
    fontSize: 16,
  },
  mealName: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  mealTime: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
  },
  insightsPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  healthScore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  healthScoreText: {
    color: '#4ECDC4',
    fontSize: 12,
    fontWeight: '600',
  },
  nutritionBalance: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    flex: 1,
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  nutritionItem: {
    alignItems: 'center',
    flex: 1,
  },
  nutritionValue: {
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: '600',
  },
  nutritionLabel: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 10,
  },
  ingredientsPreview: {
    paddingTop: 4,
  },
  ingredientsText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    lineHeight: 16,
  },
  recommendationPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 4,
  },
  recommendationText: {
    color: '#FFD700',
    fontSize: 12,
    fontStyle: 'italic',
    flex: 1,
  },
  editArrow: {
    justifyContent: 'center',
    marginLeft: 8,
  },
});