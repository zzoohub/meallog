import { createContext, useContext, useEffect, ReactNode } from 'react';
import { useAuthStore } from '../stores/authStore';
import type { User, PhoneAuthFormData, VerificationFormData } from '@/types';

interface AuthContextType {
  // State
  user: User | null;
  isLoading: boolean;
  isVerifying: boolean;
  error: string | null;
  pendingPhone: string | null;
  resendCooldown: number;
  isAuthenticated: boolean;

  // Actions
  sendVerificationCode: (data: PhoneAuthFormData) => Promise<void>;
  verifyCode: (data: VerificationFormData) => Promise<void>;
  resendCode: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  clearPendingAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
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
    updateUser,
    logout,
    loadUserFromStorage,
    clearError,
    clearPendingAuth,
  } = useAuthStore();

  const isAuthenticated = !!user?.isLoggedIn;

  // Load user from storage on app start
  useEffect(() => {
    loadUserFromStorage();
  }, [loadUserFromStorage]);

  const contextValue: AuthContextType = {
    // State
    user,
    isLoading,
    isVerifying,
    error,
    pendingPhone,
    resendCooldown,
    isAuthenticated,

    // Actions
    sendVerificationCode,
    verifyCode,
    resendCode,
    updateUser,
    logout,
    clearError,
    clearPendingAuth,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}