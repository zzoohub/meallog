import { useState, useCallback, useRef, useEffect } from 'react';
import { Alert } from 'react-native';
import type { CameraView } from 'expo-camera';
import { cameraService } from '../services/cameraService';
import { mealProcessingService } from '@/domains/meals/services/mealProcessingService';
import type {
  CameraSettings,
  PhotoCapture,
  CameraUIState,
  CameraError,
  CameraPermissionStatus,
  ProcessingStage,
  AnalysisOverlay,
  CameraPerformance
} from '../types';

/**
 * Primary camera hook for photo capture and management
 */
export function useCamera() {
  const [settings, setSettings] = useState<CameraSettings | null>(null);
  const [uiState, setUIState] = useState<CameraUIState>(() => 
    cameraService.createInitialUIState()
  );
  const [error, setError] = useState<CameraError | null>(null);
  const [permissions, setPermissions] = useState<CameraPermissionStatus | null>(null);
  const cameraRef = useRef<CameraView>(null);

  // Initialize camera
  const initialize = useCallback(async () => {
    try {
      await cameraService.initialize();
      const savedSettings = await cameraService.loadSettings();
      setSettings(savedSettings);
      
      const permissionStatus = await cameraService.getCameraPermissionStatus();
      setPermissions(permissionStatus);
    } catch (err) {
      const cameraError = err as CameraError;
      setError(cameraError);
      console.error('Camera initialization failed:', cameraError);
    }
  }, []);

  // Request permissions
  const requestPermissions = useCallback(async () => {
    try {
      const result = await cameraService.requestCameraPermissions();
      setPermissions(result);
      
      if (!result.granted) {
        Alert.alert(
          'Camera Permission Required',
          'Please grant camera permission to take photos of your meals.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => {
              // Open device settings (platform-specific implementation needed)
            }}
          ]
        );
      }
      
      return result;
    } catch (err) {
      const cameraError = err as CameraError;
      setError(cameraError);
      return { granted: false, canAskAgain: false, status: 'denied' as any };
    }
  }, []);

  // Capture photo
  const capturePhoto = useCallback(async (customSettings?: Partial<CameraSettings>) => {
    if (!cameraRef.current || !settings) {
      setError({
        code: 'CAMERA_UNAVAILABLE',
        message: 'Camera not ready',
        recoverable: true
      });
      return null;
    }

    setUIState(prev => ({ ...prev, isCapturing: true }));
    setError(null);

    try {
      const photoSettings = customSettings ? { ...settings, ...customSettings } : settings;
      const photo = await cameraService.capturePhoto(cameraRef.current, photoSettings);
      
      return photo;
    } catch (err) {
      const cameraError = err as CameraError;
      setError(cameraError);
      
      if (!cameraError.recoverable) {
        Alert.alert(
          'Camera Error',
          cameraError.message + (cameraError.suggestion ? `\n\n${cameraError.suggestion}` : ''),
          [{ text: 'OK' }]
        );
      }
      
      return null;
    } finally {
      setUIState(prev => ({ ...prev, isCapturing: false }));
    }
  }, [settings]);

  // Process captured photo
  const processPhoto = useCallback(async (photoUri: string) => {
    setUIState(prev => ({ ...prev, isProcessing: true, processingProgress: 0 }));
    setError(null);

    try {
      // Update progress
      setUIState(prev => ({ ...prev, processingProgress: 25 }));
      
      // Process the photo
      const result = await mealProcessingService.processPhoto(photoUri);
      
      setUIState(prev => ({ ...prev, processingProgress: 75 }));
      
      // Analyze the meal
      const analysis = await mealProcessingService.analyzeMealPhoto(result.processedUri);
      
      setUIState(prev => ({ ...prev, processingProgress: 100 }));
      
      return { processedPhoto: result, analysis };
    } catch (err) {
      const cameraError = err as CameraError;
      setError(cameraError);
      throw cameraError;
    } finally {
      setTimeout(() => {
        setUIState(prev => ({ 
          ...prev, 
          isProcessing: false, 
          processingProgress: 0 
        }));
      }, 500);
    }
  }, []);

  // Capture and process in one step
  const captureAndProcess = useCallback(async (customSettings?: Partial<CameraSettings>) => {
    const photo = await capturePhoto(customSettings);
    if (!photo) return null;

    const result = await processPhoto(photo.uri);
    return { photo, ...result };
  }, [capturePhoto, processPhoto]);

  // Update camera settings
  const updateSettings = useCallback(async (newSettings: Partial<CameraSettings>) => {
    if (!settings) return;
    
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    await cameraService.saveSettings(updatedSettings);
  }, [settings]);

  // Toggle flash mode
  const toggleFlash = useCallback(() => {
    if (!settings) return;
    
    const modes = ['off', 'on', 'auto'] as const;
    const currentIndex = modes.indexOf(settings.flashMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    const nextMode = modes[nextIndex];
    
    updateSettings({ flashMode: nextMode });
  }, [settings, updateSettings]);

  // Zoom control
  const setZoom = useCallback((zoomLevel: number) => {
    const clampedZoom = Math.max(0, Math.min(1, zoomLevel));
    setUIState(prev => ({ ...prev, zoomLevel: clampedZoom }));
    updateSettings({ zoom: clampedZoom });
  }, [updateSettings]);

  // Focus point control
  const setFocusPoint = useCallback((point: { x: number; y: number }) => {
    setUIState(prev => ({ 
      ...prev, 
      focusPoint: point,
      showFocusArea: true 
    }));
    
    // Hide focus area after 2 seconds
    setTimeout(() => {
      setUIState(prev => ({ 
        ...prev, 
        showFocusArea: false,
        focusPoint: null 
      }));
    }, 2000);
  }, []);

  // Timer functionality
  const startTimer = useCallback((delay: number) => {
    if (delay === 0) {
      capturePhoto();
      return;
    }

    setUIState(prev => ({ 
      ...prev, 
      isTimerActive: true, 
      timerCountdown: delay 
    }));

    const interval = setInterval(() => {
      setUIState(prev => {
        if (prev.timerCountdown <= 1) {
          clearInterval(interval);
          // Capture photo after countdown
          setTimeout(() => capturePhoto(), 100);
          return { 
            ...prev, 
            isTimerActive: false, 
            timerCountdown: 0 
          };
        }
        return { ...prev, timerCountdown: prev.timerCountdown - 1 };
      });
    }, 1000);
  }, [capturePhoto]);

  // Cancel timer
  const cancelTimer = useCallback(() => {
    setUIState(prev => ({ 
      ...prev, 
      isTimerActive: false, 
      timerCountdown: 0 
    }));
  }, []);

  // Error handling
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Cleanup
  useEffect(() => {
    initialize();
    
    return () => {
      cameraService.cleanup();
    };
  }, [initialize]);

  return {
    // Refs
    cameraRef,
    
    // State
    settings,
    uiState,
    error,
    permissions,
    isReady: !!settings && !!permissions?.granted,
    
    // Actions
    initialize,
    requestPermissions,
    capturePhoto,
    processPhoto,
    captureAndProcess,
    updateSettings,
    toggleFlash,
    setZoom,
    setFocusPoint,
    startTimer,
    cancelTimer,
    clearError
  };
}

/**
 * Hook for gallery integration
 */
export function useCameraGallery() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<CameraError | null>(null);

  const saveToGallery = useCallback(async (photoUri: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await cameraService.saveToGallery(photoUri);
      Alert.alert('Success', 'Photo saved to gallery');
    } catch (err) {
      const cameraError = err as CameraError;
      setError(cameraError);
      Alert.alert('Error', cameraError.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const importFromGallery = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const photo = await cameraService.importFromGallery();
      return photo;
    } catch (err) {
      const cameraError = err as CameraError;
      setError(cameraError);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getGalleryItems = useCallback(async (limit: number = 20) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const items = await cameraService.getGalleryItems(limit);
      return items;
    } catch (err) {
      const cameraError = err as CameraError;
      setError(cameraError);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    saveToGallery,
    importFromGallery,
    getGalleryItems,
    clearError: useCallback(() => setError(null), [])
  };
}

/**
 * Hook for camera performance monitoring
 */
export function useCameraPerformance() {
  const [performance, setPerformance] = useState<CameraPerformance | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);

  const startMonitoring = useCallback(() => {
    setIsMonitoring(true);
    
    const updatePerformance = async () => {
      try {
        const metrics = await cameraService.getPerformanceMetrics();
        setPerformance(metrics);
      } catch (error) {
        console.warn('Failed to get performance metrics:', error);
      }
    };

    // Update performance metrics every 5 seconds
    const interval = setInterval(updatePerformance, 5000);
    updatePerformance(); // Initial update

    return () => {
      clearInterval(interval);
      setIsMonitoring(false);
    };
  }, []);

  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
  }, []);

  return {
    performance,
    isMonitoring,
    startMonitoring,
    stopMonitoring
  };
}

/**
 * Hook for AI-powered analysis overlay
 */
export function useAnalysisOverlay() {
  const [overlay, setOverlay] = useState<AnalysisOverlay>({
    isVisible: false,
    confidence: 0,
    detectedItems: [],
    suggestions: [],
    processingStage: 'idle' as ProcessingStage
  });

  const showOverlay = useCallback((stage: ProcessingStage = 'analyzing' as ProcessingStage) => {
    setOverlay(prev => ({
      ...prev,
      isVisible: true,
      processingStage: stage
    }));
  }, []);

  const hideOverlay = useCallback(() => {
    setOverlay(prev => ({
      ...prev,
      isVisible: false,
      processingStage: 'idle' as ProcessingStage
    }));
  }, []);

  const updateProgress = useCallback((confidence: number) => {
    setOverlay(prev => ({
      ...prev,
      confidence: Math.max(0, Math.min(100, confidence))
    }));
  }, []);

  const setStage = useCallback((stage: ProcessingStage) => {
    setOverlay(prev => ({ ...prev, processingStage: stage }));
  }, []);

  return {
    overlay,
    showOverlay,
    hideOverlay,
    updateProgress,
    setStage
  };
}
