/**
 * Platform-Optimized Image Component
 * Provides adaptive image loading with platform-specific optimizations
 */

import { memo, useState, useMemo } from 'react';
import { View, Platform, ViewStyle, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { 
  useOptimizedImage, 
  useDeviceCapabilities, 
  useAdaptivePerformance 
} from '@/hooks/usePlatformOptimizations';
import { PlatformOptimizer } from '@/utils/platform-optimizations';
import { useTheme } from '@/lib/theme';

interface PlatformImageProps {
  source: string | { uri: string } | number;
  width?: number;
  height?: number;
  style?: ViewStyle;
  priority?: 'low' | 'normal' | 'high';
  placeholder?: string;
  blurRadius?: number;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
  onLoad?: () => void;
  onError?: (error: any) => void;
  onLoadStart?: () => void;
  progressiveLoading?: boolean;
  cachePolicy?: 'memory' | 'disk' | 'memory-disk' | 'none';
  accessibilityLabel?: string;
  testID?: string;
}

const PlatformImage = memo<PlatformImageProps>(function PlatformImage({
  source,
  width,
  height,
  style,
  priority = 'normal',
  placeholder,
  blurRadius,
  resizeMode = 'cover',
  onLoad,
  onError,
  onLoadStart,
  progressiveLoading = true,
  cachePolicy = 'memory-disk',
  accessibilityLabel,
  testID,
}) {
  const { theme } = useTheme();
  const deviceCapabilities = useDeviceCapabilities();
  const { settings } = useAdaptivePerformance();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Get source URI for optimization
  const sourceUri = useMemo(() => {
    if (typeof source === 'string') return source;
    if (typeof source === 'object' && 'uri' in source) return source.uri;
    return null;
  }, [source]);

  // Optimize image URI based on platform and device capabilities
  const optimizedUri = useOptimizedImage(sourceUri || '', {
    width,
    height,
    priority,
  });

  // Platform-specific image optimization settings
  const imageSettings = useMemo(() => {
    const baseSettings = PlatformOptimizer.getImageOptimization();
    
    return {
      format: baseSettings.format,
      quality: priority === 'high' 
        ? baseSettings.quality 
        : baseSettings.quality * 0.9,
      enableProgressiveJPEG: progressiveLoading && baseSettings.enableProgressiveJPEG,
      cachePolicy: deviceCapabilities.isLowEndDevice ? 'memory' : cachePolicy,
    };
  }, [priority, progressiveLoading, deviceCapabilities.isLowEndDevice, cachePolicy]);

  // Handle loading states
  const handleLoadStart = () => {
    setIsLoading(true);
    setHasError(false);
    onLoadStart?.();
  };

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
    onLoad?.();
  };

  const handleError = (error: any) => {
    setIsLoading(false);
    setHasError(true);
    onError?.(error);
  };

  // Platform-specific image props
  const imageProps = useMemo(() => {
    const props: any = {
      style: [
        {
          width,
          height,
        },
        style,
      ],
      source: sourceUri ? { uri: optimizedUri } : source,
      contentFit: resizeMode,
      onLoadStart: handleLoadStart,
      onLoad: handleLoad,
      onError: handleError,
      accessibilityLabel,
      testID,
    };

    // Platform-specific optimizations
    if (Platform.OS === 'ios') {
      props.blurRadius = blurRadius;
      props.cachePolicy = imageSettings.cachePolicy;
    } else if (Platform.OS === 'android') {
      props.fadeDuration = deviceCapabilities.isLowEndDevice ? 0 : 300;
    }

    // Progressive loading for supported formats
    if (imageSettings.enableProgressiveJPEG && sourceUri?.includes('.jpg')) {
      props.progressiveRenderingEnabled = true;
    }

    return props;
  }, [
    width,
    height,
    style,
    sourceUri,
    optimizedUri,
    source,
    resizeMode,
    blurRadius,
    accessibilityLabel,
    testID,
    imageSettings,
    deviceCapabilities.isLowEndDevice,
  ]);

  // Render loading placeholder
  const renderLoadingPlaceholder = () => {
    if (!isLoading && !hasError) return null;

    return (
      <View
        style={[
          {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: theme.colors.surface,
            justifyContent: 'center',
            alignItems: 'center',
          },
        ]}
      >
        {isLoading && (
          <ActivityIndicator
            size="small"
            color={theme.colors.primary}
          />
        )}
        {hasError && placeholder && (
          <Image
            source={{ uri: placeholder }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
          />
        )}
      </View>
    );
  };

  // Low-end device optimizations
  if (deviceCapabilities.isLowEndDevice && priority === 'low') {
    // Use a simpler placeholder for low-priority images on low-end devices
    return (
      <View
        style={[
          {
            width,
            height,
            backgroundColor: theme.colors.surface,
          },
          style,
        ]}
        testID={testID}
      />
    );
  }

  return (
    <View style={{ position: 'relative' }}>
      <Image {...imageProps} />
      {renderLoadingPlaceholder()}
    </View>
  );
});

PlatformImage.displayName = 'PlatformImage';

export { PlatformImage };
export type { PlatformImageProps };