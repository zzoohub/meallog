import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTimelineI18n } from "@/lib/i18n";

interface MealSearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const MealSearchBar = React.memo(({ searchQuery, onSearchChange }: MealSearchBarProps) => {
  const timeline = useTimelineI18n();

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="rgba(255, 255, 255, 0.5)" />
        <TextInput
          style={styles.input}
          placeholder={timeline.searchPlaceholder}
          placeholderTextColor="rgba(255, 255, 255, 0.5)"
          value={searchQuery}
          onChangeText={onSearchChange}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => onSearchChange("")}>
            <Ionicons name="close-circle" size={20} color="rgba(255, 255, 255, 0.5)" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
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
  input: {
    flex: 1,
    color: "white",
    fontSize: 16,
  },
});