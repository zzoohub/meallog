/**
 * Platform-Specific Optimizations
 * Utilities for optimizing performance and behavior on different platforms
 */

import { Platform, Dimensions, PixelRatio } from 'react-native';
import { performanceMonitor } from '@/lib/performance';

// =============================================================================
// PLATFORM DETECTION AND CAPABILITIES
// =============================================================================

export const PlatformInfo = {
  
  // Version info
  version: Platform.Version,
  
  // Device capabilities
  get isTablet(): boolean {
    const { width, height } = Dimensions.get('window');
    const aspectRatio = Math.max(width, height) / Math.min(width, height);
    const pixelDensity = PixelRatio.get();
    
    if (Platform.OS === 'ios') {
      // iPad detection based on screen size and pixel density
      return (width >= 768 || height >= 768) && pixelDensity < 3;
    } else if (Platform.OS === 'android') {
      // Android tablet detection
      return aspectRatio < 1.6 && Math.min(width, height) >= 600;
    }
    
    return false;
  },
  
  get isLargeScreen(): boolean {
    const { width, height } = Dimensions.get('window');
    return Math.min(width, height) >= 414; // iPhone 6 Plus and larger
  },
  
  get isHighDensity(): boolean {
    return PixelRatio.get() >= 3;
  },
  
  get hasNotch(): boolean {
    if (Platform.OS === 'ios' && Platform.isPad) return false;
    
    // Simple heuristic for notch detection on iOS
    const { height, width } = Dimensions.get('window');
    const aspectRatio = height / width;
    
    return Platform.OS === 'ios' && (
      aspectRatio > 2.1 || // iPhone X and newer
      (height === 812 && width === 375) || // iPhone X, XS
      (height === 896 && width === 414) || // iPhone XR, XS Max, 11, 11 Pro Max
      (height === 844 && width === 390) || // iPhone 12/13/14
      (height === 926 && width === 428)    // iPhone 12/13/14 Pro Max
    );
  },
} as const;

// =============================================================================
// PERFORMANCE OPTIMIZATIONS BY PLATFORM
// =============================================================================

export class PlatformOptimizer {
  private static memoryBudgets = {
    ios: {
      low: 150, // MB
      medium: 300,
      high: 500,
    },
    android: {
      low: 100, // MB - Android devices vary more
      medium: 200,
      high: 400,
    },
    web: {
      low: 200, // MB
      medium: 500,
      high: 1000,
    },
  };

  /**
   * Get optimal settings for current platform and device
   */
  static getOptimalSettings(): {
    imageQuality: number;
    animationDuration: number;
    cacheSize: number;
    maxConcurrentRequests: number;
    enableHardwareAcceleration: boolean;
    useLazyLoading: boolean;
  } {
    const platform = Platform.OS;
    const memoryBudget = this.getMemoryBudget();
    const isLowEndDevice = this.isLowEndDevice();
    
    return {
      imageQuality: platform === 'ios' ? 0.9 : (isLowEndDevice ? 0.7 : 0.8),
      animationDuration: isLowEndDevice ? 200 : 300,
      cacheSize: memoryBudget.medium,
      maxConcurrentRequests: platform === 'ios' ? 6 : 4,
      enableHardwareAcceleration: !isLowEndDevice,
      useLazyLoading: true,
    };
  }

  /**
   * Detect if device is low-end
   */
  private static isLowEndDevice(): boolean {
    const { width, height } = Dimensions.get('window');
    const pixelRatio = PixelRatio.get();
    const totalPixels = width * height * pixelRatio * pixelRatio;
    
    // Heuristic based on screen resolution and platform
    if (Platform.OS === 'android') {
      // Android devices with low resolution or old API levels
      return totalPixels < 2000000 || (Platform.Version as number) < 24;
    } else if (Platform.OS === 'ios') {
      // Older iOS devices
      const version = parseFloat(Platform.Version);
      return version < 13 || totalPixels < 1500000;
    }
    
    return false;
  }

  /**
   * Get appropriate memory budget for platform
   */
  private static getMemoryBudget() {
    const platform = Platform.OS as keyof typeof this.memoryBudgets;
    return this.memoryBudgets[platform] || this.memoryBudgets.android;
  }

  /**
   * Get platform-specific image optimization settings
   */
  static getImageOptimization(): {
    format: 'jpeg' | 'png' | 'webp';
    quality: number;
    enableProgressiveJPEG: boolean;
    maxDimension: number;
  } {
    if (Platform.OS === 'android') {
      return {
        format: 'webp',
        quality: 0.8,
        enableProgressiveJPEG: true,
        maxDimension: 1080,
      };
    } else if (Platform.OS === 'ios') {
      return {
        format: 'jpeg',
        quality: 0.9,
        enableProgressiveJPEG: true,
        maxDimension: 1200,
      };
    } else {
      return {
        format: 'webp',
        quality: 0.85,
        enableProgressiveJPEG: true,
        maxDimension: 1920,
      };
    }
  }

  /**
   * Get platform-specific animation settings
   */
  static getAnimationSettings(): {
    useNativeDriver: boolean;
    duration: number;
    easing: string;
    enableGPUAcceleration: boolean;
  } {
    const isLowEnd = this.isLowEndDevice();
    
    return {
      useNativeDriver: !isLowEnd,
      duration: isLowEnd ? 200 : (Platform.OS === 'ios' ? 300 : 250),
      easing: Platform.OS === 'ios' ? 'easeInEaseOut' : 'easeOut',
      enableGPUAcceleration: Platform.OS === 'android' && !isLowEnd,
    };
  }
}

// =============================================================================
// PLATFORM-SPECIFIC COMPONENTS AND UTILITIES
// =============================================================================

/**
 * Platform-specific component renderer
 */
export function PlatformComponent<T extends Record<string, any>>({
  ios,
  android,
  web,
  native,
  children,
  ...props
}: {
  ios?: React.ComponentType<T> | React.ReactElement;
  android?: React.ComponentType<T> | React.ReactElement;
  web?: React.ComponentType<T> | React.ReactElement;
  native?: React.ComponentType<T> | React.ReactElement;
  children?: React.ReactNode;
} & T) {
  // Priority: specific platform > native > children
  const component = Platform.select({
    ios: ios || native,
    android: android || native,
    web: web,
  });

  if (component) {
    if (React.isValidElement(component)) {
      return component;
    }
    const Component = component as React.ComponentType<T>;
    return <Component {...props}>{children}</Component>;
  }

  return children as React.ReactElement;
}

/**
 * Platform-specific style utilities
 */
export const PlatformStyles = {
  /**
   * Get platform-specific shadow styles
   */
  shadow: (elevation: number = 2) => {
    if (Platform.OS === 'ios') {
      return {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: elevation },
        shadowOpacity: 0.1 + (elevation * 0.05),
        shadowRadius: elevation * 2,
      };
    } else if (Platform.OS === 'android') {
      return {
        elevation: elevation * 2,
      };
    } else {
      return {
        boxShadow: `0px ${elevation}px ${elevation * 2}px rgba(0,0,0,0.1)`,
      };
    }
  },

  /**
   * Get platform-specific safe area styles
   */
  safeArea: () => {
    if (Platform.OS === 'ios') {
      return {
        paddingTop: PlatformInfo.hasNotch ? 44 : 20,
        paddingBottom: PlatformInfo.hasNotch ? 34 : 0,
      };
    } else if (Platform.OS === 'android') {
      return {
        paddingTop: 24, // Standard Android status bar height
      };
    } else {
      return {};
    }
  },

  /**
   * Get platform-specific border radius
   */
  borderRadius: (size: 'small' | 'medium' | 'large' = 'medium') => {
    const radii = {
      small: Platform.OS === 'ios' ? 6 : 4,
      medium: Platform.OS === 'ios' ? 12 : 8,
      large: Platform.OS === 'ios' ? 20 : 16,
    };
    
    return radii[size];
  },

  /**
   * Get platform-specific typography
   */
  typography: () => {
    if (Platform.OS === 'ios') {
      return {
        fontFamily: 'System',
        fontWeight: '400' as const,
        letterSpacing: 0,
      };
    } else if (Platform.OS === 'android') {
      return {
        fontFamily: 'Roboto',
        fontWeight: 'normal' as const,
        letterSpacing: 0.25,
      };
    } else {
      return {
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto',
        fontWeight: 'normal' as const,
        letterSpacing: 0,
      };
    }
  },
};

// =============================================================================
// HAPTIC FEEDBACK OPTIMIZATION
// =============================================================================

export class PlatformHaptics {
  /**
   * Trigger platform-appropriate haptic feedback
   */
  static async impact(
    style: 'light' | 'medium' | 'heavy' = 'light'
  ): Promise<void> {
    if (Platform.OS === 'web') return;
    
    try {
      const { HapticFeedbackTypes } = await import('react-native').then(
        ({ HapticFeedbackTypes }) => ({ HapticFeedbackTypes })
      ).catch(() => ({ HapticFeedbackTypes: null }));
      
      if (Platform.OS === 'android' && HapticFeedbackTypes) {
        // Android haptics
        const { Vibration } = await import('react-native');
        const patterns = {
          light: [0, 25],
          medium: [0, 50],
          heavy: [0, 100],
        };
        Vibration.vibrate(patterns[style]);
      } else if (Platform.OS === 'ios') {
        // iOS haptics
        const Haptics = await import('expo-haptics');
        const styles = {
          light: Haptics.ImpactFeedbackStyle.Light,
          medium: Haptics.ImpactFeedbackStyle.Medium,
          heavy: Haptics.ImpactFeedbackStyle.Heavy,
        };
        await Haptics.impactAsync(styles[style]);
      }
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  }

  /**
   * Trigger notification haptic
   */
  static async notification(
    type: 'success' | 'warning' | 'error' = 'success'
  ): Promise<void> {
    if (Platform.OS === 'ios') {
      try {
        const Haptics = await import('expo-haptics');
        const types = {
          success: Haptics.NotificationFeedbackType.Success,
          warning: Haptics.NotificationFeedbackType.Warning,
          error: Haptics.NotificationFeedbackType.Error,
        };
        await Haptics.notificationAsync(types[type]);
      } catch (error) {
        console.warn('Notification haptic failed:', error);
      }
    } else {
      // Fallback to impact for Android
      await this.impact('medium');
    }
  }
}

// =============================================================================
// NAVIGATION OPTIMIZATIONS
// =============================================================================

export class PlatformNavigation {
  /**
   * Get platform-appropriate navigation options
   */
  static getNavigationConfig() {
    return {
      headerStyle: Platform.select({
        ios: {
          backgroundColor: 'transparent',
          blurEffect: 'regular',
        },
        android: {
          backgroundColor: '#ffffff',
          elevation: 4,
        },
        web: {
          backgroundColor: '#ffffff',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        },
      }),
      
      headerTitleStyle: Platform.select({
        ios: {
          fontSize: 17,
          fontWeight: '600',
        },
        android: {
          fontSize: 20,
          fontWeight: '500',
        },
        web: {
          fontSize: 18,
          fontWeight: '600',
        },
      }),
      
      animation: Platform.select({
        ios: 'slide_from_right',
        android: 'slide_from_right',
        web: 'fade',
      }),
      
      gestureEnabled: Platform.OS !== 'web',
      gestureResponseDistance: {
        horizontal: Platform.select({
          ios: 50,
          android: 35,
        }),
      },
    };
  }

  /**
   * Get platform-specific tab bar configuration
   */
  static getTabBarConfig() {
    return {
      tabBarStyle: Platform.select({
        ios: {
          backgroundColor: 'rgba(255,255,255,0.9)',
          borderTopWidth: 0,
          height: PlatformInfo.hasNotch ? 84 : 64,
          paddingBottom: PlatformInfo.hasNotch ? 20 : 8,
        },
        android: {
          backgroundColor: '#ffffff',
          elevation: 8,
          height: 64,
          paddingBottom: 8,
        },
        web: {
          backgroundColor: '#ffffff',
          boxShadow: '0 -2px 4px rgba(0,0,0,0.1)',
          height: 64,
        },
      }),
      
      tabBarLabelStyle: Platform.select({
        ios: {
          fontSize: 10,
          fontWeight: '500',
        },
        android: {
          fontSize: 12,
          fontWeight: '500',
        },
        web: {
          fontSize: 12,
          fontWeight: '500',
        },
      }),
    };
  }
}

// =============================================================================
// PERFORMANCE MONITORING
// =============================================================================

/**
 * Track platform-specific performance metrics
 */
export function trackPlatformPerformance() {
  const startTime = performance.now();
  
  // Platform-specific performance tracking
  performanceMonitor.recordMetric({
    name: 'platform_initialization',
    value: startTime,
    tags: {
      platform: Platform.OS,
      version: Platform.Version.toString(),
      isTablet: PlatformInfo.isTablet.toString(),
      isLowEnd: PlatformOptimizer['isLowEndDevice']().toString(),
    },
  });
  
  // Device capability metrics
  const { width, height } = Dimensions.get('window');
  performanceMonitor.recordEvent({
    name: 'device_capabilities',
    timestamp: new Date(),
    metadata: {
      screenWidth: width,
      screenHeight: height,
      pixelRatio: PixelRatio.get(),
      fontScale: PixelRatio.getFontScale(),
      hasNotch: PlatformInfo.hasNotch,
      isTablet: PlatformInfo.isTablet,
    },
  });
}

// Initialize platform tracking
if (__DEV__) {
  trackPlatformPerformance();
  
  // Make utilities available globally for debugging
  (globalThis as any).PlatformInfo = PlatformInfo;
  (globalThis as any).PlatformOptimizer = PlatformOptimizer;
  (globalThis as any).PlatformStyles = PlatformStyles;
  (globalThis as any).PlatformHaptics = PlatformHaptics;
}