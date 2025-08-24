import { useCallback } from 'react';
import { useAuthStore } from '../stores/authStore';
import type { PhoneAuthFormData, VerificationFormData, AuthUser, UserPreferences } from '../types';

/**
 * Primary authentication hook providing all auth functionality
 */
export function useAuth() {
  const {
    user,
    isLoading,
    isVerifying,
    error,
    pendingPhone,
    resendCooldown,
    sendVerificationCode,
    verifyCode,
    resendCode,
    setUser,
    updateUser,
    updateUserPreferences,
    logout,
    loadUserFromStorage,
    refreshAuthToken,
    validateSession,
    clearError,
    clearPendingAuth
  } = useAuthStore();

  // Memoized auth actions
  const authActions = {
    sendVerificationCode: useCallback(async (data: PhoneAuthFormData) => {
      await sendVerificationCode(data);
    }, [sendVerificationCode]),

    verifyCode: useCallback(async (data: VerificationFormData) => {
      await verifyCode(data);
    }, [verifyCode]),

    resendCode: useCallback(async () => {
      await resendCode();
    }, [resendCode]),

    updateProfile: useCallback(async (updates: Partial<AuthUser>) => {
      await updateUser(updates);
    }, [updateUser]),

    updatePreferences: useCallback(async (preferences: Partial<UserPreferences>) => {
      await updateUserPreferences(preferences);
    }, [updateUserPreferences]),

    logout: useCallback(async () => {
      await logout();
    }, [logout]),

    initialize: useCallback(async () => {
      await loadUserFromStorage();
    }, [loadUserFromStorage]),

    refreshToken: useCallback(async () => {
      await refreshAuthToken();
    }, [refreshAuthToken]),

    checkSession: useCallback(async () => {
      return await validateSession();
    }, [validateSession]),

    clearError: useCallback(() => {
      clearError();
    }, [clearError]),

    clearPending: useCallback(() => {
      clearPendingAuth();
    }, [clearPendingAuth])
  };

  return {
    // State
    user,
    isAuthenticated: !!user,
    isLoading,
    isVerifying,
    error,
    pendingPhone,
    resendCooldown,
    canResend: resendCooldown === 0,
    
    // Actions
    ...authActions
  };
}

/**
 * Hook for checking authentication status without triggering re-renders on other state changes
 */
export function useAuthStatus() {
  const user = useAuthStore(state => state.user);
  const isLoading = useAuthStore(state => state.isLoading);
  
  return {
    isAuthenticated: !!user,
    isLoading,
    user
  };
}

/**
 * Hook specifically for phone authentication flow
 */
export function usePhoneAuth() {
  const {
    pendingPhone,
    resendCooldown,
    isLoading,
    isVerifying,
    error,
    sendVerificationCode,
    verifyCode,
    resendCode,
    clearError,
    clearPendingAuth
  } = useAuthStore();

  return {
    // State
    pendingPhone,
    resendCooldown,
    isLoading,
    isVerifying,
    error,
    canResend: resendCooldown === 0,
    hasError: !!error,
    
    // Actions
    sendCode: useCallback(async (data: PhoneAuthFormData) => {
      await sendVerificationCode(data);
    }, [sendVerificationCode]),
    
    verifyCode: useCallback(async (data: VerificationFormData) => {
      await verifyCode(data);
    }, [verifyCode]),
    
    resendCode: useCallback(async () => {
      await resendCode();
    }, [resendCode]),
    
    clearError: useCallback(() => {
      clearError();
    }, [clearError]),
    
    reset: useCallback(() => {
      clearPendingAuth();
    }, [clearPendingAuth])
  };
}

/**
 * Hook for user profile management
 */
export function useUserProfile() {
  const user = useAuthStore(state => state.user);
  const isLoading = useAuthStore(state => state.isLoading);
  const error = useAuthStore(state => state.error);
  const updateUser = useAuthStore(state => state.updateUser);
  const updateUserPreferences = useAuthStore(state => state.updateUserPreferences);

  return {
    user,
    profile: user?.profile,
    preferences: user?.profile?.preferences,
    isLoading,
    error,
    
    updateProfile: useCallback(async (updates: Partial<AuthUser>) => {
      await updateUser(updates);
    }, [updateUser]),
    
    updatePreferences: useCallback(async (preferences: Partial<UserPreferences>) => {
      await updateUserPreferences(preferences);
    }, [updateUserPreferences])
  };
}

/**
 * Hook for authentication error handling
 */
export function useAuthError() {
  const error = useAuthStore(state => state.error);
  const clearError = useAuthStore(state => state.clearError);
  
  return {
    error,
    hasError: !!error,
    errorCode: error?.code,
    errorMessage: error?.message,
    
    clearError: useCallback(() => {
      clearError();
    }, [clearError])
  };
}
