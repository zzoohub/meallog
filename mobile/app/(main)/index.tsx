import React, { useState } from 'react';
import {
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useTheme } from '@/lib/theme';
// Removed gesture handlers to prevent conflicts with scrolling
import * as Haptics from 'expo-haptics';

// Import orbital sections with lazy loading
import { createLazyComponent } from '@/lib/lazy';
import { FloatingNotifications } from '@/components/FloatingNotifications';

// Lazy load heavy components for better performance
const CameraCenter = createLazyComponent(() => import('@/domains/camera/components/OrbitalCamera'));
const ProgressDashboard = createLazyComponent(() => import('@/domains/progress/components/ProgressDashboard'));
const AICoach = createLazyComponent(() => import('@/domains/ai-coach/components/AICoach'));
const SettingsOrbital = createLazyComponent(() => import('@/domains/settings/components/SettingsOrbital'));

// MVP Phase 2: Social features (lazy loaded but currently disabled)
// const SocialFeed = createLazyComponent(() => import('@/domains/social/components/SocialFeed'));
// const DiscoverSection = createLazyComponent(() => import('@/domains/discover/components/DiscoverSection'));


enum OrbitalSection {
  Camera = 'camera',
  // Social = 'social',  // Phase 2
  // Discover = 'discover',  // Phase 2
  Progress = 'progress',
  AICoach = 'ai-coach',
  Settings = 'settings',
}

export default function OrbitalNavigation() {
  const { theme } = useTheme();
  const [activeSection, setActiveSection] = useState<OrbitalSection>(OrbitalSection.Camera);

  const navigateToSection = (section: OrbitalSection) => {
    if (section === activeSection) return;
    
    // Validate section exists
    if (!Object.values(OrbitalSection).includes(section)) {
      console.warn('Invalid section navigation attempted:', section);
      return;
    }
    
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.warn('Haptics feedback failed:', error);
    }
    
    // Instant section change to prevent flickering
    setActiveSection(section);
  };

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
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {renderActiveSection()}
        
        {/* Floating Notifications */}
        <FloatingNotifications />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});