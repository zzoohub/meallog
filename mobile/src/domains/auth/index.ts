// Types
export type {
  AuthUser,
  UserPreferences,
  PhoneAuthFormData,
  VerificationFormData,
  Country,
  AuthError,
  AuthToken,
  AuthState,
  AuthActions,
  AuthStore,
  ValidationResult,
  PhoneValidationResult,
  SendVerificationResponse,
  VerifyCodeResponse,
  AuthEvent
} from './types';

// Stores
export { useAuthStore } from './stores/authStore';

// Hooks
export { 
  useAuth, 
  useAuthStatus, 
  usePhoneAuth, 
  useUserProfile, 
  useAuthError 
} from './hooks/useAuth';
export { 
  usePhoneValidation, 
  useCountrySelection, 
  usePhoneFormatter 
} from './hooks/usePhoneValidation';

// Components
export * from './components';

// Services
export { authApiService } from './services/authApiService';
export { phoneValidationService } from './services/phoneValidationService';
export { networkService } from './services/networkService';