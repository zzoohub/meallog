// Auth domain types

export interface User {
  id: string;
  username: string;
  email?: string;
  phone: string;
  avatar?: string;
  isLoggedIn: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Form types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
}

// Phone auth types
export interface PhoneAuthFormData {
  phone: string;
  countryCode: string;
}

export interface VerificationFormData {
  code: string;
}