import type { FlashMode } from 'expo-camera';
import type { PhotoProcessingResult } from '@/domains/meals/types';

// Camera configuration and settings
export interface CameraSettings {
  flashMode: FlashMode;
  quality: PhotoQuality;
  facing: CameraFacing;
  autoFocus: boolean;
  whiteBalance: WhiteBalance;
  exposure: number;
  zoom: number;
  gridLines: boolean;
  timerDelay: TimerDelay;
  soundEnabled: boolean;
}

export enum PhotoQuality {
  LOW = 0.3,
  MEDIUM = 0.5,
  HIGH = 0.8,
  MAX = 1.0
}

export enum CameraFacing {
  FRONT = 'front',
  BACK = 'back'
}

export enum WhiteBalance {
  AUTO = 'auto',
  SUNNY = 'sunny',
  CLOUDY = 'cloudy',
  SHADOW = 'shadow',
  INCANDESCENT = 'incandescent',
  FLUORESCENT = 'fluorescent'
}

export enum TimerDelay {
  OFF = 0,
  THREE_SECONDS = 3,
  TEN_SECONDS = 10
}

// Photo capture and processing
export interface PhotoCapture {
  uri: string;
  width: number;
  height: number;
  base64?: string;
  exif?: ExifData;
  timestamp: Date;
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
}

export interface ExifData {
  DateTime?: string;
  Orientation?: number;
  ColorSpace?: number;
  PixelXDimension?: number;
  PixelYDimension?: number;
  WhiteBalance?: number;
  Flash?: number;
  FocalLength?: number;
  ISO?: number;
  ExposureTime?: number;
  FNumber?: number;
  GPSLatitude?: number;
  GPSLongitude?: number;
}

// Camera permissions and status
export interface CameraPermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  status: PermissionStatus;
}

export enum PermissionStatus {
  UNDETERMINED = 'undetermined',
  GRANTED = 'granted',
  DENIED = 'denied'
}

// Camera UI state and controls
export interface CameraUIState {
  isCapturing: boolean;
  isProcessing: boolean;
  processingProgress: number;
  showGrid: boolean;
  showFocusArea: boolean;
  focusPoint: { x: number; y: number } | null;
  zoomLevel: number;
  maxZoom: number;
  isTimerActive: boolean;
  timerCountdown: number;
  flashAnimation: boolean;
}

// Analysis overlay and AI features
export interface AnalysisOverlay {
  isVisible: boolean;
  confidence: number;
  detectedItems: DetectedItem[];
  suggestions: AnalysisSuggestion[];
  processingStage: ProcessingStage;
}

export interface DetectedItem {
  id: string;
  name: string;
  confidence: number;
  boundingBox: BoundingBox;
  category: ItemCategory;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export enum ItemCategory {
  FOOD = 'food',
  DRINK = 'drink',
  UTENSIL = 'utensil',
  PLATE = 'plate',
  OTHER = 'other'
}

export interface AnalysisSuggestion {
  type: SuggestionType;
  message: string;
  icon?: string;
  action?: () => void;
}

export enum SuggestionType {
  LIGHTING = 'lighting',
  ANGLE = 'angle',
  DISTANCE = 'distance',
  FOCUS = 'focus',
  COMPOSITION = 'composition'
}

export enum ProcessingStage {
  IDLE = 'idle',
  CAPTURING = 'capturing',
  ANALYZING = 'analyzing',
  PROCESSING = 'processing',
  COMPLETE = 'complete',
  ERROR = 'error'
}

// Gallery and photo management
export interface GalleryItem {
  id: string;
  uri: string;
  thumbnail: string;
  timestamp: Date;
  processed: boolean;
  mealId?: string;
  metadata: PhotoMetadata;
}

export interface PhotoMetadata {
  size: number;
  dimensions: { width: number; height: number };
  format: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  cameraSettings: Partial<CameraSettings>;
  processingResult?: PhotoProcessingResult;
}

// Camera effects and filters
export interface CameraFilter {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  settings: FilterSettings;
}

export interface FilterSettings {
  brightness: number;
  contrast: number;
  saturation: number;
  hue: number;
  sharpness: number;
  vignette: number;
  temperature: number;
}

// Tutorial and guidance
export interface CameraTutorial {
  id: string;
  title: string;
  description: string;
  steps: TutorialStep[];
  difficulty: TutorialDifficulty;
  category: TutorialCategory;
}

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  image?: string;
  video?: string;
  duration: number;
}

export enum TutorialDifficulty {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced'
}

export enum TutorialCategory {
  BASICS = 'basics',
  LIGHTING = 'lighting',
  COMPOSITION = 'composition',
  FOOD_PHOTOGRAPHY = 'food_photography',
  TROUBLESHOOTING = 'troubleshooting'
}

// Performance and analytics
export interface CameraPerformance {
  captureTime: number;
  processingTime: number;
  analysisTime: number;
  memoryUsage: number;
  batteryImpact: BatteryImpact;
  thermalState: ThermalState;
}

export enum BatteryImpact {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

export enum ThermalState {
  NOMINAL = 'nominal',
  FAIR = 'fair',
  SERIOUS = 'serious',
  CRITICAL = 'critical'
}

// Error handling
export interface CameraError {
  code: CameraErrorCode;
  message: string;
  details?: Record<string, any>;
  suggestion?: string;
  recoverable: boolean;
}

export enum CameraErrorCode {
  PERMISSION_DENIED = 'permission_denied',
  CAMERA_UNAVAILABLE = 'camera_unavailable',
  CAPTURE_FAILED = 'capture_failed',
  PROCESSING_FAILED = 'processing_failed',
  STORAGE_FULL = 'storage_full',
  THERMAL_SHUTDOWN = 'thermal_shutdown',
  MEMORY_ERROR = 'memory_error',
  UNKNOWN_ERROR = 'unknown_error'
}

// Accessibility and user experience
export interface AccessibilityOptions {
  voiceGuidance: boolean;
  largeButtons: boolean;
  highContrast: boolean;
  reduceMotion: boolean;
  autoCapture: boolean;
  captureSound: boolean;
}

// Integration with other domains
export interface CameraMealIntegration {
  autoNavigateToMealDetail: boolean;
  saveOriginalPhoto: boolean;
  enableSmartCrop: boolean;
  autoDetectMealType: boolean;
  suggestIngredients: boolean;
}

// Camera session management
export interface CameraSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  photosCapture: number;
  successfulCaptures: number;
  failedCaptures: number;
  totalProcessingTime: number;
  performance: CameraPerformance;
  settings: CameraSettings;
}

// Batch operations
export interface BatchProcessingOptions {
  quality: PhotoQuality;
  maxConcurrent: number;
  retryFailures: boolean;
  progressCallback?: (progress: number) => void;
}

export interface BatchProcessingResult {
  total: number;
  successful: number;
  failed: number;
  results: Array<{
    uri: string;
    success: boolean;
    result?: PhotoProcessingResult;
    error?: CameraError;
  }>;
}
