/**
 * Platform-Optimized Navigation Components
 * Provides platform-specific navigation behaviors and styling
 */

import { memo, useMemo } from 'react';
import { View, Text, Platform, ViewStyle, TextStyle, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { PlatformComponent, PlatformStyles } from '@/utils/platform-optimizations';
import { 
  usePlatformInfo, 
  useHapticFeedback, 
  useSafeAreaOptimization 
} from '@/hooks/usePlatformOptimizations';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/lib/theme';

// =============================================================================
// PLATFORM HEADER COMPONENT
// =============================================================================

interface PlatformHeaderProps {
  title?: string;
  showBackButton?: boolean;
  rightActions?: React.ReactNode;
  backgroundColor?: string;
  transparent?: boolean;
  blurEffect?: boolean;
  statusBarStyle?: 'light' | 'dark' | 'auto';
  elevation?: number;
  style?: ViewStyle;
  titleStyle?: TextStyle;
}

const PlatformHeader = memo<PlatformHeaderProps>(function PlatformHeader({
  title,
  showBackButton = true,
  rightActions,
  backgroundColor,
  transparent = false,
  blurEffect = false,
  statusBarStyle = 'auto',
  elevation,
  style,
  titleStyle,
}) {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const { impact } = useHapticFeedback();
  const safeAreaInsets = useSafeAreaInsets();
  const platformInfo = usePlatformInfo();

  // Platform-specific header styling
  const headerStyle = useMemo((): ViewStyle => {
    const baseStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: safeAreaInsets.top,
      paddingHorizontal: 16,
      paddingBottom: 8,
    };

    if (Platform.OS === 'ios') {
      return {
        ...baseStyle,
        height: 44 + safeAreaInsets.top + 8,
        backgroundColor: transparent 
          ? (blurEffect ? 'rgba(255,255,255,0.9)' : 'transparent')
          : (backgroundColor || theme.colors.background),
        borderBottomWidth: transparent ? 0 : StyleSheet.hairlineWidth,
        borderBottomColor: theme.colors.border,
        ...(!transparent && PlatformStyles.shadow(1)),
      };
    } else if (Platform.OS === 'android') {
      return {
        ...baseStyle,
        height: 56 + safeAreaInsets.top,
        backgroundColor: backgroundColor || theme.colors.background,
        elevation: elevation ?? (transparent ? 0 : 4),
      };
    } else {
      return {
        ...baseStyle,
        height: 64 + safeAreaInsets.top,
        backgroundColor: backgroundColor || theme.colors.background,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      };
    }
  }, [
    safeAreaInsets.top, 
    transparent, 
    blurEffect, 
    backgroundColor, 
    theme, 
    elevation
  ]);

  // Platform-specific title styling
  const platformTitleStyle = useMemo((): TextStyle => {
    const typography = PlatformStyles.typography();
    
    if (Platform.OS === 'ios') {
      return {
        ...typography,
        fontSize: 17,
        fontWeight: '600',
        color: theme.colors.text,
        textAlign: 'center',
        flex: 1,
      };
    } else if (Platform.OS === 'android') {
      return {
        ...typography,
        fontSize: 20,
        fontWeight: '500',
        color: theme.colors.text,
        marginLeft: showBackButton ? 32 : 0,
        flex: 1,
      };
    } else {
      return {
        ...typography,
        fontSize: 18,
        fontWeight: '600',
        color: theme.colors.text,
        flex: 1,
        textAlign: 'center',
      };
    }
  }, [theme.colors.text, showBackButton]);

  const handleBackPress = async () => {
    await impact('light');
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  // Set status bar style
  const computedStatusBarStyle = useMemo(() => {
    if (statusBarStyle === 'auto') {
      return theme.isDark ? 'light' : 'dark';
    }
    return statusBarStyle;
  }, [statusBarStyle, theme.isDark]);

  return (
    <>
      <StatusBar
        barStyle={`${computedStatusBarStyle}-content`}
        backgroundColor={Platform.OS === 'android' ? headerStyle.backgroundColor : undefined}
        translucent={Platform.OS === 'android'}
      />
      
      <View style={[headerStyle, style]}>
        {/* Back button */}
        {showBackButton && navigation.canGoBack() && (
          <PlatformComponent
            ios={
              <Button
                title=""
                icon="chevron-back"
                variant="text"
                size="medium"
                onPress={handleBackPress}
                style={{ paddingHorizontal: 0 }}
              />
            }
            android={
              <Button
                title=""
                icon="arrow-back"
                variant="text"
                size="medium"
                onPress={handleBackPress}
                style={{ paddingHorizontal: 0 }}
              />
            }
            web={
              <Button
                title=""
                icon="arrow-back"
                variant="text"
                size="medium"
                onPress={handleBackPress}
                style={{ paddingHorizontal: 0 }}
              />
            }
          />
        )}

        {/* Title */}
        {title && (
          <Text style={[platformTitleStyle, titleStyle]} numberOfLines={1}>
            {title}
          </Text>
        )}

        {/* Right actions */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {rightActions}
        </View>
      </View>
    </>
  );
});

// =============================================================================
// PLATFORM TAB BAR COMPONENT
// =============================================================================

interface PlatformTabBarProps {
  tabs: Array<{
    key: string;
    title: string;
    icon: keyof typeof Ionicons.glyphMap;
    badge?: string | number;
  }>;
  activeTab: string;
  onTabPress: (tabKey: string) => void;
  style?: ViewStyle;
}

const PlatformTabBar = memo<PlatformTabBarProps>(function PlatformTabBar({
  tabs,
  activeTab,
  onTabPress,
  style,
}) {
  const { theme } = useTheme();
  const { impact } = useHapticFeedback();
  const safeAreaInsets = useSafeAreaInsets();
  const platformInfo = usePlatformInfo();

  // Platform-specific tab bar styling
  const tabBarStyle = useMemo((): ViewStyle => {
    const baseStyle: ViewStyle = {
      flexDirection: 'row',
      paddingBottom: safeAreaInsets.bottom,
      paddingHorizontal: 8,
    };

    if (Platform.OS === 'ios') {
      return {
        ...baseStyle,
        height: 49 + safeAreaInsets.bottom,
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: theme.colors.border,
        ...PlatformStyles.shadow(1),
      };
    } else if (Platform.OS === 'android') {
      return {
        ...baseStyle,
        height: 56 + safeAreaInsets.bottom,
        backgroundColor: theme.colors.background,
        elevation: 8,
      };
    } else {
      return {
        ...baseStyle,
        height: 56 + safeAreaInsets.bottom,
        backgroundColor: theme.colors.background,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        boxShadow: '0 -2px 4px rgba(0,0,0,0.1)',
      };
    }
  }, [safeAreaInsets.bottom, theme]);

  const handleTabPress = async (tabKey: string) => {
    await impact('light');
    onTabPress(tabKey);
  };

  return (
    <View style={[tabBarStyle, style]}>
      {tabs.map((tab) => (
        <TabBarItem
          key={tab.key}
          tab={tab}
          isActive={activeTab === tab.key}
          onPress={() => handleTabPress(tab.key)}
        />
      ))}
    </View>
  );
});

// Tab bar item component
interface TabBarItemProps {
  tab: {
    key: string;
    title: string;
    icon: keyof typeof Ionicons.glyphMap;
    badge?: string | number;
  };
  isActive: boolean;
  onPress: () => void;
}

const TabBarItem = memo<TabBarItemProps>(function TabBarItem({
  tab,
  isActive,
  onPress,
}) {
  const { theme } = useTheme();

  const itemStyle = useMemo((): ViewStyle => ({
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  }), []);

  const iconColor = isActive ? theme.colors.primary : theme.colors.textSecondary;
  const textColor = isActive ? theme.colors.primary : theme.colors.textSecondary;

  const textStyle = useMemo((): TextStyle => {
    const typography = PlatformStyles.typography();
    
    return {
      ...typography,
      fontSize: Platform.select({ ios: 10, android: 12, default: 12 }),
      fontWeight: isActive ? '600' : '400',
      color: textColor,
      marginTop: 2,
    };
  }, [isActive, textColor]);

  return (
    <Button
      title=""
      variant="text"
      onPress={onPress}
      style={itemStyle}
    >
      <View style={{ alignItems: 'center' }}>
        <Ionicons name={tab.icon} size={24} color={iconColor} />
        <Text style={textStyle}>{tab.title}</Text>
        
        {/* Badge */}
        {tab.badge && (
          <View
            style={{
              position: 'absolute',
              top: -2,
              right: -2,
              backgroundColor: theme.colors.error,
              borderRadius: 10,
              minWidth: 16,
              height: 16,
              justifyContent: 'center',
              alignItems: 'center',
              paddingHorizontal: 4,
            }}
          >
            <Text
              style={{
                color: 'white',
                fontSize: 10,
                fontWeight: '600',
              }}
            >
              {tab.badge}
            </Text>
          </View>
        )}
      </View>
    </Button>
  );
});

// =============================================================================
// EXPORT COMPONENTS
// =============================================================================

PlatformHeader.displayName = 'PlatformHeader';
PlatformTabBar.displayName = 'PlatformTabBar';

export { PlatformHeader, PlatformTabBar };
export type { PlatformHeaderProps, PlatformTabBarProps };