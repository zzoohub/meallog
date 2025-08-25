import React, { useState, useEffect, useCallback } from "react";
import { StyleSheet } from "react-native";
import { useTheme } from "@/lib/theme";
import * as Haptics from "expo-haptics";

// Import orbital sections with lazy loading
import { FloatingNotifications } from "@/components/FloatingNotifications";
import {
  createLazyComponent,
  prefetchBatch,
  startNavigation,
  endNavigation,
  usePerformanceMonitor,
} from "@/lib/performance";

// Lazy load heavy components for better performance
const CameraCenter = createLazyComponent(() => import("@/domains/camera/components/Camera"));
const ProgressDashboard = createLazyComponent(() => import("@/domains/progress/components/ProgressDashboard"));
const AICoach = createLazyComponent(() => import("@/domains/ai-coach/components/AICoach"));
const SettingsOrbital = createLazyComponent(() => import("@/domains/settings/components/SettingsOrbital"));

// MVP Phase 2: Social features (lazy loaded but currently disabled)
// const SocialFeed = createLazyComponent(() => import('@/domains/social/components/SocialFeed'));
// const DiscoverSection = createLazyComponent(() => import('@/domains/discover/components/DiscoverSection'));

enum OrbitalSection {
  Camera = "camera",
  // Social = 'social',  // Phase 2
  // Discover = 'discover',  // Phase 2
  Progress = "progress",
  AICoach = "ai-coach",
  Settings = "settings",
}

// Map sections to prefetch targets
const SECTION_PREFETCH_MAP: Record<OrbitalSection, string[]> = {
  [OrbitalSection.Camera]: ["meal-history", "progress"],
  [OrbitalSection.Progress]: ["ai-coach", "settings"],
  [OrbitalSection.AICoach]: ["progress", "settings"],
  [OrbitalSection.Settings]: ["camera", "progress"],
};

export default function OrbitalNavigation() {
  const { theme } = useTheme();
  const [activeSection, setActiveSection] = useState<OrbitalSection>(OrbitalSection.Camera);
  const [preloadedSections, setPreloadedSections] = useState<Set<OrbitalSection>>(new Set([OrbitalSection.Camera]));
  const { mark, measure } = usePerformanceMonitor("OrbitalNavigation");

  // Prefetch navigation targets based on current section
  // usePrefetchNavigation(SECTION_PREFETCH_MAP[activeSection] || []);

  // Preload adjacent sections for instant navigation
  const preloadAdjacentSections = useCallback(
    async (currentSection: OrbitalSection) => {
      const sections = Object.values(OrbitalSection);
      const currentIndex = sections.indexOf(currentSection);

      // Preload next and previous sections
      const adjacentSections = [sections[currentIndex - 1], sections[currentIndex + 1]].filter(Boolean);

      adjacentSections.forEach(section => {
        if (!preloadedSections.has(section)) {
          // Dynamically import the component to preload it
          switch (section) {
            case OrbitalSection.Progress:
              import("@/domains/progress/components/ProgressDashboard").then(() => {
                setPreloadedSections(prev => new Set([...prev, section]));
              });
              break;
            case OrbitalSection.AICoach:
              import("@/domains/ai-coach/components/AICoach").then(() => {
                setPreloadedSections(prev => new Set([...prev, section]));
              });
              break;
            case OrbitalSection.Settings:
              import("@/domains/settings/components/SettingsOrbital").then(() => {
                setPreloadedSections(prev => new Set([...prev, section]));
              });
              break;
          }
        }
      });
    },
    [preloadedSections],
  );

  // Prefetch data for all main sections on mount
  useEffect(() => {
    const prefetchMainData = async () => {
      // Wait a bit for initial render
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Prefetch common data that multiple sections might use
      await prefetchBatch([
        {
          key: ["user", "profile"],
          fetcher: async () => {
            const { useAuthStore } = await import("@/domains/auth/stores/authStore");
            return useAuthStore.getState().user;
          },
          staleTime: 1000 * 60 * 10, // 10 minutes
        },
        {
          key: ["settings", "preferences"],
          fetcher: async () => {
            const { useSettingsStore } = await import("@/domains/settings/stores/settingsStore");
            return useSettingsStore.getState();
          },
          staleTime: 1000 * 60 * 15, // 15 minutes
        },
        {
          key: ["meals", "recent", "summary"],
          fetcher: async () => {
            const { MealStorageService } = await import("@/domains/meals/services/mealStorage");
            return MealStorageService.getRecentMeals(5);
          },
          staleTime: 1000 * 60 * 5, // 5 minutes
        },
      ]);

      // Start preloading adjacent sections
      preloadAdjacentSections(OrbitalSection.Camera);
    };

    prefetchMainData();
  }, [preloadAdjacentSections]);

  const navigateToSection = useCallback(
    (section: OrbitalSection) => {
      if (section === activeSection) return;

      // Validate section exists
      if (!Object.values(OrbitalSection).includes(section)) {
        console.warn("Invalid section navigation attempted:", section);
        return;
      }

      // Track navigation performance
      startNavigation(activeSection, section);

      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (error) {
        console.warn("Haptics feedback failed:", error);
      }

      // Instant section change to prevent flickering
      setActiveSection(section);

      // End navigation tracking
      requestAnimationFrame(() => {
        endNavigation(activeSection, section);
      });

      // Preload adjacent sections for the new active section
      preloadAdjacentSections(section);
    },
    [activeSection, preloadAdjacentSections],
  );

  const renderActiveSection = () => {
    const commonProps = {
      onNavigate: (section: string) => navigateToSection(section as OrbitalSection),
      isActive: true,
    };

    switch (activeSection) {
      case OrbitalSection.Camera:
        return <CameraCenter {...commonProps} />;
      // Phase 2: Social features
      // case OrbitalSection.Social:
      //   return <SocialFeed {...commonProps} />;
      // case OrbitalSection.Discover:
      //   return <DiscoverSection {...commonProps} />;
      case OrbitalSection.Progress:
        return <ProgressDashboard {...commonProps} />;
      case OrbitalSection.AICoach:
        return <AICoach {...commonProps} />;
      case OrbitalSection.Settings:
        return <SettingsOrbital {...commonProps} />;
      default:
        return <CameraCenter {...commonProps} />;
    }
  };

  return (
    <>
      {renderActiveSection()}
      {/* Floating Notifications */}
      <FloatingNotifications />
    </>
  );
}

const styles = StyleSheet.create({
  // No styles needed for main container
});
