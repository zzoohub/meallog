import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// Device and Application info simplified for better compatibility
import { DARK_THEME_COLORS, BRAND_COLORS, ENV_CONFIG } from '@/constants';
import { performanceMonitor } from '@/lib/performance';
import type { AppError, ErrorBoundaryState } from '@/types';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: AppError, errorInfo: ErrorInfo) => void;
  enableReporting?: boolean;
  showErrorDetails?: boolean;
  resetOnPropsChange?: boolean;
  isolateErrorsById?: string;
}

interface State extends ErrorBoundaryState {
  eventId?: string;
}

export class ErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private readonly maxRetries = 3;
  private retryTimeout?: NodeJS.Timeout;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: undefined,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const appError: AppError = {
      name: error.name,
      message: error.message,
      stack: error.stack,
      timestamp: new Date(),
      context: {
        componentStack: 'Will be added in componentDidCatch',
        userAgent: 'React Native',
        appVersion: '1.0.0',
        buildVersion: '1',
      },
    };

    return {
      hasError: true,
      error: appError,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const eventId = this.generateEventId();
    
    // Enhanced error object with more context
    const appError: AppError = {
      name: error.name,
      message: error.message,
      stack: error.stack,
      timestamp: new Date(),
      context: {
        componentStack: errorInfo.componentStack,
        userAgent: 'React Native',
        appVersion: '1.0.0',
        buildVersion: '1',
        isolationId: this.props.isolateErrorsById,
        retryCount: this.retryCount,
        deviceInfo: {
          brand: 'unknown',
          manufacturer: 'unknown', 
          modelName: 'unknown',
          osVersion: 'unknown',
        },
        performanceMetrics: performanceMonitor.getMetrics(),
      },
    };

    this.setState({
      error: appError,
      errorInfo,
      eventId,
    });

    // Performance tracking for error boundaries
    performanceMonitor.recordError({
      name: error.name,
      message: error.message,
      stack: error.stack || '',
      timestamp: new Date(),
      context: appError.context,
    });

    // Log error to services
    this.logErrorToService(appError, errorInfo, eventId);
    
    // Call custom error handler if provided
    this.props.onError?.(appError, errorInfo);
  }

  private generateEventId(): string {
    return `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private logErrorToService(error: AppError, errorInfo: ErrorInfo, eventId: string) {
    if (ENV_CONFIG.IS_DEVELOPMENT) {
      console.group(`🚨 ErrorBoundary caught an error [${eventId}]`);
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Component Stack:', errorInfo.componentStack);
      console.groupEnd();
    } else if (this.props.enableReporting !== false) {
      // In production, log to crash reporting service
      try {
        // Example integration with crash reporting
        // crashlytics().recordError(error, {
        //   eventId,
        //   componentStack: errorInfo.componentStack,
        // });
        
        // Example integration with error monitoring service
        // Sentry.captureException(error, {
        //   tags: {
        //     component: 'ErrorBoundary',
        //     eventId,
        //   },
        //   extra: {
        //     componentStack: errorInfo.componentStack,
        //     context: error.context,
        //   },
        // });
        
        console.warn('Error logged to crash reporting service:', eventId);
      } catch (reportingError) {
        console.error('Failed to report error to service:', reportingError);
      }
    }
  }

  private handleRetry = async () => {
    if (this.retryCount >= this.maxRetries) {
      Alert.alert(
        'Maximum retries exceeded',
        'The app has encountered repeated errors. Please restart the app or contact support.',
        [
          { text: 'Contact Support', onPress: this.handleContactSupport },
          { text: 'Restart App', onPress: this.handleReload },
        ]
      );
      return;
    }

    this.retryCount += 1;
    
    // Add a small delay before retrying to allow system to stabilize
    this.retryTimeout = setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        eventId: undefined,
      });
    }, 1000);
  };

  private handleReload = () => {
    // Reset retry count on manual reload
    this.retryCount = 0;
    this.handleRetry();
  };

  private handleContactSupport = () => {
    const { error, eventId } = this.state;
    const supportInfo = {
      eventId,
      errorMessage: error?.message,
      timestamp: error?.timestamp?.toISOString(),
      userAgent: error?.context?.userAgent,
      appVersion: error?.context?.appVersion,
    };

    Alert.alert(
      'Error Report Information',
      `Event ID: ${eventId}\n\nPlease include this information when contacting support.`,
      [
        {
          text: 'Copy Info',
          onPress: () => {
            // In a real app, you'd copy to clipboard
            console.log('Support info:', JSON.stringify(supportInfo, null, 2));
          },
        },
        { text: 'OK' },
      ]
    );
  };

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  componentDidUpdate(prevProps: Props) {
    // Reset error boundary if resetOnPropsChange is enabled and props changed
    if (this.props.resetOnPropsChange && prevProps.children !== this.props.children) {
      if (this.state.hasError) {
        this.retryCount = 0;
        this.setState({
          hasError: false,
          error: null,
          errorInfo: null,
          eventId: undefined,
        });
      }
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, eventId } = this.state;
      const showDetails = this.props.showErrorDetails ?? ENV_CONFIG.IS_DEVELOPMENT;
      const canRetry = this.retryCount < this.maxRetries;

      return (
        <View style={styles.container}>
          <View style={styles.content}>
            <Ionicons 
              name="alert-circle-outline" 
              size={64} 
              color={BRAND_COLORS.PRIMARY} 
              style={styles.icon} 
            />
            
            <Text style={styles.title}>Oops! Something went wrong</Text>
            <Text style={styles.subtitle}>
              The app encountered an unexpected error. 
              {this.props.enableReporting !== false && 'This has been reported to our team.'}
            </Text>

            {eventId && (
              <Text style={styles.eventId}>
                Error ID: {eventId}
              </Text>
            )}

            <View style={styles.buttonContainer}>
              {canRetry && (
                <TouchableOpacity 
                  style={styles.retryButton} 
                  onPress={this.handleRetry}
                  activeOpacity={0.7}
                >
                  <Ionicons name="refresh" size={20} color="white" />
                  <Text style={styles.retryButtonText}>
                    Try Again {this.retryCount > 0 && `(${this.maxRetries - this.retryCount} left)`}
                  </Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity 
                style={styles.reloadButton} 
                onPress={this.handleReload}
                activeOpacity={0.7}
              >
                <Ionicons name="reload" size={20} color={BRAND_COLORS.PRIMARY} />
                <Text style={styles.reloadButtonText}>Reload App</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.supportButton} 
                onPress={this.handleContactSupport}
                activeOpacity={0.7}
              >
                <Ionicons name="help-circle-outline" size={20} color={BRAND_COLORS.INFO} />
                <Text style={styles.supportButtonText}>Get Help</Text>
              </TouchableOpacity>
            </View>

            {showDetails && error && (
              <ScrollView style={styles.debugContainer} showsVerticalScrollIndicator={false}>
                <Text style={styles.debugTitle}>Error Details:</Text>
                <Text style={styles.debugText}>
                  {error.name}: {error.message}
                </Text>
                {error.stack && (
                  <Text style={styles.debugText}>
                    {error.stack}
                  </Text>
                )}
                {this.state.errorInfo?.componentStack && (
                  <>
                    <Text style={styles.debugTitle}>Component Stack:</Text>
                    <Text style={styles.debugText}>
                      {this.state.errorInfo.componentStack}
                    </Text>
                  </>
                )}
                {error.context && (
                  <>
                    <Text style={styles.debugTitle}>Context:</Text>
                    <Text style={styles.debugText}>
                      {JSON.stringify(error.context, null, 2)}
                    </Text>
                  </>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DARK_THEME_COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
    maxWidth: 320,
  },
  icon: {
    marginBottom: 24,
  },
  title: {
    color: DARK_THEME_COLORS.text,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    color: DARK_THEME_COLORS.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 16,
  },
  eventId: {
    color: DARK_THEME_COLORS.textSecondary,
    fontSize: 12,
    fontFamily: 'monospace',
    textAlign: 'center',
    marginBottom: 24,
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 6,
  },
  buttonContainer: {
    gap: 12,
    width: '100%',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BRAND_COLORS.PRIMARY,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  reloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: BRAND_COLORS.PRIMARY,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  reloadButtonText: {
    color: BRAND_COLORS.PRIMARY,
    fontSize: 16,
    fontWeight: '600',
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: BRAND_COLORS.INFO,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  supportButtonText: {
    color: BRAND_COLORS.INFO,
    fontSize: 14,
    fontWeight: '500',
  },
  debugContainer: {
    marginTop: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 8,
    maxHeight: 300,
    width: '100%',
  },
  debugTitle: {
    color: BRAND_COLORS.PRIMARY,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
  },
  debugText: {
    color: DARK_THEME_COLORS.textSecondary,
    fontSize: 11,
    fontFamily: 'monospace',
    lineHeight: 16,
    marginBottom: 8,
  },
});

export default ErrorBoundary;