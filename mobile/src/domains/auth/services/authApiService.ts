import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@/constants';
import type { 
  AuthUser, 
  AuthToken, 
  PhoneAuthFormData, 
  VerificationFormData, 
  SendVerificationResponse, 
  VerifyCodeResponse, 
  AuthError 
} from '../types';
import { networkService } from './networkService';
import { phoneValidationService } from './phoneValidationService';

class AuthApiService {
  private readonly API_BASE_URL = process.env['EXPO_PUBLIC_API_URL'] || 'https://api.meallog.app';
  private readonly AUTH_ENDPOINTS = {
    SEND_VERIFICATION: '/auth/phone/send-verification',
    VERIFY_CODE: '/auth/phone/verify',
    REFRESH_TOKEN: '/auth/token/refresh',
    LOGOUT: '/auth/logout'
  } as const;

  // Send verification code to phone
  async sendVerificationCode(data: PhoneAuthFormData): Promise<SendVerificationResponse> {
    // Validate phone number first
    const validation = phoneValidationService.validatePhone(data.phone, data.countryCode);
    if (!validation.isValid) {
      throw this.createAuthError('INVALID_PHONE', validation.error || 'Invalid phone number');
    }

    const formattedPhone = phoneValidationService.formatForInternational(data.phone, data.countryCode);
    
    return networkService.retryWithBackoff(async () => {
      // TODO: Replace with actual API call
      // Simulate API call for development
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate potential failures
      if (Math.random() < 0.1) {
        throw this.createAuthError('RATE_LIMITED', 'Too many requests. Please try again later.');
      }
      
      console.log(`[DEV] Verification code sent to ${formattedPhone}`);
      
      return {
        success: true,
        sessionId: `session_${Date.now()}`,
        cooldownSeconds: 30
      };
    });
  }

  // Verify the SMS code
  async verifyCode(data: VerificationFormData, phone: string): Promise<VerifyCodeResponse> {
    if (!data.code || data.code.length !== 6) {
      throw this.createAuthError('INVALID_CODE_FORMAT', 'Verification code must be 6 digits');
    }

    return networkService.retryWithBackoff(async () => {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate various verification scenarios
      if (data.code === '000000') {
        throw this.createAuthError('INVALID_CODE', 'Invalid verification code');
      }
      
      if (data.code === '111111') {
        throw this.createAuthError('EXPIRED_CODE', 'Verification code has expired');
      }
      
      // Create mock user and tokens
      const user: AuthUser = {
        id: `user_${Date.now()}`,
        username: `user_${phone.slice(-4)}`,
        phone: phone,
        isLoggedIn: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        profile: {
          displayName: `User ${phone.slice(-4)}`,
          preferences: {
            language: 'en',
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            notifications: {
              push: true,
              email: false,
              sms: true
            },
            privacy: {
              shareData: false,
              analytics: true
            }
          }
        }
      };

      const tokens: AuthToken = {
        accessToken: `access_${Date.now()}`,
        refreshToken: `refresh_${Date.now()}`,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      };

      return {
        success: true,
        user,
        tokens
      };
    });
  }

  // Refresh authentication token
  async refreshToken(): Promise<AuthToken> {
    const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.PHONE_AUTH_TOKEN + '_refresh');
    if (!refreshToken) {
      throw this.createAuthError('NO_REFRESH_TOKEN', 'No refresh token available');
    }

    return networkService.retryWithBackoff(async () => {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return {
        accessToken: `access_refreshed_${Date.now()}`,
        refreshToken: `refresh_refreshed_${Date.now()}`,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      };
    });
  }

  // Logout user
  async logout(): Promise<void> {
    const accessToken = await AsyncStorage.getItem(STORAGE_KEYS.PHONE_AUTH_TOKEN);
    
    if (accessToken) {
      try {
        // Attempt to notify server of logout
        await networkService.retryWithBackoff(async () => {
          // TODO: Replace with actual API call
          await new Promise(resolve => setTimeout(resolve, 300));
          console.log('[DEV] Logout notification sent to server');
        }, 1, 1000); // Only 1 retry for logout
      } catch (error) {
        // Ignore logout API errors - still clear local data
        console.warn('Failed to notify server of logout:', error);
      }
    }
  }

  // Validate current session
  async validateSession(): Promise<boolean> {
    const accessToken = await AsyncStorage.getItem(STORAGE_KEYS.PHONE_AUTH_TOKEN);
    if (!accessToken) return false;

    try {
      return await networkService.retryWithBackoff(async () => {
        // TODO: Replace with actual API call
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Simulate occasional session invalidation
        if (Math.random() < 0.05) {
          throw this.createAuthError('SESSION_EXPIRED', 'Session has expired');
        }
        
        return true;
      }, 1); // Only 1 retry for session validation
    } catch (error) {
      console.warn('Session validation failed:', error);
      return false;
    }
  }

  // Save authentication tokens
  async saveTokens(tokens: AuthToken): Promise<void> {
    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.PHONE_AUTH_TOKEN, tokens.accessToken),
      AsyncStorage.setItem(STORAGE_KEYS.PHONE_AUTH_TOKEN + '_refresh', tokens.refreshToken),
      AsyncStorage.setItem(STORAGE_KEYS.PHONE_AUTH_TOKEN + '_expires', tokens.expiresAt.toISOString())
    ]);
  }

  // Clear all authentication tokens
  async clearTokens(): Promise<void> {
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.PHONE_AUTH_TOKEN),
      AsyncStorage.removeItem(STORAGE_KEYS.PHONE_AUTH_TOKEN + '_refresh'),
      AsyncStorage.removeItem(STORAGE_KEYS.PHONE_AUTH_TOKEN + '_expires')
    ]);
  }

  // Check if tokens are expired
  async isTokenExpired(): Promise<boolean> {
    try {
      const expiresAtString = await AsyncStorage.getItem(STORAGE_KEYS.PHONE_AUTH_TOKEN + '_expires');
      if (!expiresAtString) return true;
      
      const expiresAt = new Date(expiresAtString);
      const now = new Date();
      
      // Consider expired if within 5 minutes of expiry
      const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds
      return (expiresAt.getTime() - now.getTime()) < bufferTime;
    } catch (error) {
      console.warn('Failed to check token expiry:', error);
      return true; // Assume expired on error
    }
  }

  // Create standardized auth errors
  private createAuthError(code: string, message: string, details?: Record<string, any>): AuthError {
    const error: AuthError = {
      code,
      message
    };
    if (details !== undefined) {
      error.details = details;
    }
    return error;
  }

  // Get error message based on error code
  getErrorMessage(error: AuthError): string {
    const errorMessages: Record<string, string> = {
      'INVALID_PHONE': 'Please enter a valid phone number',
      'RATE_LIMITED': 'Too many attempts. Please try again later',
      'INVALID_CODE': 'Invalid verification code',
      'EXPIRED_CODE': 'Verification code has expired',
      'INVALID_CODE_FORMAT': 'Please enter a 6-digit verification code',
      'SESSION_EXPIRED': 'Your session has expired. Please login again',
      'NO_REFRESH_TOKEN': 'Authentication required. Please login again',
      'NETWORK_ERROR': 'Network error. Please check your connection'
    };

    return errorMessages[error.code] || error.message || 'An unexpected error occurred';
  }
}

export const authApiService = new AuthApiService();
