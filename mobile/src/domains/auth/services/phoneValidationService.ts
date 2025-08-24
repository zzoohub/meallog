import type { Country, PhoneValidationResult } from '../types';

// Extended country data with validation patterns
export const COUNTRIES: Country[] = [
  { 
    name: 'United States', 
    code: 'US', 
    dialCode: '+1', 
    flag: '🇺🇸',
    phoneLength: 10,
    phonePattern: /^[2-9]\d{2}[2-9]\d{2}\d{4}$/
  },
  { 
    name: 'Canada', 
    code: 'CA', 
    dialCode: '+1', 
    flag: '🇨🇦',
    phoneLength: 10,
    phonePattern: /^[2-9]\d{2}[2-9]\d{2}\d{4}$/
  },
  { 
    name: 'United Kingdom', 
    code: 'GB', 
    dialCode: '+44', 
    flag: '🇬🇧',
    phoneLength: 10,
    phonePattern: /^[1-9]\d{8,9}$/
  },
  { 
    name: 'Germany', 
    code: 'DE', 
    dialCode: '+49', 
    flag: '🇩🇪',
    phoneLength: 11,
    phonePattern: /^[1-9]\d{10,11}$/
  },
  { 
    name: 'France', 
    code: 'FR', 
    dialCode: '+33', 
    flag: '🇫🇷',
    phoneLength: 10,
    phonePattern: /^[1-9]\d{8,9}$/
  },
  { 
    name: 'South Korea', 
    code: 'KR', 
    dialCode: '+82', 
    flag: '🇰🇷',
    phoneLength: 10,
    phonePattern: /^[1-9]\d{7,8}$/
  },
  { 
    name: 'Japan', 
    code: 'JP', 
    dialCode: '+81', 
    flag: '🇯🇵',
    phoneLength: 10,
    phonePattern: /^[1-9]\d{8,9}$/
  },
  { 
    name: 'China', 
    code: 'CN', 
    dialCode: '+86', 
    flag: '🇨🇳',
    phoneLength: 11,
    phonePattern: /^1[3-9]\d{9}$/
  },
  { 
    name: 'India', 
    code: 'IN', 
    dialCode: '+91', 
    flag: '🇮🇳',
    phoneLength: 10,
    phonePattern: /^[6-9]\d{9}$/
  },
  { 
    name: 'Australia', 
    code: 'AU', 
    dialCode: '+61', 
    flag: '🇦🇺',
    phoneLength: 9,
    phonePattern: /^[2-9]\d{8}$/
  },
  { 
    name: 'Brazil', 
    code: 'BR', 
    dialCode: '+55', 
    flag: '🇧🇷',
    phoneLength: 11,
    phonePattern: /^[1-9]\d{10}$/
  },
  { 
    name: 'Mexico', 
    code: 'MX', 
    dialCode: '+52', 
    flag: '🇲🇽',
    phoneLength: 10,
    phonePattern: /^[2-9]\d{9}$/
  },
];

class PhoneValidationService {
  // Get country by dial code
  getCountryByDialCode(dialCode: string): Country | undefined {
    return COUNTRIES.find(country => country.dialCode === dialCode);
  }

  // Clean phone number (remove all non-digits)
  cleanPhoneNumber(phone: string): string {
    return phone.replace(/\D/g, '');
  }

  // Format phone number for display based on country
  formatPhoneForDisplay(phone: string, countryCode: string): string {
    const digits = this.cleanPhoneNumber(phone);
    const country = this.getCountryByDialCode(countryCode);
    
    if (!country) return digits;
    
    switch (countryCode) {
      case '+1': // US/CA
        return this.formatUSPhone(digits);
      case '+82': // South Korea
        return this.formatKoreanPhone(digits);
      case '+44': // UK
        return this.formatUKPhone(digits);
      case '+49': // Germany
        return this.formatGermanPhone(digits);
      case '+33': // France
        return this.formatFrenchPhone(digits);
      default:
        return digits;
    }
  }

  // Format for international transmission
  formatForInternational(phone: string, countryCode: string): string {
    const digits = this.cleanPhoneNumber(phone);
    const country = this.getCountryByDialCode(countryCode);
    
    if (!country) return `${countryCode}${digits}`;
    
    // Remove leading zeros for specific countries
    if (['+82', '+81', '+33', '+49'].includes(countryCode)) {
      const cleanedDigits = digits.replace(/^0+/, '');
      return `${countryCode}${cleanedDigits}`;
    }
    
    return `${countryCode}${digits}`;
  }

  // Validate phone number
  validatePhone(phone: string, countryCode: string): PhoneValidationResult {
    const digits = this.cleanPhoneNumber(phone);
    const country = this.getCountryByDialCode(countryCode);
    
    if (!country) {
      return {
        isValid: false,
        error: 'Unsupported country code'
      };
    }

    if (digits.length === 0) {
      return {
        isValid: false,
        error: 'Phone number is required'
      };
    }

    // Check length
    if (digits.length < (country.phoneLength - 1) || digits.length > (country.phoneLength + 1)) {
      return {
        isValid: false,
        error: `Phone number should be ${country.phoneLength} digits for ${country.name}`,
        suggestions: [`Expected ${country.phoneLength} digits`]
      };
    }

    // Check pattern if defined
    if (country.phonePattern && !country.phonePattern.test(digits)) {
      return {
        isValid: false,
        error: 'Invalid phone number format',
        suggestions: this.getFormatSuggestions(countryCode)
      };
    }

    // Additional validation for specific countries
    const countrySpecificValidation = this.validateCountrySpecific(digits, countryCode);
    if (!countrySpecificValidation.isValid) {
      return countrySpecificValidation;
    }

    return {
      isValid: true,
      formattedPhone: this.formatPhoneForDisplay(phone, countryCode),
      internationalFormat: this.formatForInternational(phone, countryCode)
    };
  }

  // Country-specific validation
  private validateCountrySpecific(digits: string, countryCode: string): PhoneValidationResult {
    switch (countryCode) {
      case '+1': // US/CA
        // First digit of area code and exchange code cannot be 0 or 1
        if (digits.length >= 3 && ['0', '1'].includes(digits[0])) {
          return {
            isValid: false,
            error: 'Area code cannot start with 0 or 1'
          };
        }
        if (digits.length >= 6 && ['0', '1'].includes(digits[3])) {
          return {
            isValid: false,
            error: 'Exchange code cannot start with 0 or 1'
          };
        }
        break;
      
      case '+82': // South Korea
        // Mobile numbers start with specific digits
        if (digits.length >= 2) {
          const mobilePrefix = digits.substring(0, 2);
          const validPrefixes = ['10', '11', '16', '17', '18', '19'];
          if (!validPrefixes.includes(mobilePrefix)) {
            return {
              isValid: false,
              error: 'Invalid mobile number prefix for South Korea'
            };
          }
        }
        break;
      
      case '+86': // China
        // Mobile numbers start with 1
        if (digits.length >= 1 && digits[0] !== '1') {
          return {
            isValid: false,
            error: 'Chinese mobile numbers must start with 1'
          };
        }
        break;
      
      case '+91': // India
        // Mobile numbers start with 6, 7, 8, or 9
        if (digits.length >= 1 && !['6', '7', '8', '9'].includes(digits[0])) {
          return {
            isValid: false,
            error: 'Indian mobile numbers must start with 6, 7, 8, or 9'
          };
        }
        break;
    }
    
    return { isValid: true };
  }

  // Format suggestions for each country
  private getFormatSuggestions(countryCode: string): string[] {
    switch (countryCode) {
      case '+1':
        return ['Format: (XXX) XXX-XXXX'];
      case '+82':
        return ['Format: XX-XXXX-XXXX'];
      case '+44':
        return ['Format: XXXX XXX XXXX'];
      default:
        return [];
    }
  }

  // Country-specific formatting methods
  private formatUSPhone(digits: string): string {
    if (digits.length <= 3) {
      return digits;
    } else if (digits.length <= 6) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    } else {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    }
  }

  private formatKoreanPhone(digits: string): string {
    const cleanDigits = digits.replace(/^0+/, '');
    
    if (cleanDigits.length <= 2) {
      return cleanDigits;
    } else if (cleanDigits.length <= 6) {
      return `${cleanDigits.slice(0, 2)}-${cleanDigits.slice(2)}`;
    } else if (cleanDigits.length <= 10) {
      return `${cleanDigits.slice(0, 2)}-${cleanDigits.slice(2, 6)}-${cleanDigits.slice(6)}`;
    } else {
      return `${cleanDigits.slice(0, 3)}-${cleanDigits.slice(3, 7)}-${cleanDigits.slice(7, 11)}`;
    }
  }

  private formatUKPhone(digits: string): string {
    if (digits.length <= 4) {
      return digits;
    } else if (digits.length <= 7) {
      return `${digits.slice(0, 4)} ${digits.slice(4)}`;
    } else {
      return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
    }
  }

  private formatGermanPhone(digits: string): string {
    if (digits.length <= 3) {
      return digits;
    } else if (digits.length <= 7) {
      return `${digits.slice(0, 3)} ${digits.slice(3)}`;
    } else {
      return `${digits.slice(0, 3)} ${digits.slice(3, 7)} ${digits.slice(7)}`;
    }
  }

  private formatFrenchPhone(digits: string): string {
    if (digits.length <= 2) {
      return digits;
    } else {
      return digits.match(/.{1,2}/g)?.join(' ') || digits;
    }
  }

  // Get all supported countries
  getAllCountries(): Country[] {
    return COUNTRIES;
  }

  // Search countries by name
  searchCountries(query: string): Country[] {
    const lowercaseQuery = query.toLowerCase();
    return COUNTRIES.filter(country => 
      country.name.toLowerCase().includes(lowercaseQuery) ||
      country.code.toLowerCase().includes(lowercaseQuery) ||
      country.dialCode.includes(query)
    );
  }
}

export const phoneValidationService = new PhoneValidationService();
