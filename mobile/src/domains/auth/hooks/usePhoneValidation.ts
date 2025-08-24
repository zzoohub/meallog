import { useState, useCallback, useMemo } from 'react';
import { phoneValidationService } from '../services/phoneValidationService';
import type { Country, PhoneValidationResult } from '../types';

export function usePhoneValidation() {
  const [selectedCountry, setSelectedCountry] = useState<Country>(
    () => phoneValidationService.getAllCountries()[0] // Default to first country (US)
  );
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [validationResult, setValidationResult] = useState<PhoneValidationResult | null>(null);

  // Get all available countries
  const countries = useMemo(() => phoneValidationService.getAllCountries(), []);

  // Validate phone number when it changes
  const validatePhoneNumber = useCallback((phone: string, countryCode: string) => {
    const result = phoneValidationService.validatePhone(phone, countryCode);
    setValidationResult(result);
    return result;
  }, []);

  // Format phone number for display
  const formatPhoneForDisplay = useCallback((phone: string, countryCode: string) => {
    return phoneValidationService.formatPhoneForDisplay(phone, countryCode);
  }, []);

  // Format phone number for international transmission
  const formatPhoneForInternational = useCallback((phone: string, countryCode: string) => {
    return phoneValidationService.formatForInternational(phone, countryCode);
  }, []);

  // Search countries by name or code
  const searchCountries = useCallback((query: string) => {
    return phoneValidationService.searchCountries(query);
  }, []);

  // Update phone number with formatting and validation
  const updatePhoneNumber = useCallback((phone: string) => {
    const formatted = formatPhoneForDisplay(phone, selectedCountry.dialCode);
    setPhoneNumber(formatted);
    
    // Validate the phone number
    validatePhoneNumber(phone, selectedCountry.dialCode);
  }, [selectedCountry.dialCode, formatPhoneForDisplay, validatePhoneNumber]);

  // Update selected country
  const updateSelectedCountry = useCallback((country: Country) => {
    setSelectedCountry(country);
    // Clear phone number when changing countries
    setPhoneNumber('');
    setValidationResult(null);
  }, []);

  // Get validation state
  const isValid = validationResult?.isValid ?? false;
  const hasError = validationResult && !validationResult.isValid;
  const errorMessage = validationResult?.error;
  const suggestions = validationResult?.suggestions;

  // Get formatted values
  const formattedPhone = validationResult?.formattedPhone || phoneNumber;
  const internationalPhone = validationResult?.internationalFormat;

  return {
    // State
    selectedCountry,
    phoneNumber,
    formattedPhone,
    internationalPhone,
    validationResult,
    countries,
    
    // Validation state
    isValid,
    hasError,
    errorMessage,
    suggestions,
    
    // Actions
    updatePhoneNumber,
    updateSelectedCountry,
    validatePhoneNumber,
    formatPhoneForDisplay,
    formatPhoneForInternational,
    searchCountries,
    
    // Utilities
    reset: useCallback(() => {
      setPhoneNumber('');
      setValidationResult(null);
    }, []),
    
    getCountryByDialCode: useCallback((dialCode: string) => {
      return phoneValidationService.getCountryByDialCode(dialCode);
    }, [])
  };
}

/**
 * Hook for managing country selection
 */
export function useCountrySelection() {
  const [selectedCountry, setSelectedCountry] = useState<Country>(
    () => phoneValidationService.getAllCountries()[0]
  );
  
  const [searchQuery, setSearchQuery] = useState('');
  
  // Get all countries
  const allCountries = useMemo(() => phoneValidationService.getAllCountries(), []);
  
  // Filter countries based on search query
  const filteredCountries = useMemo(() => {
    if (!searchQuery.trim()) return allCountries;
    return phoneValidationService.searchCountries(searchQuery);
  }, [searchQuery, allCountries]);
  
  return {
    selectedCountry,
    searchQuery,
    allCountries,
    filteredCountries,
    
    setSelectedCountry,
    setSearchQuery,
    
    selectCountry: useCallback((country: Country) => {
      setSelectedCountry(country);
      setSearchQuery(''); // Clear search when selecting
    }, []),
    
    clearSearch: useCallback(() => {
      setSearchQuery('');
    }, [])
  };
}

/**
 * Hook for real-time phone number formatting
 */
export function usePhoneFormatter(countryCode: string) {
  const formatAsUserTypes = useCallback((input: string) => {
    return phoneValidationService.formatPhoneForDisplay(input, countryCode);
  }, [countryCode]);
  
  const getInternationalFormat = useCallback((input: string) => {
    return phoneValidationService.formatForInternational(input, countryCode);
  }, [countryCode]);
  
  const validateInput = useCallback((input: string) => {
    return phoneValidationService.validatePhone(input, countryCode);
  }, [countryCode]);
  
  return {
    formatAsUserTypes,
    getInternationalFormat,
    validateInput,
    
    // Helper to clean phone number (digits only)
    cleanPhoneNumber: useCallback((phone: string) => {
      return phoneValidationService.cleanPhoneNumber(phone);
    }, [])
  };
}
