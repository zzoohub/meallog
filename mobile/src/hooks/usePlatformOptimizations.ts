/**
 * Platform Optimization Hooks
 * React hooks for platform-specific optimizations and behaviors
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Platform, Dimensions, AppState, AppStateStatus } from 'react-native';
import { PlatformInfo, PlatformOptimizer, PlatformHaptics } from '@/utils/platform-optimizations';
import { performanceMonitor, memoryManager } from '@/lib/performance';

// =============================================================================
// PLATFORM DETECTION HOOKS
// =============================================================================

/**
 * Hook for responsive platform detection
 */
export function usePlatformInfo() {
  const [dimensions, setDimensions] = useState(() => Dimensions.get('window'));
  
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });

    return () => subscription?.remove();
  }, []);

  const platformInfo = useMemo(() => ({
    ...PlatformInfo,
    screenWidth: dimensions.width,
    screenHeight: dimensions.height,
    isLandscape: dimensions.width > dimensions.height,
    isPortrait: dimensions.height > dimensions.width,
  }), [dimensions]);

  return platformInfo;
}

/**
 * Hook for detecting device capabilities and performance tier
 */
export function useDeviceCapabilities() {
  const platformInfo = usePlatformInfo();
  
  const capabilities = useMemo(() => {
    const isLowEndDevice = () => {
      const totalPixels = platformInfo.screenWidth * platformInfo.screenHeight;
      
      if (Platform.OS === 'android') {
        return totalPixels < 2000000 || (Platform.Version as number) < 24;
      } else if (Platform.OS === 'ios') {
        const version = parseFloat(Platform.Version);
        return version < 13 || totalPixels < 1500000;
      }
      
      return false;
    };

    const performanceTier = () => {
      if (isLowEndDevice()) return 'low';
      if (platformInfo.isTablet || platformInfo.isHighDensity) return 'high';
      return 'medium';
    };

    return {
      isLowEndDevice: isLowEndDevice(),
      performanceTier: performanceTier(),
      supportsHaptics: Platform.OS !== 'web',
      supportsBlur: Platform.OS === 'ios',
      supportsElevation: Platform.OS === 'android',
      supportsGradients: true,
      maxTextureSize: Platform.OS === 'ios' ? 4096 : 2048,
      recommendedImageQuality: isLowEndDevice() ? 0.7 : 0.9,
    };
  }, [platformInfo]);

  return capabilities;
}

// =============================================================================
// PERFORMANCE OPTIMIZATION HOOKS
// =============================================================================

/**
 * Hook for adaptive performance settings
 */
export function useAdaptivePerformance() {
  const deviceCapabilities = useDeviceCapabilities();
  const [memoryPressure, setMemoryPressure] = useState(false);
  const [batteryOptimization, setBatteryOptimization] = useState(false);

  useEffect(() => {
    // Monitor memory pressure
    const removeMemoryListener = memoryManager.addMemoryWarningListener(() => {
      setMemoryPressure(true);
      performanceMonitor.recordEvent({
        name: 'memory_pressure_detected',
        timestamp: new Date(),
        metadata: { platform: Platform.OS },
      });
    });

    // Monitor app state for battery optimization
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background') {
        setBatteryOptimization(true);
      } else if (nextAppState === 'active') {
        setBatteryOptimization(false);
        setMemoryPressure(false);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      removeMemoryListener();
      subscription.remove();
    };
  }, []);

  const optimizedSettings = useMemo(() => {
    const baseSettings = PlatformOptimizer.getOptimalSettings();
    
    // Adjust settings based on current conditions
    if (memoryPressure || deviceCapabilities.isLowEndDevice) {
      return {
        ...baseSettings,
        imageQuality: Math.min(baseSettings.imageQuality, 0.7),
        animationDuration: Math.max(baseSettings.animationDuration * 0.5, 150),
        cacheSize: Math.floor(baseSettings.cacheSize * 0.5),
        maxConcurrentRequests: Math.max(baseSettings.maxConcurrentRequests - 2, 2),
        enableHardwareAcceleration: false,
        useLazyLoading: true,
      };
    }

    if (batteryOptimization) {
      return {
        ...baseSettings,
        animationDuration: Math.max(baseSettings.animationDuration * 0.7, 200),
        enableHardwareAcceleration: false,
      };
    }

    return baseSettings;
  }, [deviceCapabilities, memoryPressure, batteryOptimization]);

  return {
    settings: optimizedSettings,
    conditions: {
      memoryPressure,
      batteryOptimization,
      isLowEndDevice: deviceCapabilities.isLowEndDevice,
    },
  };
}

/**
 * Hook for optimized image loading
 */
export function useOptimizedImage(uri: string, options: {
  width?: number;
  height?: number;
  priority?: 'low' | 'normal' | 'high';
} = {}) {
  const { settings } = useAdaptivePerformance();
  const deviceCapabilities = useDeviceCapabilities();
  
  const optimizedUri = useMemo(() => {
    if (!uri) return uri;

    const { width, height, priority = 'normal' } = options;
    const quality = priority === 'high' ? settings.imageQuality : settings.imageQuality * 0.9;
    
    // Calculate optimal dimensions based on device
    const maxDimension = deviceCapabilities.maxTextureSize;
    const optimalWidth = width ? Math.min(width, maxDimension) : undefined;
    const optimalHeight = height ? Math.min(height, maxDimension) : undefined;
    
    // Add optimization parameters to URI if it's a URL
    if (uri.startsWith('http')) {
      const separator = uri.includes('?') ? '&' : '?';
      const params = new URLSearchParams();
      
      if (optimalWidth) params.set('w', optimalWidth.toString());
      if (optimalHeight) params.set('h', optimalHeight.toString());
      params.set('q', Math.round(quality * 100).toString());
      params.set('f', Platform.OS === 'android' ? 'webp' : 'jpeg');
      
      return `${uri}${separator}${params.toString()}`;
    }
    
    return uri;
  }, [uri, options, settings.imageQuality, deviceCapabilities.maxTextureSize]);

  return optimizedUri;
}

// =============================================================================
// INTERACTION OPTIMIZATION HOOKS
// =============================================================================

/**
 * Hook for platform-optimized haptic feedback
 */
export function useHapticFeedback() {
  const deviceCapabilities = useDeviceCapabilities();
  
  const triggerImpact = useCallback(async (style: 'light' | 'medium' | 'heavy' = 'light') => {
    if (!deviceCapabilities.supportsHaptics) return;
    
    try {
      await PlatformHaptics.impact(style);
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  }, [deviceCapabilities.supportsHaptics]);

  const triggerNotification = useCallback(async (type: 'success' | 'warning' | 'error' = 'success') => {
    if (!deviceCapabilities.supportsHaptics) return;
    
    try {
      await PlatformHaptics.notification(type);
    } catch (error) {
      console.warn('Haptic notification failed:', error);
    }
  }, [deviceCapabilities.supportsHaptics]);

  return {
    impact: triggerImpact,
    notification: triggerNotification,
    isSupported: deviceCapabilities.supportsHaptics,
  };
}

/**
 * Hook for platform-optimized animations
 */
export function useOptimizedAnimations() {
  const { settings, conditions } = useAdaptivePerformance();
  const deviceCapabilities = useDeviceCapabilities();

  const animationConfig = useMemo(() => ({
    duration: settings.animationDuration,
    useNativeDriver: settings.enableHardwareAcceleration && !conditions.memoryPressure,
    easing: Platform.OS === 'ios' ? 'easeInEaseOut' : 'easeOut',
    enableGPU: Platform.OS === 'android' && settings.enableHardwareAcceleration,
    reduceMotion: conditions.batteryOptimization || deviceCapabilities.isLowEndDevice,
  }), [settings, conditions, deviceCapabilities]);

  const createAnimationConfig = useCallback((overrides: Partial<typeof animationConfig> = {}) => ({
    ...animationConfig,
    ...overrides,
  }), [animationConfig]);

  return {
    config: animationConfig,
    createConfig: createAnimationConfig,
    shouldAnimate: !animationConfig.reduceMotion,
  };
}

// =============================================================================
// NETWORKING OPTIMIZATION HOOKS
// =============================================================================

/**
 * Hook for adaptive network settings
 */
export function useNetworkOptimization() {
  const { settings } = useAdaptivePerformance();
  const [connectionType, setConnectionType] = useState<string>('unknown');
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    // Network monitoring simplified - assume connected by default
    // Advanced network detection removed for app simplification
    setIsConnected(true);
    setConnectionType('wifi');
  }, []);

  const networkSettings = useMemo(() => {
    const isSlowConnection = connectionType === 'cellular' || connectionType === '2g';
    const baseSettings = {
      maxConcurrentRequests: settings.maxConcurrentRequests,
      timeout: 10000,
      retryCount: 3,
      cacheStrategy: 'cache-first' as const,
    };

    if (!isConnected) {
      return {
        ...baseSettings,
        maxConcurrentRequests: 0,
        cacheStrategy: 'cache-only' as const,
      };
    }

    if (isSlowConnection) {
      return {
        ...baseSettings,
        maxConcurrentRequests: Math.max(settings.maxConcurrentRequests - 2, 1),
        timeout: 15000,
        retryCount: 2,
        cacheStrategy: 'cache-first' as const,
      };
    }

    return baseSettings;
  }, [settings.maxConcurrentRequests, connectionType, isConnected]);

  return {
    settings: networkSettings,
    connectionInfo: {
      type: connectionType,
      isConnected,
      isSlowConnection: connectionType === 'cellular' || connectionType === '2g',
    },
  };
}

// =============================================================================
// PLATFORM-SPECIFIC UI HOOKS
// =============================================================================

/**
 * Hook for platform-appropriate safe area handling
 */
export function useSafeAreaOptimization() {
  const platformInfo = usePlatformInfo();

  const safeAreaInsets = useMemo(() => {
    if (Platform.OS === 'ios') {
      return {
        top: platformInfo.hasNotch ? 44 : 20,
        bottom: platformInfo.hasNotch ? 34 : 0,
        left: 0,
        right: 0,
      };
    } else if (Platform.OS === 'android') {
      return {
        top: 24,
        bottom: 0,
        left: 0,
        right: 0,
      };
    } else {
      return {
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
      };
    }
  }, [platformInfo.hasNotch]);

  return safeAreaInsets;
}

/**
 * Hook for responsive design breakpoints
 */
export function useResponsiveBreakpoints() {
  const platformInfo = usePlatformInfo();

  const breakpoints = useMemo(() => {
    const { screenWidth, screenHeight } = platformInfo;
    const shortDimension = Math.min(screenWidth, screenHeight);
    const longDimension = Math.max(screenWidth, screenHeight);

    return {
      isSmall: shortDimension < 360,
      isMedium: shortDimension >= 360 && shortDimension < 414,
      isLarge: shortDimension >= 414 && shortDimension < 768,
      isXLarge: shortDimension >= 768,
      isCompact: longDimension / shortDimension < 1.5,
      aspectRatio: longDimension / shortDimension,
    };
  }, [platformInfo]);

  return breakpoints;
}

// =============================================================================
// EXPORT ALL HOOKS
// =============================================================================

export {
  usePlatformInfo,
  useDeviceCapabilities,
  useAdaptivePerformance,
  useOptimizedImage,
  useHapticFeedback,
  useOptimizedAnimations,
  useNetworkOptimization,
  useSafeAreaOptimization,
  useResponsiveBreakpoints,
};