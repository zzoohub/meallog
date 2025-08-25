import { VALIDATION_PATTERNS } from "../../../constants";

// Validation utilities for authentication
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