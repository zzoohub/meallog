import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  SectionList,
  Modal,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Meal, MealHistoryFilter } from "@/domains/meals/types";
import { MealStorageService, generateMockMeals } from "@/domains/meals/services/mealStorage";
import { useTimelineI18n } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";

interface MealSection {
  title: string;
  data: Meal[];
}

export default function MealHistory() {
  const { theme } = useTheme();
  const router = useRouter();
  const timeline = useTimelineI18n();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [sections, setSections] = useState<MealSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showDateRangeModal, setShowDateRangeModal] = useState(false);
  const [markedDates, setMarkedDates] = useState<{ [key: string]: any }>({});
  const [mockDataGenerated, setMockDataGenerated] = useState(false);
  const ITEMS_PER_PAGE = 20;

  // Date range calendar functions
  const updateMarkedDates = useCallback(() => {
    const marked: { [key: string]: any } = {};

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      // Mark the start date
      const startDateString = start.toISOString().split("T")[0];
      if (startDateString) {
        marked[startDateString] = {
          startingDay: true,
          color: "#FF6B35",
          textColor: "white",
        };
      }

      // Mark the end date
      const endDateString = end.toISOString().split("T")[0];
      if (endDateString) {
        marked[endDateString] = {
          endingDay: true,
          color: "#FF6B35",
          textColor: "white",
        };
      }

      // Mark dates in between
      const currentDate = new Date(start);
      currentDate.setDate(currentDate.getDate() + 1);

      while (currentDate < end) {
        const dateString = currentDate.toISOString().split("T")[0];
        if (dateString) {
          marked[dateString] = {
            color: "#FF6B35",
            textColor: "white",
          };
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
    } else if (startDate) {
      const startDateString = startDate.toISOString().split("T")[0];
      if (startDateString) {
        marked[startDateString] = {
          selected: true,
          selectedColor: "#FF6B35",
        };
      }
    } else if (endDate) {
      const endDateString = endDate.toISOString().split("T")[0];
      if (endDateString) {
        marked[endDateString] = {
          selected: true,
          selectedColor: "#FF6B35",
        };
      }
    }

    setMarkedDates(marked);
  }, [startDate, endDate]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setPage(1);
        setHasMore(true);

        const filter: MealHistoryFilter = {};
        if (searchQuery) filter.searchQuery = searchQuery;
        if (startDate) filter.startDate = startDate;
        if (endDate) filter.endDate = endDate;

        let loadedMeals = await MealStorageService.getMealsFiltered(filter);

        // For development: add mock data if no meals exist (only once)
        if (loadedMeals.length === 0 && !searchQuery && !mockDataGenerated) {
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
                location: mockMeal.location,
                notes: mockMeal.notes,
                isVerified: mockMeal.isVerified,
              });
            } catch (error) {
              console.error("Error saving mock meal:", error);
            }
          }
          setMockDataGenerated(true);
          loadedMeals = await MealStorageService.getMealsFiltered(filter);
        }

        const endIndex = ITEMS_PER_PAGE;
        const paginatedMeals = loadedMeals.slice(0, endIndex);

        setMeals(paginatedMeals);
        
        // Group meals by date inline
        const grouped = paginatedMeals.reduce((acc, meal) => {
          const date = meal.timestamp.toDateString();
          if (!acc[date]) {
            acc[date] = [];
          }
          acc[date].push(meal);
          return acc;
        }, {} as Record<string, Meal[]>);

        const sections = Object.entries(grouped)
          .map(([date, meals]) => {
            // Format section date inline
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
              data: meals.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()),
            };
          })
          .sort((a, b) => (b.data[0]?.timestamp?.getTime() ?? 0) - (a.data[0]?.timestamp?.getTime() ?? 0));
        
        setSections(sections);
        setHasMore(endIndex < loadedMeals.length);
      } catch (error) {
        console.error("Error loading meals:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [searchQuery, startDate, endDate, mockDataGenerated]);

  useEffect(() => {
    updateMarkedDates();
  }, [updateMarkedDates]);

  // Meal list functions
  const handleMealPress = (meal: Meal) => {
    router.push({
      pathname: "/meal-detail",
      params: {
        mealId: meal.id,
        photoUri: meal.photoUri || "",
        isNew: "false",
      },
    });
  };

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

  // Memoized meal item component for better performance
  const MealItem = React.memo(function MealItem({ meal }: { meal: Meal }) {
    return (
    <TouchableOpacity style={[styles.mealItem, { backgroundColor: theme.colors.surface }]} onPress={() => handleMealPress(meal)} activeOpacity={0.7}>
      {/* Photo */}
      <View style={styles.mealPhotoContainer}>
        {meal.photoUri ? (
          <Image source={{ uri: meal.photoUri }} style={styles.mealPhoto} />
        ) : (
          <View style={[styles.placeholderPhoto, { backgroundColor: theme.colors.border }]}>
            <Ionicons name="camera" size={20} color={theme.colors.textSecondary} />
          </View>
        )}

        {/* Verification badge */}
        {meal.isVerified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={12} color={theme.colors.secondary} />
          </View>
        )}
      </View>

      {/* Meal Details */}
      <View style={styles.mealDetails}>
        <View style={styles.mealHeader}>
          <View style={styles.mealTitleRow}>
            <Text style={styles.mealEmoji}>{getMealTypeIcon(meal.mealType)}</Text>
            <Text style={[styles.mealName, { color: theme.colors.text }]} numberOfLines={1}>
              {meal.name}
            </Text>
            <Text style={[styles.mealTime, { color: theme.colors.textSecondary }]}>{formatTime(meal.timestamp)}</Text>
          </View>

          {/* AI Insights Preview */}
          {meal.aiAnalysis?.insights && (
            <View style={styles.insightsPreview}>
              <View style={styles.healthScore}>
                <Ionicons name="fitness" size={12} color={theme.colors.secondary} />
                <Text style={[styles.healthScoreText, { color: theme.colors.secondary }]}>{meal.aiAnalysis.insights.healthScore}/100</Text>
              </View>
              <Text style={[styles.nutritionBalance, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                {meal.aiAnalysis.insights.nutritionBalance}
              </Text>
            </View>
          )}
        </View>

        {/* Nutrition Summary */}
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

        {/* Ingredients Preview */}
        <View style={styles.ingredientsPreview}>
          <Text style={[styles.ingredientsText, { color: theme.colors.textSecondary }]} numberOfLines={2}>
            {meal.ingredients.join(", ")}
          </Text>
        </View>

        {/* AI Recommendations */}
        {meal.aiAnalysis?.insights?.recommendations && meal.aiAnalysis.insights.recommendations.length > 0 && (
          <View style={styles.recommendationPreview}>
            <Ionicons name="bulb" size={12} color={theme.colors.warning} />
            <Text style={[styles.recommendationText, { color: theme.colors.warning }]} numberOfLines={1}>
              {meal.aiAnalysis.insights.recommendations[0]}
            </Text>
          </View>
        )}
      </View>

      {/* Edit Arrow */}
      <View style={styles.editArrow}>
        <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
      </View>
    </TouchableOpacity>
    );
  });

  const renderMealItem = ({ item: meal }: { item: Meal }) => <MealItem meal={meal} />;

  const renderSectionHeader = ({ section }: { section: MealSection }) => (
    <View style={[styles.sectionHeader, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{section.title}</Text>
      <Text style={[styles.sectionCount, { color: theme.colors.textSecondary }]}>
        {section.data.length} {timeline.stat("meals")}
      </Text>
    </View>
  );

  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    
    try {
      setIsLoadingMore(true);

      const filter: MealHistoryFilter = {};
      if (searchQuery) filter.searchQuery = searchQuery;
      if (startDate) filter.startDate = startDate;
      if (endDate) filter.endDate = endDate;

      const loadedMeals = await MealStorageService.getMealsFiltered(filter);
      
      const startIndex = page * ITEMS_PER_PAGE;
      const endIndex = startIndex + ITEMS_PER_PAGE;
      const newMeals = loadedMeals.slice(startIndex, endIndex);

      if (newMeals.length > 0) {
        setMeals(prev => [...prev, ...newMeals]);
        setPage(prev => prev + 1);
        
        // Update sections with all meals
        const allMeals = [...meals, ...newMeals];
        const grouped = allMeals.reduce((acc, meal) => {
          const date = meal.timestamp.toDateString();
          if (!acc[date]) {
            acc[date] = [];
          }
          acc[date].push(meal);
          return acc;
        }, {} as Record<string, Meal[]>);

        const sections = Object.entries(grouped)
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
              data: meals.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()),
            };
          })
          .sort((a, b) => (b.data[0]?.timestamp?.getTime() ?? 0) - (a.data[0]?.timestamp?.getTime() ?? 0));
        
        setSections(sections);
      }
      
      setHasMore(endIndex < loadedMeals.length);
    } catch (error) {
      console.error("Error loading more meals:", error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, searchQuery, startDate, endDate, page, meals]);

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.loadingMoreContainer}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
        <Text style={[styles.loadingMoreText, { color: theme.colors.textSecondary }]}>{timeline.loadMore}</Text>
      </View>
    );
  };

  // Date selection functions
  const handleDayPress = (day: any) => {
    const selectedDate = new Date(day.dateString);

    if (!startDate || (startDate && endDate)) {
      // Starting a new selection
      setStartDate(selectedDate);
      setEndDate(null);
    } else if (startDate && !endDate) {
      // Selecting end date
      if (selectedDate >= startDate) {
        setEndDate(selectedDate);
      } else {
        // If selected date is before start date, make it the new start date
        setStartDate(selectedDate);
        setEndDate(null);
      }
    }
  };

  const clearDateFilter = () => {
    setStartDate(null);
    setEndDate(null);
  };

  const formatDateRange = () => {
    if (!startDate && !endDate) return "All time";
    if (startDate && endDate) {
      return `${startDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })} - ${endDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
    }
    if (startDate) {
      return `From ${startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
    }
    if (endDate) {
      return `Until ${endDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
    }
    return "All time";
  };

  const setDateRangePreset = (days: number | null) => {
    if (days === null) {
      setStartDate(null);
      setEndDate(null);
    } else {
      const today = new Date();
      const start = new Date();
      start.setDate(today.getDate() - days + 1);
      start.setHours(0, 0, 0, 0);

      const end = new Date();
      end.setHours(23, 59, 59, 999);

      setStartDate(start);
      setEndDate(end);
    }
    setShowDateRangeModal(false);
  };

  const openDateRangeModal = () => {
    setShowDateRangeModal(true);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>{timeline.mealHistory}</Text>
        <TouchableOpacity onPress={openDateRangeModal} style={styles.dateButton}>
          <Ionicons name="calendar" size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: theme.colors.surface }]}>
          <Ionicons name="search" size={20} color={theme.colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.text }]}
            placeholder={timeline.searchPlaceholder}
            placeholderTextColor={theme.colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Date Range Filter */}
      <View style={styles.dateFilterContainer}>
        <TouchableOpacity style={[styles.dateRangeButton, { backgroundColor: theme.colors.surface }]} onPress={openDateRangeModal}>
          <Ionicons name="calendar-outline" size={16} color={theme.colors.primary} />
          <Text style={[styles.dateRangeText, { color: theme.colors.textSecondary }]}>{formatDateRange()}</Text>
        </TouchableOpacity>
        {(startDate || endDate) && (
          <TouchableOpacity style={[styles.clearDateButton, { backgroundColor: theme.colors.surface }]} onPress={clearDateFilter}>
            <Ionicons name="close" size={16} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>Loading your meals...</Text>
        </View>
      ) : sections.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="restaurant-outline" size={64} color={theme.colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>{timeline.noMealsFound}</Text>
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            {searchQuery ? "Try adjusting your search" : "Start logging meals to see your history here!"}
          </Text>
          <TouchableOpacity style={styles.addMealButton} onPress={() => router.push("/")}>
            <Ionicons name="camera" size={20} color="white" />
            <Text style={styles.addMealButtonText}>Quick Capture</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item: Meal) => item.id}
          renderItem={renderMealItem}
          renderSectionHeader={renderSectionHeader}
          ListFooterComponent={renderFooter}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          style={styles.mealsList}
          contentContainerStyle={styles.mealsListContent}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
        />
      )}

      {/* Date Range Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showDateRangeModal}
        onRequestClose={() => setShowDateRangeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.dateRangeModal, { backgroundColor: theme.colors.background }]}>
            <View style={[styles.dateRangeHeader, { borderBottomColor: theme.colors.border }]}>
              <Text style={[styles.dateRangeModalTitle, { color: theme.colors.text }]}>Select Date Range</Text>
              <TouchableOpacity onPress={() => setShowDateRangeModal(false)}>
                <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Quick Presets */}
            <View style={[styles.presetsContainer, { borderBottomColor: theme.colors.border }]}>
              <Text style={[styles.presetsTitle, { color: theme.colors.text }]}>Quick Select</Text>
              <View style={styles.presetsGrid}>
                <TouchableOpacity
                  style={[styles.presetButton, { backgroundColor: theme.colors.surface }, !startDate && !endDate && { backgroundColor: theme.colors.primary }]}
                  onPress={() => setDateRangePreset(null)}
                >
                  <Text style={[styles.presetButtonText, { color: theme.colors.textSecondary }, !startDate && !endDate && { color: theme.colors.primary }]}>
                    All Time
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.presetButton, { backgroundColor: theme.colors.surface }]} onPress={() => setDateRangePreset(1)}>
                  <Text style={[styles.presetButtonText, { color: theme.colors.textSecondary }]}>Today</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.presetButton, { backgroundColor: theme.colors.surface }]} onPress={() => setDateRangePreset(7)}>
                  <Text style={[styles.presetButtonText, { color: theme.colors.textSecondary }]}>Last 7 Days</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.presetButton, { backgroundColor: theme.colors.surface }]} onPress={() => setDateRangePreset(30)}>
                  <Text style={[styles.presetButtonText, { color: theme.colors.textSecondary }]}>Last 30 Days</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.presetButton, { backgroundColor: theme.colors.surface }]} onPress={() => setDateRangePreset(90)}>
                  <Text style={[styles.presetButtonText, { color: theme.colors.textSecondary }]}>Last 3 Months</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Calendar */}
            <View style={styles.calendarContainer}>
              <Text style={[styles.calendarTitle, { color: theme.colors.text }]}>Select Date Range</Text>
              <Text style={[styles.calendarInstructions, { color: theme.colors.textSecondary }]}>Tap to select start date, tap again to select end date</Text>

              <Calendar
                onDayPress={handleDayPress}
                markingType={"period"}
                markedDates={markedDates}
                theme={{
                  backgroundColor: theme.colors.surface,
                  calendarBackground: theme.colors.surface,
                  textSectionTitleColor: theme.colors.text,
                  selectedDayBackgroundColor: theme.colors.primary,
                  selectedDayTextColor: "white",
                  todayTextColor: theme.colors.primary,
                  dayTextColor: theme.colors.text,
                  textDisabledColor: theme.colors.textSecondary,
                  dotColor: theme.colors.primary,
                  selectedDotColor: "white",
                  arrowColor: theme.colors.primary,
                  disabledArrowColor: theme.colors.textSecondary,
                  monthTextColor: theme.colors.text,
                  indicatorColor: "#FF6B35",
                  textDayFontWeight: "400",
                  textMonthFontWeight: "600",
                  textDayHeaderFontWeight: "500",
                  textDayFontSize: 16,
                  textMonthFontSize: 18,
                  textDayHeaderFontSize: 14,
                }}
              />

              {(startDate || endDate) && (
                <TouchableOpacity
                  style={styles.clearCustomButton}
                  onPress={() => {
                    setStartDate(null);
                    setEndDate(null);
                  }}
                >
                  <Ionicons name="trash-outline" size={16} color={theme.colors.textSecondary} />
                  <Text style={[styles.clearCustomButtonText, { color: theme.colors.primary }]}>Clear Selection</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
  },
  dateButton: {
    padding: 4,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
  addMealButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF6B35",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  addMealButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  mealsList: {
    flex: 1,
  },
  mealsListContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  sectionCount: {
    fontSize: 14,
  },
  mealItem: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: "flex-start",
  },
  mealPhotoContainer: {
    position: "relative",
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
    justifyContent: "center",
    alignItems: "center",
  },
  verifiedBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
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
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  mealEmoji: {
    fontSize: 16,
  },
  mealName: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  mealTime: {
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
  loadingMoreContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
    gap: 8,
  },
  loadingMoreText: {
    fontSize: 14,
  },
  dateFilterContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  dateRangeButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
    flex: 1,
  },
  dateRangeText: {
    fontSize: 14,
    fontWeight: "500",
  },
  clearDateButton: {
    padding: 8,
    borderRadius: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
  },
  // Date Range Modal Styles
  dateRangeModal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
  },
  dateRangeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  dateRangeModalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  presetsContainer: {
    padding: 20,
    borderBottomWidth: 1,
  },
  presetsTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
  },
  presetsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  presetButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 80,
  },
  presetButtonText: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  presetButtonTextActive: {
    fontWeight: "600",
  },
  calendarContainer: {
    padding: 20,
  },
  calendarTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  calendarInstructions: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: "center",
  },
  clearCustomButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    paddingVertical: 12,
    gap: 8,
  },
  clearCustomButtonText: {
    fontSize: 14,
  },
});
