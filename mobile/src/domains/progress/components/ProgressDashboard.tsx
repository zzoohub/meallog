import { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { CircularProgress } from "@/components/CircularProgress";
import { NutritionChart } from "@/components/NutritionChart";
import RecentMeals from "@/domains/meals/components/RecentMeals";
import { useRouter } from "expo-router";
import { useProgressI18n } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";

interface ProgressDashboardProps {
  onNavigate: (section: string) => void;
  isActive: boolean;
}

interface DailyStats {
  calories: { current: number; target: number };
  protein: { current: number; target: number };
  carbs: { current: number; target: number };
  fat: { current: number; target: number };
  water: { current: number; target: number };
  fiber: { current: number; target: number };
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  emoji: string;
  progress: number;
  target: number;
  isCompleted: boolean;
}

const mockStats: DailyStats = {
  calories: { current: 1680, target: 2000 },
  protein: { current: 89, target: 120 },
  carbs: { current: 180, target: 250 },
  fat: { current: 65, target: 80 },
  water: { current: 6, target: 8 },
  fiber: { current: 22, target: 25 },
};

export default function ProgressDashboard({ onNavigate }: ProgressDashboardProps) {
  const { theme } = useTheme();
  const [selectedPeriod, setSelectedPeriod] = useState<"day" | "week" | "month">("day");
  const router = useRouter();
  const progress = useProgressI18n();

  const mockAchievements: Achievement[] = [
    {
      id: "1",
      title: progress.proteinMaster,
      description: progress.proteinMasterDesc,
      emoji: "💪",
      progress: 5,
      target: 7,
      isCompleted: false,
    },
    {
      id: "2",
      title: progress.veggieWarrior,
      description: progress.veggieWarriorDesc,
      emoji: "🥗",
      progress: 18,
      target: 25,
      isCompleted: false,
    },
    {
      id: "3",
      title: progress.consistencyKing,
      description: progress.consistencyKingDesc,
      emoji: "🔥",
      progress: 14,
      target: 30,
      isCompleted: false,
    },
  ];

  const handleSeeAllHistory = () => {
    router.push("/meal-history");
  };

  const renderProgressRing = (label: string, current: number, target: number, color: string, unit: string) => {
    const percentage = Math.min((current / target) * 100, 100);

    return (
      <View style={styles.progressRingContainer}>
        <CircularProgress
          size={80}
          strokeWidth={6}
          progress={percentage}
          color={color}
          backgroundColor={theme.colors.border}
        >
          <View style={styles.progressContent}>
            <Text style={[styles.progressValue, { color: theme.colors.text }]}>{current}</Text>
            <Text style={[styles.progressUnit, { color: theme.colors.textSecondary }]}>{unit}</Text>
          </View>
        </CircularProgress>
        <Text style={[styles.progressLabel, { color: theme.colors.text }]}>{label}</Text>
        <Text style={[styles.progressTarget, { color: theme.colors.textSecondary }]}>
          {current}/{target} {unit}
        </Text>
      </View>
    );
  };

  const renderAchievement = (achievement: Achievement) => (
    <TouchableOpacity key={achievement.id} style={[styles.achievementCard, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.achievementHeader}>
        <Text style={styles.achievementEmoji}>{achievement.emoji}</Text>
        <View style={styles.achievementInfo}>
          <Text style={[styles.achievementTitle, { color: theme.colors.text }]}>{achievement.title}</Text>
          <Text style={[styles.achievementDescription, { color: theme.colors.textSecondary }]}>
            {achievement.description}
          </Text>
        </View>
        <View style={styles.achievementProgress}>
          <Text style={[styles.achievementProgressText, { color: theme.colors.primary }]}>
            {achievement.progress}/{achievement.target}
          </Text>
        </View>
      </View>
      <View style={[styles.achievementBar, { backgroundColor: theme.colors.border + "40" }]}>
        <View
          style={[
            styles.achievementBarFill,
            { width: `${(achievement.progress / achievement.target) * 100}%`, backgroundColor: theme.colors.primary },
          ]}
        />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => onNavigate("camera")}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>{progress.title}</Text>

        <TouchableOpacity onPress={() => onNavigate("settings")}>
          <Ionicons name="settings-outline" size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Period Selector */}
        <View style={[styles.periodSelector, { backgroundColor: theme.colors.surface }]}>
          {(["day", "week", "month"] as const).map(period => (
            <TouchableOpacity
              key={period}
              style={[styles.periodButton, selectedPeriod === period && { backgroundColor: theme.colors.primary }]}
              onPress={() => setSelectedPeriod(period)}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  { color: theme.colors.textSecondary },
                  selectedPeriod === period && { color: "white" },
                ]}
              >
                {progress[period]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Daily Summary */}
        <View style={[styles.summaryCard, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.summaryHeader}>
            <Text style={[styles.summaryTitle, { color: theme.colors.text }]}>{progress.todaySummary}</Text>
            <Text style={[styles.summaryDate, { color: theme.colors.textSecondary }]}>
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
            </Text>
          </View>

          <View style={styles.calorieOverview}>
            <View style={styles.calorieMain}>
              <Text style={[styles.calorieValue, { color: theme.colors.text }]}>{mockStats.calories.current}</Text>
              <Text style={[styles.calorieLabel, { color: theme.colors.textSecondary }]}>
                {progress.caloriesConsumed}
              </Text>
            </View>
            <View style={styles.calorieRemaining}>
              <Text style={[styles.remainingValue, { color: theme.colors.primary }]}>
                {mockStats.calories.target - mockStats.calories.current}
              </Text>
              <Text style={[styles.remainingLabel, { color: theme.colors.textSecondary }]}>{progress.remaining}</Text>
            </View>
          </View>

          <View style={[styles.calorieBar, { backgroundColor: theme.colors.border + "40" }]}>
            <View
              style={[
                styles.calorieBarFill,
                {
                  width: `${(mockStats.calories.current / mockStats.calories.target) * 100}%`,
                  backgroundColor: theme.colors.primary,
                },
              ]}
            />
          </View>
        </View>

        {/* Recent Meals */}
        <RecentMeals onSeeAll={handleSeeAllHistory} />

        {/* Nutrition Rings */}
        <View style={styles.nutritionSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{progress.macronutrients}</Text>
          <View style={styles.nutritionRings}>
            {renderProgressRing(progress.protein, mockStats.protein.current, mockStats.protein.target, "#FF6B35", "g")}
            {renderProgressRing(progress.carbs, mockStats.carbs.current, mockStats.carbs.target, "#4ECDC4", "g")}
            {renderProgressRing(progress.fat, mockStats.fat.current, mockStats.fat.target, "#45B7D1", "g")}
          </View>
        </View>

        {/* Eating Pattern */}
        <View style={styles.patternSection}>
          <View style={styles.sectionHeader}>
            <Text style={{ ...styles.sectionTitle, marginBottom: 4, color: theme.colors.text }}>
              {progress.eatingPattern}
            </Text>
            {/* <TouchableOpacity>
              <Text style={[styles.seeAllText, { color: theme.colors.primary }]}>{progress.seeAll}</Text>
            </TouchableOpacity> */}
          </View>

          <View style={[styles.heatmapContainer, { backgroundColor: theme.colors.surface }]}>
            <NutritionChart type="heatmap" />
          </View>
        </View>

        {/* Meal Character */}
        <View style={styles.characterSection}>
          <View style={[styles.characterCard, { backgroundColor: theme.colors.surface }]}>
            <Text style={styles.characterEmoji}>🌟</Text>
            <View style={styles.characterInfo}>
              <Text style={[styles.characterTitle, { color: theme.colors.text }]}>{progress.balancedExplorer}</Text>
              <Text style={[styles.characterDescription, { color: theme.colors.textSecondary }]}>
                {progress.balancedExplorerDesc}
              </Text>
            </View>
            <View style={[styles.characterLevel, { backgroundColor: theme.colors.primary }]}>
              <Text style={[styles.levelText, { color: theme.colors.text }]}>Lv.7</Text>
            </View>
          </View>

          <View style={[styles.diversityScore, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.diversityLabel, { color: theme.colors.textSecondary }]}>
              {progress.mealDiversityScore}
            </Text>
            <Text style={[styles.diversityValue, { color: theme.colors.text }]}>82/100</Text>
            <Text style={[styles.diversityTip, { color: theme.colors.secondary }]}>{progress.diversityTip}</Text>
          </View>
        </View>

        {/* Achievements */}
        <View style={styles.achievementsSection}>
          <View style={styles.sectionHeader}>
            <Text style={{ ...styles.sectionTitle, marginBottom: 4, color: theme.colors.text }}>
              {progress.achievements}
            </Text>
            {/* <TouchableOpacity>
              <Text style={[styles.seeAllText, { color: theme.colors.primary }]}>{progress.viewAll}</Text>
            </TouchableOpacity> */}
          </View>

          {mockAchievements.map(renderAchievement)}
        </View>

        {/* Weekly Insights */}
        <View style={styles.insightsSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Weekly Insights</Text>

          <View style={[styles.insightCard, { backgroundColor: theme.colors.surface }]}>
            <Ionicons name="trending-up" size={24} color={theme.colors.secondary} />
            <View style={styles.insightContent}>
              <Text style={[styles.insightTitle, { color: theme.colors.text }]}>Protein intake improved</Text>
              <Text style={[styles.insightDescription, { color: theme.colors.textSecondary }]}>
                You hit your protein goal 5 out of 7 days this week!
              </Text>
            </View>
          </View>

          <View style={[styles.insightCard, { backgroundColor: theme.colors.surface }]}>
            <Ionicons name="restaurant" size={24} color={theme.colors.primary} />
            <View style={styles.insightContent}>
              <Text style={[styles.insightTitle, { color: theme.colors.text }]}>New favorite: Mediterranean</Text>
              <Text style={[styles.insightDescription, { color: theme.colors.textSecondary }]}>
                You&apos;ve logged 4 Mediterranean meals this week.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  periodSelector: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 8,
  },
  periodButtonActive: {
    // backgroundColor handled inline with theme
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  periodButtonTextActive: {
    // color handled inline with theme
  },
  summaryCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  summaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  summaryDate: {
    fontSize: 14,
  },
  calorieOverview: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  calorieMain: {
    alignItems: "flex-start",
  },
  calorieValue: {
    fontSize: 32,
    fontWeight: "bold",
  },
  calorieLabel: {
    fontSize: 14,
  },
  calorieRemaining: {
    alignItems: "flex-end",
  },
  remainingValue: {
    fontSize: 24,
    fontWeight: "600",
  },
  remainingLabel: {
    fontSize: 14,
  },
  calorieBar: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  calorieBarFill: {
    height: "100%",
  },
  nutritionSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  nutritionRings: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  progressRingContainer: {
    alignItems: "center",
    flex: 1,
  },
  progressContent: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
  },
  progressValue: {
    fontSize: 16,
    fontWeight: "bold",
  },
  progressUnit: {
    fontSize: 10,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 8,
  },
  progressTarget: {
    fontSize: 10,
    marginTop: 2,
  },
  patternSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: "500",
  },
  heatmapContainer: {
    height: 180,
    borderRadius: 12,
    padding: 16,
    paddingBottom: 20,
  },
  characterSection: {
    marginBottom: 24,
  },
  characterCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  characterEmoji: {
    fontSize: 40,
    marginRight: 16,
  },
  characterInfo: {
    flex: 1,
  },
  characterTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  characterDescription: {
    fontSize: 14,
  },
  characterLevel: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  levelText: {
    fontSize: 12,
    fontWeight: "600",
  },
  diversityScore: {
    borderRadius: 12,
    padding: 16,
  },
  diversityLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  diversityValue: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  diversityTip: {
    fontSize: 12,
    fontStyle: "italic",
  },
  achievementsSection: {
    marginBottom: 24,
  },
  achievementCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  achievementHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  achievementEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  achievementDescription: {
    fontSize: 12,
  },
  achievementProgress: {
    alignItems: "flex-end",
  },
  achievementProgressText: {
    fontSize: 14,
    fontWeight: "600",
  },
  achievementBar: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  achievementBarFill: {
    height: "100%",
  },
  insightsSection: {
    marginBottom: 24,
  },
  insightCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  insightContent: {
    flex: 1,
    marginLeft: 16,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  insightDescription: {
    fontSize: 14,
  },
});
