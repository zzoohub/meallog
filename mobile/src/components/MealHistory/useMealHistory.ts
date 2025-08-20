import { useState, useEffect, useCallback } from "react";
import { Meal, MealHistoryFilter } from "@/domains/meals/types";
import { MealStorageService, generateMockMeals } from "@/domains/meals/services/mealStorage";
import { useDebouncedCallback } from "@/lib/performance/hooks";

interface MealSection {
  title: string;
  data: Meal[];
}

export const useMealHistory = () => {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [sections, setSections] = useState<MealSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [markedDates, setMarkedDates] = useState<{ [key: string]: any }>({});

  const ITEMS_PER_PAGE = 20;

  const loadMeals = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsLoading(true);
        setPage(1);
        setHasMore(true);
      } else {
        setIsLoadingMore(true);
      }

      const filter: MealHistoryFilter = {};
      if (searchQuery) filter.searchQuery = searchQuery;
      if (startDate) filter.startDate = startDate;
      if (endDate) filter.endDate = endDate;

      let loadedMeals = await MealStorageService.getMealsFiltered(filter);

      if (loadedMeals.length === 0 && !searchQuery && isRefresh) {
        const mockMeals = generateMockMeals();
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
        loadedMeals = await MealStorageService.getMealsFiltered(filter);
      }

      const currentPage = isRefresh ? 1 : page;
      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
      const endIndex = startIndex + ITEMS_PER_PAGE;
      const paginatedMeals = loadedMeals.slice(0, endIndex);

      if (isRefresh) {
        setMeals(paginatedMeals);
      } else {
        setMeals(prev => [...prev, ...loadedMeals.slice(startIndex, endIndex)]);
      }

      setSections(groupMealsByDate(paginatedMeals));
      setHasMore(endIndex < loadedMeals.length);

      if (!isRefresh) {
        setPage(prev => prev + 1);
      }
    } catch (error) {
      console.error("Error loading meals:", error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const groupMealsByDate = useCallback((meals: Meal[]): MealSection[] => {
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
      .sort((a, b) => (b.data[0]?.timestamp?.getTime() ?? 0) - (a.data[0]?.timestamp?.getTime() ?? 0));
  }, []);

  const formatSectionDate = (date: Date): string => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
      });
    }
  };

  const updateMarkedDates = useCallback(() => {
    const marked: { [key: string]: any } = {};

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      const startDateString = start.toISOString().split("T")[0];
      if (startDateString) {
        marked[startDateString] = {
          startingDay: true,
          color: "#FF6B35",
          textColor: "white",
        };
      }

      const endDateString = end.toISOString().split("T")[0];
      if (endDateString) {
        marked[endDateString] = {
          endingDay: true,
          color: "#FF6B35",
          textColor: "white",
        };
      }

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

  const debouncedLoadMeals = useDebouncedCallback(
    () => loadMeals(true),
    300,
    [searchQuery, startDate, endDate]
  );

  const handleLoadMore = useCallback(() => {
    if (!isLoadingMore && hasMore) {
      loadMeals(false);
    }
  }, [isLoadingMore, hasMore]);

  const handleDayPress = useCallback((day: any) => {
    const selectedDate = new Date(day.dateString);

    if (!startDate || (startDate && endDate)) {
      setStartDate(selectedDate);
      setEndDate(null);
    } else if (startDate && !endDate) {
      if (selectedDate >= startDate) {
        setEndDate(selectedDate);
      } else {
        setStartDate(selectedDate);
        setEndDate(null);
      }
    }
  }, [startDate, endDate]);

  const clearDateFilter = useCallback(() => {
    setStartDate(null);
    setEndDate(null);
  }, []);

  const setDateRangePreset = useCallback((days: number | null) => {
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
  }, []);

  const formatDateRange = useCallback(() => {
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
  }, [startDate, endDate]);

  useEffect(() => {
    debouncedLoadMeals();
  }, [debouncedLoadMeals]);

  useEffect(() => {
    updateMarkedDates();
  }, [updateMarkedDates]);

  return {
    meals,
    sections,
    isLoading,
    isLoadingMore,
    searchQuery,
    setSearchQuery,
    hasMore,
    startDate,
    endDate,
    markedDates,
    handleLoadMore,
    handleDayPress,
    clearDateFilter,
    setDateRangePreset,
    formatDateRange,
  };
};