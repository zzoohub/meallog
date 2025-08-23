import { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from "react-native";
import { Calendar } from "react-native-calendars";
import { Ionicons } from "@expo/vector-icons";
import { StatsSuspenseWrapper } from './StatsSuspenseWrapper';
import RecentMeals from "@/domains/meals/components/RecentMeals";
import { useRouter } from "expo-router";
import { useProgressI18n } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { useTimeContext, TimePeriod } from "@/contexts";

interface ProgressDashboardProps {
  onNavigate: (section: string) => void;
  isActive: boolean;
}

export default function ProgressDashboard({ onNavigate }: ProgressDashboardProps) {
  const { theme } = useTheme();
  const router = useRouter();
  const progress = useProgressI18n();
  const { globalPeriod, setGlobalPeriod, getPeriodLabel } = useTimeContext();

  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [markedDates, setMarkedDates] = useState<{ [key: string]: any }>({});
  
  // Calendar range state for date selection
  const [calendarRange, setCalendarRange] = useState<{
    startDate: Date | null;
    endDate: Date | null;
    markedDates: any;
  }>({
    startDate: null,
    endDate: null,
    markedDates: {},
  });

  // Update calendar marked dates when period changes
  useEffect(() => {
    updateMarkedDates();
  }, [globalPeriod]);

  const updateMarkedDates = () => {
    const marked: { [key: string]: any } = {};

    if (globalPeriod.type === "custom" && globalPeriod.startDate && globalPeriod.endDate) {
      const start = new Date(globalPeriod.startDate);
      const end = new Date(globalPeriod.endDate);

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
    }

    setMarkedDates(marked);
  };

  const updateCalendarRange = (start: Date | null, end: Date | null) => {
    const markedDates: any = {};

    if (start && !end) {
      const dateString = start.toISOString().split("T")[0];
      if (dateString) {
        markedDates[dateString] = {
          startingDay: true,
          color: theme.colors.primary,
          textColor: "white",
        };
      }
    } else if (start && end) {
      const startString = start.toISOString().split("T")[0];
      const endString = end.toISOString().split("T")[0];

      if (startString && endString && startString === endString) {
        markedDates[startString] = {
          startingDay: true,
          endingDay: true,
          color: theme.colors.primary,
          textColor: "white",
        };
      } else if (startString && endString) {
        markedDates[startString] = {
          startingDay: true,
          color: theme.colors.primary,
          textColor: "white",
        };
        markedDates[endString] = {
          endingDay: true,
          color: theme.colors.primary,
          textColor: "white",
        };

        // Mark days in between
        const currentDate = new Date(start);
        currentDate.setDate(currentDate.getDate() + 1);
        
        while (currentDate < end) {
          const dateString = currentDate.toISOString().split("T")[0];
          if (dateString) {
            markedDates[dateString] = {
              color: theme.colors.primary + "40",
              textColor: theme.colors.text,
            };
          }
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }
    }

    setCalendarRange({ startDate: start, endDate: end, markedDates });

    // Update global period if we have both dates
    if (start && end) {
      setGlobalPeriod({
        type: "custom",
        startDate: start,
        endDate: end,
      });
    }
  };

  const clearDateRange = () => {
    setCalendarRange({ startDate: null, endDate: null, markedDates: {} });
    setGlobalPeriod({ type: "day" });
  };

  const handlePeriodChange = (newPeriod: "day" | "week" | "month") => {
    setGlobalPeriod({ type: newPeriod });
  };

  const handleCustomPeriodChange = (startDate?: Date, endDate?: Date) => {
    const period: TimePeriod = { type: "custom" };
    if (startDate) period.startDate = startDate;
    if (endDate) period.endDate = endDate;
    setGlobalPeriod(period);
  };

  // Date selection functions
  const handleDayPress = (day: any) => {
    const selectedDate = new Date(day.dateString);
    const { startDate, endDate } = calendarRange;

    if (!startDate || (startDate && endDate)) {
      updateCalendarRange(selectedDate, null);
    } else if (startDate && !endDate) {
      if (selectedDate >= startDate) {
        updateCalendarRange(startDate, selectedDate);
        // The updateCalendarRange already handles this
      } else {
        updateCalendarRange(selectedDate, null);
      }
    }
  };

  const handleSeeAllHistory = () => {
    router.push("/meal-history");
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Progress</Text>
        <TouchableOpacity onPress={() => router.push("/settings")}>
          <Ionicons name="settings-outline" size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Period Selector */}
        <View style={[styles.periodSelector, { backgroundColor: theme.colors.surface }]}>
          {/* Period Buttons Row */}
          <View style={styles.periodButtonsRow}>
            {(["day", "week", "month"] as const).map(period => (
              <TouchableOpacity
                key={period}
                style={[styles.periodButton, globalPeriod.type === period && { backgroundColor: theme.colors.primary }]}
                onPress={() => handlePeriodChange(period)}
              >
                <Text
                  style={[
                    styles.periodButtonText,
                    { color: theme.colors.textSecondary },
                    globalPeriod.type === period && { color: "white" },
                  ]}
                >
                  {progress[period]}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[
                styles.periodButton,
                styles.calendarButton,
                globalPeriod.type === "custom" && { backgroundColor: theme.colors.primary },
              ]}
              onPress={() => setShowCalendarModal(true)}
            >
              <Ionicons
                name="calendar"
                size={16}
                color={globalPeriod.type === "custom" ? "white" : theme.colors.textSecondary}
              />
              {globalPeriod.type === "custom" && (
                <Text style={[styles.periodButtonText, { color: "white", fontSize: 12 }]}>Custom</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Period Summary with Suspense */}
        <StatsSuspenseWrapper onNavigate={onNavigate} />

        {/* Recent Meals */}
        <RecentMeals onSeeAll={handleSeeAllHistory} />
        
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Calendar Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showCalendarModal}
        onRequestClose={() => setShowCalendarModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.calendarModal, { backgroundColor: theme.colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
              <Text style={[styles.calendarModalTitle, { color: theme.colors.text }]}>Select Period</Text>
              <TouchableOpacity onPress={() => setShowCalendarModal(false)}>
                <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Quick Presets */}
            <View style={[styles.presetsContainer, { borderBottomColor: theme.colors.border }]}>
              <Text style={[styles.presetsTitle, { color: theme.colors.text }]}>Quick Select</Text>
              <View style={styles.presetsGrid}>
                <TouchableOpacity
                  style={[styles.presetButton, { backgroundColor: theme.colors.surface }]}
                  onPress={() => {
                    handlePeriodChange("day");
                    setShowCalendarModal(false);
                  }}
                >
                  <Text style={[styles.presetButtonText, { color: theme.colors.textSecondary }]}>Today</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.presetButton, { backgroundColor: theme.colors.surface }]}
                  onPress={() => {
                    handlePeriodChange("week");
                    setShowCalendarModal(false);
                  }}
                >
                  <Text style={[styles.presetButtonText, { color: theme.colors.textSecondary }]}>This Week</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.presetButton, { backgroundColor: theme.colors.surface }]}
                  onPress={() => {
                    handlePeriodChange("month");
                    setShowCalendarModal(false);
                  }}
                >
                  <Text style={[styles.presetButtonText, { color: theme.colors.textSecondary }]}>This Month</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Calendar */}
            <View style={styles.calendarContainer}>
              <Calendar
                onDayPress={handleDayPress}
                markingType={"period"}
                markedDates={calendarRange.markedDates}
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

              {(calendarRange.startDate || calendarRange.endDate) && (
                <TouchableOpacity style={styles.clearCustomButton} onPress={() => clearDateRange()}>
                  <Ionicons name="trash-outline" size={16} color={theme.colors.textSecondary} />
                  <Text style={[styles.clearCustomButtonText, { color: theme.colors.primary }]}>Clear Selection</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
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
    fontSize: 28,
    fontWeight: "700",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  periodSelector: {
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  periodButtonsRow: {
    flexDirection: "row",
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 8,
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  calendarButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  bottomSpacing: {
    height: 100,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  calendarModal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  calendarModalTitle: {
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
  calendarContainer: {
    padding: 20,
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