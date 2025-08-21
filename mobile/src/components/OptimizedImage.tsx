import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { Image, ImageProps } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/lib/theme';

interface OptimizedImageProps extends Omit<ImageProps, 'source' | 'style' | 'placeholder'> {
  source: { uri?: string } | string | number;
  style?: ViewStyle;
  showPlaceholder?: boolean;
  placeholderIcon?: keyof typeof Ionicons.glyphMap;
  placeholderColor?: string;
  fadeDuration?: number;
  priority?: 'low' | 'normal' | 'high';
  cachePolicy?: 'none' | 'disk' | 'memory' | 'memory-disk';
}

export const OptimizedImage = React.memo<OptimizedImageProps>(({
  source,
  style,
  showPlaceholder = true,
  placeholderIcon = 'camera',
  placeholderColor,
  fadeDuration = 300,
  priority = 'normal',
  cachePolicy = 'memory-disk',
  contentFit = 'cover',
  ...props
}) => {
  const { theme, isDark } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  
  const defaultPlaceholderColor = placeholderColor || (isDark 
    ? 'rgba(255, 255, 255, 0.3)' 
    : 'rgba(0, 0, 0, 0.3)'
  );

  const handleLoadStart = useCallback(() => {
    setIsLoading(true);
    setHasError(false);
  }, []);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
  }, []);

  const handleError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
  }, []);

  const imageSource = typeof source === 'object' && 'uri' in source 
    ? source.uri 
    : source;

  const shouldShowPlaceholder = showPlaceholder && (isLoading || hasError || !imageSource);

  return (
    <View style={[styles.container, style]}>
      {imageSource && (
        <Image
          source={source}
          style={styles.image}
          contentFit={contentFit}
          transition={fadeDuration}
          priority={priority}
          cachePolicy={cachePolicy}
          onLoadStart={handleLoadStart}
          onLoad={handleLoad}
          onError={handleError}
          {...props}
        />
      )}
      
      {shouldShowPlaceholder && (
        <View style={[styles.placeholder, { backgroundColor: theme.colors.surface }, style]}>
          {isLoading && imageSource ? (
            <ActivityIndicator 
              size="small" 
              color={defaultPlaceholderColor} 
            />
          ) : (
            <Ionicons 
              name={placeholderIcon} 
              size={20} 
              color={defaultPlaceholderColor} 
            />
          )}
        </View>
      )}
    </View>
  );
});

OptimizedImage.displayName = 'OptimizedImage';

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
});