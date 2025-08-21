import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/lib/theme';


interface NutritionChartProps {
  type: 'heatmap' | 'bar' | 'line';
  data?: any[];
}

export function NutritionChart({ type }: NutritionChartProps) {
  const { theme } = useTheme();
  if (type === 'heatmap') {
    return (
      <View style={styles.heatmapContainer}>
        <View style={styles.heatmapHeader}>
          <View style={styles.titleRow}>
            <Text style={[styles.heatmapTitle, { color: theme.colors.text }]}>Meal Timing Pattern</Text>
            <View style={styles.heatmapLegend}>
              <Text style={[styles.legendLabel, { color: theme.colors.textSecondary }]}>Less</Text>
              <View style={styles.legendGradient}>
                {[0, 0.25, 0.5, 0.75, 1].map((intensity, index) => (
                  <View
                    key={index}
                    style={[
                      styles.legendCell,
                      { backgroundColor: getHeatmapColor(intensity, theme.colors.primary) }
                    ]}
                  />
                ))}
              </View>
              <Text style={[styles.legendLabel, { color: theme.colors.textSecondary }]}>More</Text>
            </View>
          </View>
          <View style={styles.timeLabels}>
            {['6AM', '12PM', '6PM', '12AM'].map((time, index) => (
              <Text key={index} style={[styles.timeLabel, { color: theme.colors.textSecondary }]}>{time}</Text>
            ))}
          </View>
        </View>
        
        <View style={styles.heatmapGrid}>
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, dayIndex) => (
            <View key={day} style={styles.heatmapRow}>
              <Text style={[styles.dayLabel, { color: theme.colors.textSecondary }]}>{day}</Text>
              <View style={styles.heatmapCells}>
                {Array.from({ length: 24 }, (_, hour) => {
                  // Simulate meal activity
                  const intensity = getMealIntensity(dayIndex, hour);
                  return (
                    <View
                      key={hour}
                      style={[
                        styles.heatmapCell,
                        { backgroundColor: getHeatmapColor(intensity, theme.colors.primary) }
                      ]}
                    />
                  );
                })}
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.placeholder}>
      <Text style={[styles.placeholderText, { color: theme.colors.textSecondary }]}>Chart: {type}</Text>
    </View>
  );
}

const getMealIntensity = (day: number, hour: number): number => {
  // Simulate realistic meal patterns
  const breakfastHours = [7, 8, 9];
  const lunchHours = [11, 12, 13, 14];
  const dinnerHours = [17, 18, 19, 20];
  const snackHours = [10, 15, 21];
  
  if (breakfastHours.includes(hour)) return 0.7 + Math.random() * 0.3;
  if (lunchHours.includes(hour)) return 0.5 + Math.random() * 0.4;
  if (dinnerHours.includes(hour)) return 0.6 + Math.random() * 0.4;
  if (snackHours.includes(hour)) return 0.2 + Math.random() * 0.3;
  
  // Weekend variation
  if (day >= 5) {
    if ([9, 10, 11].includes(hour)) return 0.3 + Math.random() * 0.4; // Late breakfast
    if ([14, 15, 16].includes(hour)) return 0.2 + Math.random() * 0.3; // Afternoon snacks
  }
  
  return Math.random() * 0.1; // Background activity
};

const getHeatmapColor = (intensity: number, primaryColor: string): string => {
  if (intensity === 0) return 'transparent';
  if (intensity < 0.2) return primaryColor + '20';
  if (intensity < 0.4) return primaryColor + '40';
  if (intensity < 0.6) return primaryColor + '60';
  if (intensity < 0.8) return primaryColor + '80';
  return primaryColor + 'C0';
};

const styles = StyleSheet.create({
  heatmapContainer: {
    flex: 1,
  },
  heatmapHeader: {
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  heatmapTitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  timeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 32,
  },
  timeLabel: {
    fontSize: 10,
  },
  heatmapGrid: {
    flex: 1,
  },
  heatmapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  dayLabel: {
    fontSize: 10,
    width: 28,
    textAlign: 'right',
    marginRight: 4,
  },
  heatmapCells: {
    flexDirection: 'row',
    flex: 1,
    gap: 1,
  },
  heatmapCell: {
    flex: 1,
    height: 8,
    borderRadius: 1,
  },
  heatmapLegend: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendLabel: {
    fontSize: 9,
    marginHorizontal: 4,
  },
  legendGradient: {
    flexDirection: 'row',
    gap: 1,
  },
  legendCell: {
    width: 6,
    height: 6,
    borderRadius: 1,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 14,
  },
});