import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CircularProgress } from '@/components/CircularProgress';
import { NutritionChart } from '@/components/NutritionChart';
import { useTheme } from '@/lib/theme';
import { useProgressI18n } from '@/lib/i18n';
import { useTimeContext, PeriodStats } from '@/contexts';

interface StatsContentProps {
  stats: PeriodStats;
  onNavigate: (section: string) => void;
}

export function StatsContent({ stats, onNavigate }: StatsContentProps) {
  const { theme } = useTheme();
  const progress = useProgressI18n();
  const { globalPeriod, metricsDisplayType, setMetricsDisplayType } = useTimeContext();

  return (
    <View style={[styles.summaryCard, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.summaryHeader}>
        <Text style={[styles.summaryDate, { color: theme.colors.textSecondary }]}>
          {stats.periodLabel}
        </Text>
        {globalPeriod.type !== "day" && (
          <View style={[styles.inlineToggleButtons, { backgroundColor: theme.colors.background }]}>
            <TouchableOpacity
              style={[
                styles.inlineToggleButton,
                metricsDisplayType === "total" && { backgroundColor: theme.colors.primary },
              ]}
              onPress={() => setMetricsDisplayType("total")}
            >
              <Text
                style={[
                  styles.inlineToggleText,
                  { color: theme.colors.textSecondary },
                  metricsDisplayType === "total" && { color: "white" },
                ]}
              >
                Total
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.inlineToggleButton,
                metricsDisplayType === "dailyAverage" && { backgroundColor: theme.colors.primary },
              ]}
              onPress={() => setMetricsDisplayType("dailyAverage")}
            >
              <Text
                style={[
                  styles.inlineToggleText,
                  { color: theme.colors.textSecondary },
                  metricsDisplayType === "dailyAverage" && { color: "white" },
                ]}
              >
                Avg
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {globalPeriod.type !== "day" && (
        <View style={styles.metricsInfo}>
          <Text style={[styles.metricsType, { color: theme.colors.primary }]}>
            {stats.metricsType === "dailyAverage"
              ? "Daily Averages"
              : stats.metricsType === "total"
              ? "Total Values"
              : "Current Values"}
          </Text>
        </View>
      )}

      {/* Nutrition Grid */}
      <View style={styles.nutritionGrid}>
        {[
          { label: "Calories", current: stats.calories.current, target: stats.calories.target, unit: "" },
          { label: "Protein", current: stats.protein.current, target: stats.protein.target, unit: "g" },
          { label: "Carbs", current: stats.carbs.current, target: stats.carbs.target, unit: "g" },
          { label: "Fat", current: stats.fat.current, target: stats.fat.target, unit: "g" },
          { label: "Fiber", current: stats.fiber.current, target: stats.fiber.target, unit: "g" },
        ].map((item, index) => {
          const percentage = Math.min((item.current / item.target) * 100, 100);
          return (
            <View key={index} style={styles.nutritionItem}>
              <View style={styles.nutritionHeader}>
                <Text style={[styles.nutritionLabel, { color: theme.colors.text }]}>{item.label}</Text>
                <Text style={[styles.nutritionValue, { color: theme.colors.primary }]}>
                  {item.current}
                  {item.unit}
                </Text>
              </View>
              <View style={[styles.progressBar, { backgroundColor: theme.colors.border }]}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      backgroundColor: theme.colors.primary,
                      width: `${percentage}%`
                    }
                  ]} 
                />
              </View>
              <Text style={[styles.nutritionTarget, { color: theme.colors.textSecondary }]}>
                Target: {item.target}{item.unit}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  summaryCard: {
    padding: 16,
    borderRadius: 12,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  summaryDate: {
    fontSize: 14,
    fontWeight: '500',
  },
  inlineToggleButtons: {
    flexDirection: 'row',
    borderRadius: 6,
    padding: 1,
  },
  inlineToggleButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    minWidth: 36,
    alignItems: 'center',
  },
  inlineToggleText: {
    fontSize: 10,
    fontWeight: '500',
  },
  metricsInfo: {
    alignItems: 'center',
    marginBottom: 12,
  },
  metricsType: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
  nutritionGrid: {
    gap: 12,
  },
  nutritionItem: {
    marginBottom: 4,
  },
  nutritionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  nutritionLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  nutritionValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    marginBottom: 3,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  nutritionTarget: {
    fontSize: 11,
    textAlign: 'right',
  },
});