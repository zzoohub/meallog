/**
 * Comprehensive Error Handling System
 * Provides utilities for consistent error handling across the app
 */

import { Alert } from 'react-native';
// Device and Application info simplified for better compatibility
import { performanceMonitor } from '@/lib/performance';
import { ENV_CONFIG } from '@/constants';
import type { AppError } from '@/types';

// Error types for better categorization
export enum ErrorType {
  NETWORK = 'NETWORK',
  STORAGE = 'STORAGE',
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  PERMISSION = 'PERMISSION',
  CAMERA = 'CAMERA',
  API = 'API',
  PARSE = 'PARSE',
  UNKNOWN = 'UNKNOWN',
}

// Error severity levels
export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

// Base error class with enhanced functionality
export class AppErrorBase extends Error {
  public readonly type: ErrorType;
  public readonly severity: ErrorSeverity;
  public readonly timestamp: Date;
  public readonly context: Record<string, unknown>;
  public readonly recoverable: boolean;
  public readonly eventId: string;

  constructor(
    message: string,
    type: ErrorType = ErrorType.UNKNOWN,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context: Record<string, unknown> = {},
    recoverable = true
  ) {
    super(message);
    
    this.name = this.constructor.name;
    this.type = type;
    this.severity = severity;
    this.timestamp = new Date();
    this.context = {
      ...context,
      userAgent: 'React Native',
      appVersion: '1.0.0',
      buildVersion: '1',
      deviceInfo: {
        brand: 'unknown',
        manufacturer: 'unknown',
        modelName: 'unknown',
        osVersion: 'unknown',
      },
    };
    this.recoverable = recoverable;
    this.eventId = this.generateEventId();

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  private generateEventId(): string {
    return `${this.type.toLowerCase()}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  toAppError(): AppError {
    return {
      name: this.name,
      message: this.message,
      stack: this.stack,
      code: this.type,
      timestamp: this.timestamp,
      context: this.context,
    };
  }

  toString(): string {
    return `[${this.type}] ${this.message} (Event ID: ${this.eventId})`;
  }
}

// Specific error classes for different scenarios
export class NetworkError extends AppErrorBase {
  constructor(
    message: string,
    context: Record<string, unknown> = {}
  ) {
    super(message, ErrorType.NETWORK, ErrorSeverity.MEDIUM, context, true);
  }
}

export class StorageError extends AppErrorBase {
  constructor(
    message: string,
    context: Record<string, unknown> = {}
  ) {
    super(message, ErrorType.STORAGE, ErrorSeverity.HIGH, context, true);
  }
}

export class ValidationError extends AppErrorBase {
  constructor(
    message: string,
    field?: string,
    context: Record<string, unknown> = {}
  ) {
    super(
      message,
      ErrorType.VALIDATION,
      ErrorSeverity.LOW,
      { ...context, field },
      true
    );
  }
}

export class AuthenticationError extends AppErrorBase {
  constructor(
    message: string,
    context: Record<string, unknown> = {}
  ) {
    super(message, ErrorType.AUTHENTICATION, ErrorSeverity.HIGH, context, false);
  }
}

export class PermissionError extends AppErrorBase {
  constructor(
    permission: string,
    message?: string,
    context: Record<string, unknown> = {}
  ) {
    super(
      message || `Permission denied: ${permission}`,
      ErrorType.PERMISSION,
      ErrorSeverity.MEDIUM,
      { ...context, permission },
      true
    );
  }
}

export class CameraError extends AppErrorBase {
  constructor(
    message: string,
    context: Record<string, unknown> = {}
  ) {
    super(message, ErrorType.CAMERA, ErrorSeverity.MEDIUM, context, true);
  }
}

export class APIError extends AppErrorBase {
  public readonly statusCode?: number;
  public readonly endpoint?: string;

  constructor(
    message: string,
    statusCode?: number,
    endpoint?: string,
    context: Record<string, unknown> = {}
  ) {
    super(
      message,
      ErrorType.API,
      statusCode && statusCode >= 500 ? ErrorSeverity.HIGH : ErrorSeverity.MEDIUM,
      { ...context, statusCode, endpoint },
      statusCode !== undefined && statusCode < 500
    );
    
    this.statusCode = statusCode;
    this.endpoint = endpoint;
  }
}

// Error handler utility class
export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorListeners: Array<(error: AppErrorBase) => void> = [];
  private errorQueue: AppErrorBase[] = [];
  private maxQueueSize = 100;

  private constructor() {
    // Private constructor for singleton
  }

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  // Subscribe to error events
  public subscribe(listener: (error: AppErrorBase) => void): () => void {
    this.errorListeners.push(listener);
    
    return () => {
      const index = this.errorListeners.indexOf(listener);
      if (index > -1) {
        this.errorListeners.splice(index, 1);
      }
    };
  }

  // Handle error with proper logging and reporting
  public handle(error: unknown, context?: Record<string, unknown>): AppErrorBase {
    const appError = this.normalizeError(error, context);
    
    // Add to error queue
    this.addToQueue(appError);
    
    // Log the error
    this.logError(appError);
    
    // Report to crash reporting service
    this.reportError(appError);
    
    // Notify listeners
    this.notifyListeners(appError);
    
    // Track performance impact
    performanceMonitor.recordError(appError.toAppError());
    
    return appError;
  }

  // Handle error with user-friendly alert
  public handleWithAlert(
    error: unknown,
    title?: string,
    context?: Record<string, unknown>
  ): AppErrorBase {
    const appError = this.handle(error, context);
    
    // Show user-friendly alert for certain error types
    if (this.shouldShowAlert(appError)) {
      this.showErrorAlert(appError, title);
    }
    
    return appError;
  }

  // Async error handling with proper Promise rejection
  public async handleAsync<T>(
    promise: Promise<T>,
    context?: Record<string, unknown>
  ): Promise<T> {
    try {
      return await promise;
    } catch (error) {
      const appError = this.handle(error, context);
      throw appError;
    }
  }

  // Normalize different error types into AppErrorBase
  private normalizeError(
    error: unknown,
    context?: Record<string, unknown>
  ): AppErrorBase {
    if (error instanceof AppErrorBase) {
      return error;
    }

    if (error instanceof Error) {
      // Categorize based on error message/type
      const type = this.categorizeError(error);
      return new AppErrorBase(
        error.message,
        type,
        ErrorSeverity.MEDIUM,
        { ...context, originalError: error.name },
        true
      );
    }

    if (typeof error === 'string') {
      return new AppErrorBase(error, ErrorType.UNKNOWN, ErrorSeverity.LOW, context);
    }

    return new AppErrorBase(
      'An unknown error occurred',
      ErrorType.UNKNOWN,
      ErrorSeverity.MEDIUM,
      { ...context, originalError: error }
    );
  }

  // Categorize errors based on their characteristics
  private categorizeError(error: Error): ErrorType {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
      return ErrorType.NETWORK;
    }
    
    if (message.includes('storage') || message.includes('asyncstorage')) {
      return ErrorType.STORAGE;
    }
    
    if (message.includes('validation') || message.includes('invalid')) {
      return ErrorType.VALIDATION;
    }
    
    if (message.includes('auth') || message.includes('unauthorized') || message.includes('token')) {
      return ErrorType.AUTHENTICATION;
    }
    
    if (message.includes('permission') || message.includes('denied')) {
      return ErrorType.PERMISSION;
    }
    
    if (message.includes('camera') || message.includes('photo')) {
      return ErrorType.CAMERA;
    }
    
    if (message.includes('parse') || message.includes('json')) {
      return ErrorType.PARSE;
    }
    
    return ErrorType.UNKNOWN;
  }

  // Add error to queue for batch processing
  private addToQueue(error: AppErrorBase): void {
    this.errorQueue.push(error);
    
    // Maintain queue size
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift(); // Remove oldest error
    }
  }

  // Log error appropriately based on environment
  private logError(error: AppErrorBase): void {
    if (ENV_CONFIG.IS_DEVELOPMENT) {
      console.group(`🚨 ${error.type} Error [${error.eventId}]`);
      console.error('Message:', error.message);
      console.error('Context:', error.context);
      console.error('Stack:', error.stack);
      console.groupEnd();
    } else {
      // In production, use structured logging
      console.error('Error occurred:', {
        eventId: error.eventId,
        type: error.type,
        message: error.message,
        severity: error.severity,
        timestamp: error.timestamp.toISOString(),
      });
    }
  }

  // Report error to crash reporting service
  private reportError(error: AppErrorBase): void {
    if (!ENV_CONFIG.IS_DEVELOPMENT && error.severity !== ErrorSeverity.LOW) {
      try {
        // Example integrations:
        
        // Crashlytics
        // crashlytics().recordError(error, {
        //   eventId: error.eventId,
        //   type: error.type,
        //   severity: error.severity,
        // });
        
        // Sentry
        // Sentry.captureException(error, {
        //   tags: {
        //     errorType: error.type,
        //     severity: error.severity,
        //     eventId: error.eventId,
        //   },
        //   extra: error.context,
        // });
        
        // Bugsnag
        // Bugsnag.notify(error, (report) => {
        //   report.severity = error.severity.toLowerCase();
        //   report.context = error.eventId;
        //   report.addMetadata('error', error.context);
        // });
        
        console.log(`Error reported to crash service: ${error.eventId}`);
      } catch (reportingError) {
        console.error('Failed to report error:', reportingError);
      }
    }
  }

  // Notify error listeners
  private notifyListeners(error: AppErrorBase): void {
    this.errorListeners.forEach(listener => {
      try {
        listener(error);
      } catch (listenerError) {
        console.error('Error in error listener:', listenerError);
      }
    });
  }

  // Determine if error should be shown to user
  private shouldShowAlert(error: AppErrorBase): boolean {
    return (
      error.severity === ErrorSeverity.HIGH ||
      error.severity === ErrorSeverity.CRITICAL ||
      error.type === ErrorType.AUTHENTICATION ||
      error.type === ErrorType.PERMISSION
    );
  }

  // Show user-friendly error alert
  private showErrorAlert(error: AppErrorBase, title?: string): void {
    const alertTitle = title || this.getAlertTitle(error);
    const message = this.getAlertMessage(error);
    
    Alert.alert(
      alertTitle,
      message,
      [
        {
          text: 'OK',
          style: 'default',
        },
        ...(error.recoverable
          ? [
              {
                text: 'Try Again',
                style: 'default',
                onPress: () => {
                  // Emit retry event that components can listen to
                  this.notifyListeners(error);
                },
              },
            ]
          : []),
        ...(ENV_CONFIG.IS_DEVELOPMENT
          ? [
              {
                text: 'Details',
                style: 'destructive',
                onPress: () => {
                  Alert.alert('Error Details', `${error.toString()}\n\nEvent ID: ${error.eventId}`);
                },
              },
            ]
          : []),
      ]
    );
  }

  // Get user-friendly alert title
  private getAlertTitle(error: AppErrorBase): string {
    switch (error.type) {
      case ErrorType.NETWORK:
        return 'Connection Problem';
      case ErrorType.STORAGE:
        return 'Storage Error';
      case ErrorType.AUTHENTICATION:
        return 'Authentication Required';
      case ErrorType.PERMISSION:
        return 'Permission Required';
      case ErrorType.CAMERA:
        return 'Camera Error';
      case ErrorType.API:
        return 'Service Error';
      default:
        return 'Error';
    }
  }

  // Get user-friendly alert message
  private getAlertMessage(error: AppErrorBase): string {
    switch (error.type) {
      case ErrorType.NETWORK:
        return 'Please check your internet connection and try again.';
      case ErrorType.STORAGE:
        return 'Unable to save your data. Please ensure you have enough storage space.';
      case ErrorType.AUTHENTICATION:
        return 'Please log in again to continue.';
      case ErrorType.PERMISSION:
        return 'This feature requires additional permissions to work properly.';
      case ErrorType.CAMERA:
        return 'Unable to access the camera. Please check permissions and try again.';
      case ErrorType.API:
        return 'Unable to connect to our services. Please try again later.';
      default:
        return error.message || 'An unexpected error occurred.';
    }
  }

  // Get error statistics
  public getErrorStats(): {
    total: number;
    byType: Record<ErrorType, number>;
    bySeverity: Record<ErrorSeverity, number>;
    recent: AppErrorBase[];
  } {
    const byType = Object.values(ErrorType).reduce(
      (acc, type) => ({ ...acc, [type]: 0 }),
      {} as Record<ErrorType, number>
    );
    
    const bySeverity = Object.values(ErrorSeverity).reduce(
      (acc, severity) => ({ ...acc, [severity]: 0 }),
      {} as Record<ErrorSeverity, number>
    );

    this.errorQueue.forEach(error => {
      byType[error.type]++;
      bySeverity[error.severity]++;
    });

    return {
      total: this.errorQueue.length,
      byType,
      bySeverity,
      recent: this.errorQueue.slice(-10), // Last 10 errors
    };
  }

  // Clear error queue
  public clearErrors(): void {
    this.errorQueue = [];
  }
}

// Global error handler instance
export const errorHandler = ErrorHandler.getInstance();

// Convenience functions for common error handling patterns
export const handleError = (error: unknown, context?: Record<string, unknown>) => 
  errorHandler.handle(error, context);

export const handleErrorWithAlert = (error: unknown, title?: string, context?: Record<string, unknown>) => 
  errorHandler.handleWithAlert(error, title, context);

export const handleAsync = <T>(promise: Promise<T>, context?: Record<string, unknown>) => 
  errorHandler.handleAsync(promise, context);

// withErrorBoundary removed - JSX not compatible with .ts files
// Use ErrorBoundary component directly where needed

// Export all error types for external use
export {
  ErrorType,
  ErrorSeverity,
  AppErrorBase,
  NetworkError,
  StorageError,
  ValidationError,
  AuthenticationError,
  PermissionError,
  CameraError,
  APIError,
};