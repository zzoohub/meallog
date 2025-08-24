import * as Camera from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as Location from 'expo-location';
import * as Battery from 'expo-battery';
import * as Device from 'expo-device';
import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  CameraSettings,
  PhotoCapture,
  CameraPermissionStatus,
  CameraUIState,
  CameraError,
  CameraErrorCode,
  PhotoQuality,
  CameraFacing,
  WhiteBalance,
  TimerDelay,
  GalleryItem,
  PhotoMetadata,
  CameraSession,
  BatchProcessingOptions,
  BatchProcessingResult,
  CameraPerformance,
  BatteryImpact,
  ThermalState
} from '../types';
import { mealProcessingService } from '@/domains/meals/services/mealProcessingService';

class CameraService {
  private currentSession: CameraSession | null = null;
  private readonly STORAGE_KEY = '@camera_settings';
  private readonly SESSION_STORAGE_KEY = '@camera_sessions';
  
  private readonly defaultSettings: CameraSettings = {
    flashMode: 'off',
    quality: PhotoQuality.HIGH,
    facing: CameraFacing.BACK,
    autoFocus: true,
    whiteBalance: WhiteBalance.AUTO,
    exposure: 0,
    zoom: 0,
    gridLines: true,
    timerDelay: TimerDelay.OFF,
    soundEnabled: true
  };

  // Initialize camera service
  async initialize(): Promise<void> {
    try {
      // Load saved settings
      await this.loadSettings();
      
      // Check device capabilities
      await this.checkDeviceCapabilities();
      
      // Start new session
      this.startSession();
    } catch (error) {
      throw this.createCameraError(
        'UNKNOWN_ERROR',
        'Failed to initialize camera service',
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  // Permission management
  async requestCameraPermissions(): Promise<CameraPermissionStatus> {
    try {
      const { status, canAskAgain } = await Camera.requestCameraPermissionsAsync();
      
      return {
        granted: status === 'granted',
        canAskAgain,
        status: status as any
      };
    } catch (error) {
      throw this.createCameraError(
        'PERMISSION_DENIED',
        'Failed to request camera permissions',
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  async requestMediaLibraryPermissions(): Promise<CameraPermissionStatus> {
    try {
      const { status, canAskAgain } = await MediaLibrary.requestPermissionsAsync();
      
      return {
        granted: status === 'granted',
        canAskAgain,
        status: status as any
      };
    } catch (error) {
      throw this.createCameraError(
        'PERMISSION_DENIED',
        'Failed to request media library permissions',
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  async getCameraPermissionStatus(): Promise<CameraPermissionStatus> {
    try {
      const { status, canAskAgain } = await Camera.getCameraPermissionsAsync();
      
      return {
        granted: status === 'granted',
        canAskAgain,
        status: status as any
      };
    } catch (error) {
      return {
        granted: false,
        canAskAgain: true,
        status: 'undetermined' as any
      };
    }
  }

  // Photo capture
  async capturePhoto(
    cameraRef: Camera.CameraView,
    settings: Partial<CameraSettings> = {}
  ): Promise<PhotoCapture> {
    const startTime = Date.now();
    
    try {
      // Check device thermal state
      await this.checkThermalState();
      
      // Check available storage
      await this.checkStorageSpace();
      
      const finalSettings = { ...this.defaultSettings, ...settings };
      
      // Get location if permission granted
      const location = await this.getCurrentLocation();
      
      // Capture photo
      const result = await cameraRef.takePictureAsync({
        quality: finalSettings.quality,
        base64: false,
        exif: true,
        skipProcessing: false
      });

      if (!result || !result.uri) {
        throw this.createCameraError(
          'CAPTURE_FAILED',
          'Camera failed to capture photo'
        );
      }

      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(result.uri);
      
      const photoCapture: PhotoCapture = {
        uri: result.uri,
        width: result.width || 0,
        height: result.height || 0,
        base64: result.base64,
        exif: result.exif,
        timestamp: new Date(),
        location
      };

      // Update session statistics
      if (this.currentSession) {
        this.currentSession.photosCapture++;
        this.currentSession.successfulCaptures++;
        this.currentSession.totalProcessingTime += Date.now() - startTime;
      }

      return photoCapture;
    } catch (error) {
      // Update session statistics
      if (this.currentSession) {
        this.currentSession.failedCaptures++;
      }
      
      if (error instanceof Error && error.message.includes('thermal')) {
        throw this.createCameraError(
          'THERMAL_SHUTDOWN',
          'Device is overheating. Please let it cool down.',
          undefined,
          'Wait a few minutes before taking more photos'
        );
      }
      
      throw error instanceof Error ? error : this.createCameraError(
        'CAPTURE_FAILED',
        'Failed to capture photo'
      );
    }
  }

  // Batch photo processing
  async processBatchPhotos(
    photoUris: string[],
    options: BatchProcessingOptions = {
      quality: PhotoQuality.HIGH,
      maxConcurrent: 3,
      retryFailures: true
    }
  ): Promise<BatchProcessingResult> {
    const results: BatchProcessingResult['results'] = [];
    const concurrentLimit = Math.min(options.maxConcurrent, photoUris.length);
    
    let processed = 0;
    let successful = 0;
    let failed = 0;

    const processPhoto = async (uri: string) => {
      try {
        const result = await mealProcessingService.processPhoto(uri, {
          quality: options.quality,
          maxWidth: 1024,
          maxHeight: 1024,
          format: 'jpeg',
          preserveExif: false
        });
        
        successful++;
        results.push({ uri, success: true, result });
      } catch (error) {
        failed++;
        results.push({ 
          uri, 
          success: false, 
          error: error as CameraError 
        });
        
        // Retry if enabled
        if (options.retryFailures) {
          try {
            const retryResult = await mealProcessingService.processPhoto(uri);
            successful++;
            failed--;
            results[results.length - 1] = { uri, success: true, result: retryResult };
          } catch (retryError) {
            // Keep the failed result
          }
        }
      } finally {
        processed++;
        options.progressCallback?.(processed / photoUris.length * 100);
      }
    };

    // Process photos in batches
    const batches = [];
    for (let i = 0; i < photoUris.length; i += concurrentLimit) {
      batches.push(photoUris.slice(i, i + concurrentLimit));
    }

    for (const batch of batches) {
      await Promise.all(batch.map(processPhoto));
    }

    return {
      total: photoUris.length,
      successful,
      failed,
      results
    };
  }

  // Gallery management
  async saveToGallery(photoUri: string): Promise<void> {
    try {
      const permission = await this.requestMediaLibraryPermissions();
      if (!permission.granted) {
        throw this.createCameraError(
          'PERMISSION_DENIED',
          'Media library permission required to save photos'
        );
      }

      await MediaLibrary.saveToLibraryAsync(photoUri);
    } catch (error) {
      throw this.createCameraError(
        'UNKNOWN_ERROR',
        'Failed to save photo to gallery',
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  async getGalleryItems(limit: number = 20): Promise<GalleryItem[]> {
    try {
      const permission = await MediaLibrary.getPermissionsAsync();
      if (!permission.granted) {
        return [];
      }

      const album = await MediaLibrary.getAlbumAsync('Camera');
      if (!album) return [];

      const media = await MediaLibrary.getAssetsAsync({
        album,
        mediaType: 'photo',
        sortBy: ['creationTime'],
        first: limit
      });

      return Promise.all(
        media.assets.map(async (asset) => {
          const info = await MediaLibrary.getAssetInfoAsync(asset);
          
          return {
            id: asset.id,
            uri: asset.uri,
            thumbnail: asset.uri, // For simplicity, using same URI
            timestamp: new Date(asset.creationTime),
            processed: false,
            metadata: {
              size: info.localUri ? (await FileSystem.getInfoAsync(info.localUri)).size || 0 : 0,
              dimensions: { width: asset.width, height: asset.height },
              format: asset.filename?.split('.').pop() || 'jpg',
              location: info.location ? {
                latitude: info.location.latitude,
                longitude: info.location.longitude
              } : undefined,
              cameraSettings: {}
            }
          } as GalleryItem;
        })
      );
    } catch (error) {
      console.warn('Failed to get gallery items:', error);
      return [];
    }
  }

  // Import photo from gallery
  async importFromGallery(): Promise<PhotoCapture | null> {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        exif: true
      });

      if (result.canceled) {
        return null;
      }

      const asset = result.assets[0];
      if (!asset) return null;

      return {
        uri: asset.uri,
        width: asset.width || 0,
        height: asset.height || 0,
        exif: asset.exif,
        timestamp: new Date()
      };
    } catch (error) {
      throw this.createCameraError(
        'UNKNOWN_ERROR',
        'Failed to import photo from gallery',
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  // Settings management
  async saveSettings(settings: Partial<CameraSettings>): Promise<void> {
    try {
      const currentSettings = await this.loadSettings();
      const updatedSettings = { ...currentSettings, ...settings };
      
      await AsyncStorage.setItem(
        this.STORAGE_KEY,
        JSON.stringify(updatedSettings)
      );
    } catch (error) {
      console.warn('Failed to save camera settings:', error);
    }
  }

  async loadSettings(): Promise<CameraSettings> {
    try {
      const settingsJson = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (settingsJson) {
        const settings = JSON.parse(settingsJson);
        return { ...this.defaultSettings, ...settings };
      }
    } catch (error) {
      console.warn('Failed to load camera settings:', error);
    }
    return this.defaultSettings;
  }

  // Session management
  private startSession(): void {
    this.currentSession = {
      id: `session_${Date.now()}`,
      startTime: new Date(),
      photosCapture: 0,
      successfulCaptures: 0,
      failedCaptures: 0,
      totalProcessingTime: 0,
      performance: {
        captureTime: 0,
        processingTime: 0,
        analysisTime: 0,
        memoryUsage: 0,
        batteryImpact: BatteryImpact.LOW,
        thermalState: ThermalState.NOMINAL
      },
      settings: this.defaultSettings
    };
  }

  async endSession(): Promise<void> {
    if (this.currentSession) {
      this.currentSession.endTime = new Date();
      
      try {
        // Save session data
        const sessions = await this.getSessions();
        sessions.push(this.currentSession);
        
        // Keep only last 50 sessions
        const recentSessions = sessions.slice(-50);
        
        await AsyncStorage.setItem(
          this.SESSION_STORAGE_KEY,
          JSON.stringify(recentSessions)
        );
      } catch (error) {
        console.warn('Failed to save session data:', error);
      }
      
      this.currentSession = null;
    }
  }

  async getSessions(): Promise<CameraSession[]> {
    try {
      const sessionsJson = await AsyncStorage.getItem(this.SESSION_STORAGE_KEY);
      if (sessionsJson) {
        const sessions = JSON.parse(sessionsJson);
        return sessions.map((session: any) => ({
          ...session,
          startTime: new Date(session.startTime),
          endTime: session.endTime ? new Date(session.endTime) : undefined
        }));
      }
    } catch (error) {
      console.warn('Failed to load session data:', error);
    }
    return [];
  }

  getCurrentSession(): CameraSession | null {
    return this.currentSession;
  }

  // Device capabilities and health checks
  private async checkDeviceCapabilities(): Promise<void> {
    // Check if device has camera
    if (!Device.hasCameraAsync()) {
      throw this.createCameraError(
        'CAMERA_UNAVAILABLE',
        'Device does not have a camera'
      );
    }

    // Check available cameras
    const availableCameras = await Camera.getAvailableCameraTypesAsync();
    if (availableCameras.length === 0) {
      throw this.createCameraError(
        'CAMERA_UNAVAILABLE',
        'No cameras available on this device'
      );
    }
  }

  private async checkStorageSpace(): Promise<void> {
    try {
      const info = await FileSystem.getFreeDiskStorageAsync();
      const freeSpaceMB = info / (1024 * 1024);
      
      if (freeSpaceMB < 100) { // Less than 100MB
        throw this.createCameraError(
          'STORAGE_FULL',
          'Insufficient storage space',
          { freeSpaceMB },
          'Please free up some storage space'
        );
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('STORAGE_FULL')) {
        throw error;
      }
      // Ignore other storage check errors
    }
  }

  private async checkThermalState(): Promise<void> {
    try {
      if (Platform.OS === 'ios') {
        // On iOS, we can't directly check thermal state
        // but we can monitor battery level and charging state
        const batteryLevel = await Battery.getBatteryLevelAsync();
        const batteryState = await Battery.getBatteryStateAsync();
        
        if (batteryLevel < 0.1 && batteryState !== Battery.BatteryState.CHARGING) {
          throw this.createCameraError(
            'THERMAL_SHUTDOWN',
            'Battery too low for camera usage'
          );
        }
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('THERMAL')) {
        throw error;
      }
      // Ignore thermal check errors on unsupported devices
    }
  }

  private async getCurrentLocation(): Promise<{ latitude: number; longitude: number; accuracy?: number } | undefined> {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        return undefined;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced
      });
      
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy || undefined
      };
    } catch (error) {
      // Ignore location errors
      return undefined;
    }
  }

  // Performance monitoring
  async getPerformanceMetrics(): Promise<CameraPerformance> {
    try {
      const batteryLevel = await Battery.getBatteryLevelAsync();
      
      // Simplified performance metrics
      return {
        captureTime: this.currentSession?.totalProcessingTime || 0,
        processingTime: 0,
        analysisTime: 0,
        memoryUsage: 0,
        batteryImpact: batteryLevel < 0.2 ? BatteryImpact.HIGH : 
                       batteryLevel < 0.5 ? BatteryImpact.MEDIUM : BatteryImpact.LOW,
        thermalState: ThermalState.NOMINAL
      };
    } catch (error) {
      return {
        captureTime: 0,
        processingTime: 0,
        analysisTime: 0,
        memoryUsage: 0,
        batteryImpact: BatteryImpact.LOW,
        thermalState: ThermalState.NOMINAL
      };
    }
  }

  // Cleanup and utility methods
  async cleanup(): Promise<void> {
    await this.endSession();
  }

  private createCameraError(
    code: CameraErrorCode,
    message: string,
    details?: Record<string, any>,
    suggestion?: string
  ): CameraError {
    return {
      code,
      message,
      details,
      suggestion,
      recoverable: code !== 'THERMAL_SHUTDOWN' && code !== 'CAMERA_UNAVAILABLE'
    };
  }

  // Utility methods for UI state management
  createInitialUIState(): CameraUIState {
    return {
      isCapturing: false,
      isProcessing: false,
      processingProgress: 0,
      showGrid: true,
      showFocusArea: false,
      focusPoint: null,
      zoomLevel: 0,
      maxZoom: 1,
      isTimerActive: false,
      timerCountdown: 0,
      flashAnimation: false
    };
  }
}

export const cameraService = new CameraService();
