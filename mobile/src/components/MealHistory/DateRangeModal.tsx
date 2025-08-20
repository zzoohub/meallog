import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { Ionicons } from "@expo/vector-icons";

interface DateRangeModalProps {
  visible: boolean;
  onClose: () => void;
  startDate: Date | null;
  endDate: Date | null;
  onDateSelect: (day: any) => void;
  onPresetSelect: (days: number | null) => void;
  onClearDates: () => void;
  markedDates: { [key: string]: any };
}

export const DateRangeModal = React.memo(({ 
  visible, 
  onClose, 
  startDate, 
  endDate, 
  onDateSelect, 
  onPresetSelect,
  onClearDates,
  markedDates 
}: DateRangeModalProps) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Select Date Range</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="rgba(255, 255, 255, 0.7)" />
            </TouchableOpacity>
          </View>

          <View style={styles.presetsContainer}>
            <Text style={styles.presetsTitle}>Quick Select</Text>
            <View style={styles.presetsGrid}>
              <TouchableOpacity
                style={[styles.presetButton, !startDate && !endDate && styles.presetButtonActive]}
                onPress={() => onPresetSelect(null)}
              >
                <Text style={[styles.presetButtonText, !startDate && !endDate && styles.presetButtonTextActive]}>
                  All Time
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.presetButton} onPress={() => onPresetSelect(1)}>
                <Text style={styles.presetButtonText}>Today</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.presetButton} onPress={() => onPresetSelect(7)}>
                <Text style={styles.presetButtonText}>Last 7 Days</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.presetButton} onPress={() => onPresetSelect(30)}>
                <Text style={styles.presetButtonText}>Last 30 Days</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.presetButton} onPress={() => onPresetSelect(90)}>
                <Text style={styles.presetButtonText}>Last 3 Months</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.calendarContainer}>
            <Text style={styles.calendarTitle}>Select Date Range</Text>
            <Text style={styles.calendarInstructions}>Tap to select start date, tap again to select end date</Text>

            <Calendar
              onDayPress={onDateSelect}
              markingType={"period"}
              markedDates={markedDates}
              theme={{
                backgroundColor: "#1C1C1E",
                calendarBackground: "#1C1C1E",
                textSectionTitleColor: "white",
                selectedDayBackgroundColor: "#FF6B35",
                selectedDayTextColor: "white",
                todayTextColor: "#FF6B35",
                dayTextColor: "white",
                textDisabledColor: "rgba(255, 255, 255, 0.3)",
                dotColor: "#FF6B35",
                selectedDotColor: "white",
                arrowColor: "#FF6B35",
                disabledArrowColor: "rgba(255, 255, 255, 0.3)",
                monthTextColor: "white",
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
              <TouchableOpacity style={styles.clearButton} onPress={onClearDates}>
                <Ionicons name="trash-outline" size={16} color="rgba(255, 255, 255, 0.7)" />
                <Text style={styles.clearButtonText}>Clear Selection</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
  },
  modal: {
    backgroundColor: "#1C1C1E",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  title: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  presetsContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  presetsTitle: {
    color: "white",
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
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 80,
  },
  presetButtonActive: {
    backgroundColor: "#FF6B35",
  },
  presetButtonText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  presetButtonTextActive: {
    color: "white",
    fontWeight: "600",
  },
  calendarContainer: {
    padding: 20,
  },
  calendarTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  calendarInstructions: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
    marginBottom: 20,
    textAlign: "center",
  },
  clearButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    paddingVertical: 12,
    gap: 8,
  },
  clearButtonText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
  },
});