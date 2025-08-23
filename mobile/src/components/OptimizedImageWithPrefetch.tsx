import React, { useEffect, useState, useRef, memo } from 'react';
import {
  Image,
  ImageProps,
  View,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';

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
      // Use Expo Image prefetch for better performance
      await ExpoImage.prefetch(uri, { priority });
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

    // Batch prefetch with staggered timing to avoid blocking
    const batchSize = 3;
    for (let i = 0; i < uniqueUris.length; i += batchSize) {
      const batch = uniqueUris.slice(i, i + batchSize);
      await Promise.all(
        batch.map(uri => this.prefetchImage(uri, priority))
      );
      
      // Small delay between batches to keep UI responsive
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

interface OptimizedImageProps extends Omit<ImageProps, 'source'> {
  source: { uri: string } | number;
  placeholder?: string;
  priority?: 'low' | 'normal' | 'high';
  prefetch?: boolean;
  onLoad?: () => void;
  onError?: (error: any) => void;
  showLoading?: boolean;
  recyclingKey?: string; // For list optimization
  blurRadius?: number;
  transition?: number; // Fade-in duration in ms
}

export const OptimizedImage = memo(({
  source,
  placeholder,
  priority = 'normal',
  prefetch = true,
  onLoad,
  onError,
  showLoading = false,
  recyclingKey,
  blurRadius = 0,
  transition = 200,
  style,
  ...props
}: OptimizedImageProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const mountedRef = useRef(true);

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

  const handleLoad = () => {
    if (mountedRef.current) {
      setLoading(false);
      setError(false);
      onLoad?.();
    }
  };

  const handleError = (e: any) => {
    if (mountedRef.current) {
      setLoading(false);
      setError(true);
      onError?.(e);
    }
  };

  // Use Expo Image for better performance and caching
  if (typeof source === 'object' && 'uri' in source) {
    return (
      <View style={style}>
        <ExpoImage
          source={source.uri}
          placeholder={placeholder}
          placeholderContentFit="cover"
          contentFit="cover"
          transition={transition}
          blurRadius={blurRadius}
          recyclingKey={recyclingKey}
          cachePolicy="memory-disk"
          priority={priority}
          onLoad={handleLoad}
          onError={handleError}
          style={[StyleSheet.absoluteFill, style]}
          {...props}
        />
        {showLoading && loading && (
          <View style={[StyleSheet.absoluteFill, styles.loadingContainer]}>
            <ActivityIndicator size="small" color="#999" />
          </View>
        )}
      </View>
    );
  }

  // Fallback to regular Image for local assets
  return (
    <Image
      source={source as number}
      style={style}
      onLoad={handleLoad}
      onError={handleError}
      {...props}
    />
  );
});

OptimizedImage.displayName = 'OptimizedImage';

// Hook for prefetching images before navigation
export function usePrefetchImages(imageUris: string[], priority: 'low' | 'normal' | 'high' = 'low') {
  useEffect(() => {
    if (imageUris.length > 0) {
      // Delay prefetch to not block initial render
      const timeoutId = setTimeout(() => {
        imageCacheManager.prefetchBatch(imageUris, priority);
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [imageUris, priority]);
}

// Utility to prefetch images for upcoming screens
export async function prefetchScreenImages(screenName: string) {
  const imagesByScreen: Record<string, string[]> = {
    'meal-history': [
      // Add meal history image URLs here when available
    ],
    'progress': [
      // Add progress dashboard image URLs here when available
    ],
    'settings': [
      // Add settings image URLs here when available
    ],
  };

  const images = imagesByScreen[screenName];
  if (images && images.length > 0) {
    await imageCacheManager.prefetchBatch(images, 'normal');
  }
}

const styles = StyleSheet.create({
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
});