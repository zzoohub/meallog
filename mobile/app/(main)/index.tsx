import React, { useState } from 'react';
import {
  StyleSheet,
  SafeAreaView,
} from 'react-native';
// Removed gesture handlers to prevent conflicts with scrolling
import * as Haptics from 'expo-haptics';

// Import orbital sections
import CameraCenter from '@/domains/camera/components/OrbitalCamera';
// MVP Phase 2: Social features (currently disabled)
// import SocialFeed from '@/domains/social/components/SocialFeed';
// import DiscoverSection from '@/domains/discover/components/DiscoverSection';
import ProgressDashboard from '@/domains/progress/components/ProgressDashboard';
import AICoach from '@/domains/ai-coach/components/AICoach';
import SettingsOrbital from '@/domains/settings/components/SettingsOrbital';
import { FloatingNotifications } from '@/components/FloatingNotifications';


enum OrbitalSection {
  Camera = 'camera',
  // Social = 'social',  // Phase 2
  // Discover = 'discover',  // Phase 2
  Progress = 'progress',
  AICoach = 'ai-coach',
  Settings = 'settings',
}

export default function OrbitalNavigation() {
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
    <SafeAreaView style={styles.container}>
        {renderActiveSection()}
        
        {/* Floating Notifications */}
        <FloatingNotifications />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
});