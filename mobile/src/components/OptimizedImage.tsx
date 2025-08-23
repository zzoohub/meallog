import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { Image, ImageProps } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/lib/theme';

// Image cache manager for prefetching
class ImageCacheManager {
  private static instance: ImageCacheManager;
  private prefetchQueue: Set<string> = new Set();
  private cachedImages: Map<string, boolean> = new Map();

  static getInstance(): ImageCacheManager {
    if (!ImageCacheManager.instance) {
      ImageCacheManager.instance = new ImageCacheManager();
    }
    return ImageCacheManager.instance;
  }

  async prefetchImage(uri: string, priority: 'low' | 'normal' | 'high' = 'normal') {
    if (!uri || this.cachedImages.get(uri) || this.prefetchQueue.has(uri)) {
      return;
    }

    this.prefetchQueue.add(uri);

    try {
      await Image.prefetch(uri);
      this.cachedImages.set(uri, true);
    } catch (error) {
      console.warn('Failed to prefetch image:', uri, error);
    } finally {
      this.prefetchQueue.delete(uri);
    }
  }

  async prefetchBatch(uris: string[], priority: 'low' | 'normal' | 'high' = 'low') {
    const uniqueUris = [...new Set(uris)].filter(uri => 
      uri && !this.cachedImages.get(uri) && !this.prefetchQueue.has(uri)
    );

    if (uniqueUris.length === 0) return;

    const batchSize = 3;
    for (let i = 0; i < uniqueUris.length; i += batchSize) {
      const batch = uniqueUris.slice(i, i + batchSize);
      await Promise.all(
        batch.map(uri => this.prefetchImage(uri, priority))
      );
      
      if (i + batchSize < uniqueUris.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }

  clearCache() {
    this.cachedImages.clear();
    this.prefetchQueue.clear();
  }
}

export const imageCacheManager = ImageCacheManager.getInstance();

interface OptimizedImageProps extends Omit<ImageProps, 'source' | 'style' | 'placeholder'> {
  source: { uri?: string } | string | number;
  style?: ViewStyle;
  showPlaceholder?: boolean;
  placeholderIcon?: keyof typeof Ionicons.glyphMap;
  placeholderColor?: string;
  transition?: number;
  priority?: 'low' | 'normal' | 'high';
  cachePolicy?: 'none' | 'disk' | 'memory' | 'memory-disk';
  prefetch?: boolean;
  recyclingKey?: string;
  blurRadius?: number;
}

export const OptimizedImage = React.memo<OptimizedImageProps>(({
  source,
  style,
  showPlaceholder = true,
  placeholderIcon = 'camera',
  placeholderColor,
  transition = 300,
  priority = 'normal',
  cachePolicy = 'memory-disk',
  contentFit = 'cover',
  prefetch = true,
  recyclingKey,
  blurRadius = 0,
  ...props
}) => {
  const { theme, isDark } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const mountedRef = useRef(true);
  
  const defaultPlaceholderColor = placeholderColor || (isDark 
    ? 'rgba(255, 255, 255, 0.3)' 
    : 'rgba(0, 0, 0, 0.3)'
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (prefetch && typeof source === 'object' && 'uri' in source && source.uri) {
      imageCacheManager.prefetchImage(source.uri, priority);
    }
  }, [source, prefetch, priority]);

  const handleLoadStart = useCallback(() => {
    if (mountedRef.current) {
      setIsLoading(true);
      setHasError(false);
    }
  }, []);

  const handleLoad = useCallback(() => {
    if (mountedRef.current) {
      setIsLoading(false);
      setHasError(false);
    }
  }, []);

  const handleError = useCallback(() => {
    if (mountedRef.current) {
      setIsLoading(false);
      setHasError(true);
    }
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
          transition={transition}
          priority={priority}
          cachePolicy={cachePolicy}
          {...(recyclingKey && { recyclingKey })}
          {...(blurRadius && { blurRadius })}
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

// Hook for prefetching images before navigation
export function usePrefetchImages(imageUris: string[], priority: 'low' | 'normal' | 'high' = 'low') {
  useEffect(() => {
    if (imageUris.length > 0) {
      const timeoutId = setTimeout(() => {
        imageCacheManager.prefetchBatch(imageUris, priority);
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [imageUris, priority]);
}