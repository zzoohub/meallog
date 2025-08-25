import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/lib/theme";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SettingsSection, SettingsLayout } from "@/domains/settings/components";
import { useAuthStore } from "@/domains/auth/stores/authStore";
import * as Haptics from "expo-haptics";
import { useSettingsI18n } from "@/lib/i18n";

interface SettingsCategory {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  description?: string;
  onPress: () => void;
}

export default function SettingsScreen() {
  const { theme } = useTheme();
  const { user } = useAuthStore();
  const isAuthenticated = !!user?.isLoggedIn;
  const settings = useSettingsI18n();

  const handleCategoryPress = (categoryId: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.warn("Haptics feedback failed:", error);
    }

    // Navigate to specific setting category
    router.push(`/settings/${categoryId}` as any);
  };

  const settingsCategories: SettingsCategory[] = [
    // Only show account-related settings for authenticated users
    ...(isAuthenticated ? [{
      id: "account",
      title: "Account & Profile",
      icon: "person-outline" as keyof typeof Ionicons.glyphMap,
      description: "Manage your account information and preferences",
      onPress: () => handleCategoryPress("account"),
    }] : []),
    {
      id: "privacy",
      title: settings.privacy.title,
      icon: "shield-outline",
      description: settings.privacy.description,
      onPress: () => handleCategoryPress("privacy"),
    },
    {
      id: "notifications",
      title: settings.notifications.title,
      icon: "notifications-outline",
      description: settings.notifications.description,
      onPress: () => handleCategoryPress("notifications"),
    },
    {
      id: "display",
      title: settings.display.title,
      icon: "color-palette-outline",
      description: settings.display.appearance.description,
      onPress: () => handleCategoryPress("display"),
    },
    // Only show user-specific settings for authenticated users
    ...(isAuthenticated ? [{
      id: "goals",
      title: "Goals & Targets",
      icon: "trophy-outline" as keyof typeof Ionicons.glyphMap,
      description: "Set and track your nutrition and health goals",
      onPress: () => handleCategoryPress("goals"),
    }] : []),
    ...(isAuthenticated ? [{
      id: "data",
      title: "Data Management", 
      icon: "download-outline" as keyof typeof Ionicons.glyphMap,
      description: "Export, import, and manage your data",
      onPress: () => handleCategoryPress("data"),
    }] : []),
  ];

  const renderSettingCategory = (category: SettingsCategory) => (
    <TouchableOpacity key={category.id} style={styles.categoryContent} onPress={category.onPress} activeOpacity={0.7}>
      <View style={styles.categoryLeft}>
        <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + "20" }]}>
          <Ionicons name={category.icon} size={24} color={theme.colors.primary} />
        </View>
        <View style={styles.categoryTextContainer}>
          <Text style={[styles.categoryTitle, { color: theme.colors.text }]}>{category.title}</Text>
          {category.description && (
            <Text style={[styles.categoryDescription, { color: theme.colors.textSecondary }]}>
              {category.description}
            </Text>
          )}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
    </TouchableOpacity>
  );

  const renderUserInfo = () => {
    if (!isAuthenticated) return null;
    
    return (
      <Card variant="elevated" style={styles.userCard}>
        <TouchableOpacity
          style={styles.userInfo}
          onPress={() => router.push("/settings/account")}
          activeOpacity={0.7}
        >
          <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
            <Text style={styles.avatarText}>{user?.username?.charAt(0).toUpperCase() || "U"}</Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={[styles.username, { color: theme.colors.text }]}>{user?.username || "User"}</Text>
            <Text style={[styles.email, { color: theme.colors.textSecondary }]}>{user?.email || "Signed in"}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </Card>
    );
  };

  const renderQuickActions = () => (
    <View style={styles.quickActions}>
      <Button
        title="Help"
        icon="help-circle-outline"
        variant="ghost"
        size="small"
        onPress={() => {
          // TODO: Navigate to help screen
          console.log("Navigate to help");
        }}
        style={styles.quickActionButton}
      />
      <Button
        title={settings.about.title}
        icon="information-circle-outline"
        variant="ghost"
        size="small"
        onPress={() => {
          // TODO: Show about modal
          console.log("Show about modal");
        }}
        style={styles.quickActionButton}
      />
    </View>
  );

  return (
    <SettingsLayout title={settings.title}>
      {/* User Info Section */}
      {renderUserInfo()}

      {/* Settings Categories */}
      <SettingsSection variant="grouped" style={styles.categoriesContainer}>
        {settingsCategories.map(renderSettingCategory)}
      </SettingsSection>

      {/* Quick Actions */}
      {renderQuickActions()}

      {/* App Info */}
      <View style={styles.appInfo}>
        <Text style={[styles.appVersion, { color: theme.colors.textSecondary }]}>Version 1.0.0</Text>
      </View>
    </SettingsLayout>
  );
}

const styles = StyleSheet.create({
  userCard: {
    marginBottom: 24,
    padding: 16,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  avatarText: {
    color: "white",
    fontSize: 20,
    fontWeight: "600",
  },
  userDetails: {
    flex: 1,
  },
  username: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
  },
  categoriesContainer: {
    marginBottom: 32,
  },
  categoryContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    minHeight: 72,
  },
  categoryLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  categoryTextContainer: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  quickActions: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  quickActionButton: {
    flex: 1,
  },
  appInfo: {
    alignItems: "center",
    paddingVertical: 16,
  },
  appVersion: {
    fontSize: 12,
  },
});
