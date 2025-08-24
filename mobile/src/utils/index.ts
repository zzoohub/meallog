import { Alert, Dimensions, Platform } from "react-native";
import * as Haptics from "expo-haptics";
import { VALIDATION_PATTERNS, HAPTIC_TYPES } from "../constants";
import { MealType } from "../types";

// Device utilities
export const getScreenDimensions = () => {
  const { width, height } = Dimensions.get("screen");
  return { width, height };
};

// Platform detection
export const isIOS = Platform.OS === "ios";
export const isAndroid = Platform.OS === "android";
export const isWeb = Platform.OS === "web";
export const isNative = Platform.OS !== "web";


// Date and time utilities
export const formatDate = (date: Date | string, locale = "en-US"): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(dateObj);
};

export const formatTime = (date: Date | string, locale = "en-US"): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(dateObj);
};

export const formatDateTime = (date: Date | string, locale = "en-US"): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(dateObj);
};

export const getRelativeTime = (date: Date | string, locale = "en-US"): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "just now";
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}m ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h ago`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}d ago`;
  } else {
    return formatDate(dateObj, locale);
  }
};

export const getCurrentMealType = (): MealType => {
  const hour = new Date().getHours();

  if (hour >= 6 && hour < 11) {
    return MealType.BREAKFAST;
  } else if (hour >= 11 && hour < 16) {
    return MealType.LUNCH;
  } else if (hour >= 16 && hour < 22) {
    return MealType.DINNER;
  } else {
    return MealType.SNACK;
  }
};

// String utilities
export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + "...";
};

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Validation utilities
export const validateEmail = (email: string): boolean => {
  return VALIDATION_PATTERNS.EMAIL.test(email.trim().toLowerCase());
};

export const validateUsername = (username: string): boolean => {
  return VALIDATION_PATTERNS.USERNAME.test(username.trim());
};

export const validatePassword = (password: string): boolean => {
  return VALIDATION_PATTERNS.PASSWORD.test(password);
};

export const getPasswordStrength = (password: string): "weak" | "medium" | "strong" => {
  if (password.length < 6) return "weak";
  if (password.length < 10 && !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) return "weak";
  if (password.length >= 10 && /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) return "strong";
  return "medium";
};

// Number utilities
export const formatNumber = (num: number, locale = "en-US"): string => {
  return new Intl.NumberFormat(locale).format(num);
};

export const formatCalories = (calories: number): string => {
  return `${Math.round(calories)} cal`;
};

export const formatWeight = (weight: number, unit: "kg" | "lbs" = "kg"): string => {
  return `${weight.toFixed(1)} ${unit}`;
};

export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

// Array utilities
export const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = shuffled[i]!;
    shuffled[i] = shuffled[j]!;
    shuffled[j] = temp;
  }
  return shuffled;
};

export const groupBy = <T, K extends keyof T>(array: T[], key: K): Record<string, T[]> => {
  return array.reduce((groups, item) => {
    const groupKey = String(item[key]);
    groups[groupKey] = groups[groupKey] || [];
    groups[groupKey].push(item);
    return groups;
  }, {} as Record<string, T[]>);
};

// Image utilities
export const getImageAspectRatio = async (uri: string): Promise<number> => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      resolve(image.width / image.height);
    };
    image.onerror = reject;
    image.src = uri;
  });
};

export const compressImageUri = (uri: string, quality = 0.8): Promise<string> => {
  // This would typically use a library like expo-image-manipulator
  // For now, return the original URI
  return Promise.resolve(uri);
};

// Haptic feedback utilities
export const triggerHaptic = (type: keyof typeof HAPTIC_TYPES = "MEDIUM") => {
  if (Platform.OS !== "ios") return; // Haptics are iOS-specific

  try {
    switch (type) {
      case "LIGHT":
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case "MEDIUM":
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case "HEAVY":
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      case "SUCCESS":
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case "WARNING":
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      case "ERROR":
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
    }
  } catch (error) {
    console.warn("Haptic feedback failed:", error);
  }
};

// Alert utilities
export const showAlert = (
  title: string,
  message?: string,
  buttons?: {
    text: string;
    style?: "default" | "cancel" | "destructive";
    onPress?: () => void;
  }[],
) => {
  Alert.alert(title, message, buttons || [{ text: "OK" }]);
};

export const showConfirmAlert = (title: string, message: string, onConfirm: () => void, onCancel?: () => void) => {
  Alert.alert(title, message, [
    {
      text: "Cancel",
      style: "cancel",
      onPress: onCancel,
    },
    {
      text: "OK",
      onPress: onConfirm,
    },
  ]);
};

// Debounce utility
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number,
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// Throttle utility
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number,
): ((...args: Parameters<T>) => void) => {
  let lastCall = 0;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
};

// Sleep utility for delays
export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// URL utilities
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Storage size utilities
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};
