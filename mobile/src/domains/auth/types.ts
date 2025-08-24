export interface AuthUser {
  id: string;
  username: string;
  phone: string;
  isLoggedIn: boolean;
  createdAt: Date;
  updatedAt: Date;
  profile?: {
    displayName?: string;
    avatar?: string;
    preferences?: UserPreferences;
  };
}

export interface UserPreferences {
  language: string;
  timezone: string;
  notifications: {
    push: boolean;
    email: boolean;
    sms: boolean;
  };
  privacy: {
    shareData: boolean;
    analytics: boolean;
  };
}

export interface PhoneAuthFormData {
  phone: string;
  countryCode: string;
}

export interface VerificationFormData {
  code: string;
}

export interface Country {
  name: string;
  code: string;
  dialCode: string;
  flag: string;
  phoneLength?: number;
  phonePattern?: RegExp;
}

export interface AuthError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export interface AuthToken {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

export interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isVerifying: boolean;
  error: AuthError | null;
  pendingPhone: string | null;
  resendCooldown: number;
  lastAuthAttempt: Date | null;
}

export interface AuthActions {
  // Phone auth actions
  sendVerificationCode: (data: PhoneAuthFormData) => Promise<void>;
  verifyCode: (data: VerificationFormData) => Promise<void>;
  resendCode: () => Promise<void>;
  
  // User management
  setUser: (user: Partial<AuthUser>) => void;
  updateUser: (updates: Partial<AuthUser>) => Promise<void>;
  updateUserPreferences: (preferences: Partial<UserPreferences>) => Promise<void>;
  logout: () => Promise<void>;
  loadUserFromStorage: () => Promise<void>;
  refreshAuthToken: () => Promise<void>;
  
  // Utility
  clearError: () => void;
  clearPendingAuth: () => void;
  startResendCooldown: () => void;
  validateSession: () => Promise<boolean>;
}

export type AuthStore = AuthState & AuthActions;

// Validation result types
export interface ValidationResult {
  isValid: boolean;
  error?: string;
  suggestions?: string[];
}

export interface PhoneValidationResult extends ValidationResult {
  formattedPhone?: string;
  internationalFormat?: string;
}

// API Response types
export interface SendVerificationResponse {
  success: boolean;
  sessionId: string;
  cooldownSeconds: number;
}

export interface VerifyCodeResponse {
  success: boolean;
  user: AuthUser;
  tokens: AuthToken;
}

// Event types for analytics
export interface AuthEvent {
  type: 'phone_auth_started' | 'phone_auth_failed' | 'verification_started' | 
        'verification_success' | 'verification_failed' | 'logout' | 'session_expired';
  timestamp: Date;
  metadata?: Record<string, any>;
}
