import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Card } from "@/components/ui/Card";
import { useUserStore } from "@/domains/user/stores/userStore";
import { useSettingsStore } from "@/domains/settings/stores/settingsStore";

interface SettingsOrbitalProps {
  onNavigate: (section: string) => void;
  isActive: boolean;
}

interface QuickSetting {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  onPress: () => void;
}

export default function SettingsOrbital({ onNavigate }: SettingsOrbitalProps) {
  const { user } = useUserStore();
  const { display, notifications } = useSettingsStore();

  const handleSettingsPress = () => {
    router.push("/settings");
  };

  const quickSettings: QuickSetting[] = [
    {
      id: "theme",
      title: "Theme",
      icon: "color-palette-outline",
      value: display.theme === "system" ? "System" : display.theme === "dark" ? "Dark" : "Light",
      onPress: () => router.push("/settings/display"),
    },
    {
      id: "notifications",
      title: "Notifications",
      icon: "notifications-outline",
      value: notifications.mealReminders ? "On" : "Off",
      onPress: () => router.push("/settings/notifications"),
    },
    {
      id: "language",
      title: "Language",
      icon: "language-outline",
      value: display.language === "ko" ? "한국어" : "English",
      onPress: () => router.push("/settings/display"),
    },
  ];

  const renderQuickSetting = (setting: QuickSetting) => (
    <Card key={setting.id} style={styles.quickSettingCard}>
      <TouchableOpacity style={styles.quickSettingContent} onPress={setting.onPress} activeOpacity={0.7}>
        <View style={styles.quickSettingLeft}>
          <View style={styles.quickSettingIcon}>
            <Ionicons name={setting.icon} size={20} color="#FF6B35" />
          </View>
          <Text style={styles.quickSettingTitle}>{setting.title}</Text>
        </View>
        <View style={styles.quickSettingRight}>
          <Text style={styles.quickSettingValue}>{setting.value}</Text>
          <Ionicons name="chevron-forward" size={16} color="rgba(255, 255, 255, 0.5)" />
        </View>
      </TouchableOpacity>
    </Card>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => onNavigate("camera")}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Settings</Text>

        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* User Profile */}
        <Card style={styles.profileCard}>
          <TouchableOpacity
            style={styles.profileContent}
            onPress={() => router.push("/settings/account")}
            activeOpacity={0.7}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user?.username?.charAt(0).toUpperCase() || "U"}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.username || "Guest User"}</Text>
              <Text style={styles.profileEmail}>{user?.email || "Not logged in"}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="rgba(255, 255, 255, 0.5)" />
          </TouchableOpacity>
        </Card>

        {/* Quick Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Settings</Text>
          {quickSettings.map(renderQuickSetting)}
        </View>

        {/* Main Settings Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>All Settings</Text>
          <Card style={styles.allSettingsCard}>
            <TouchableOpacity style={styles.allSettingsContent} onPress={handleSettingsPress} activeOpacity={0.7}>
              <View style={styles.allSettingsLeft}>
                <View style={styles.allSettingsIcon}>
                  <Ionicons name="settings-outline" size={24} color="#FF6B35" />
                </View>
                <View>
                  <Text style={styles.allSettingsTitle}>All Settings</Text>
                  <Text style={styles.allSettingsDescription}>Account, Privacy, Goals & More</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="rgba(255, 255, 255, 0.5)" />
            </TouchableOpacity>
          </Card>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appName}>Food Log</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
          <Text style={styles.buildInfo}>Build 1</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
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
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  profileCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    marginBottom: 24,
    padding: 0,
  },
  profileContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FF6B35",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  avatarText: {
    color: "white",
    fontSize: 20,
    fontWeight: "600",
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  profileEmail: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  quickSettingCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    marginBottom: 8,
    padding: 0,
  },
  quickSettingContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  quickSettingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  quickSettingIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "rgba(255, 107, 53, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  quickSettingTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
  },
  quickSettingRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  quickSettingValue: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
    fontWeight: "500",
  },
  allSettingsCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    padding: 0,
  },
  allSettingsContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
  },
  allSettingsLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  allSettingsIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "rgba(255, 107, 53, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  allSettingsTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  allSettingsDescription: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
  },
  appInfo: {
    alignItems: "center",
    paddingVertical: 32,
  },
  appName: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
  },
  appVersion: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 10,
    marginBottom: 2,
  },
  buildInfo: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 10,
  },
});
