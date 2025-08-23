import { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
} from 'react-native';
import { useTheme } from '@/lib/theme';
import { VALIDATION_PATTERNS } from '@/constants';

interface Country {
  name: string;
  code: string;
  dialCode: string;
  flag: string;
}

const COUNTRIES: Country[] = [
  { name: 'United States', code: 'US', dialCode: '+1', flag: '🇺🇸' },
  { name: 'Canada', code: 'CA', dialCode: '+1', flag: '🇨🇦' },
  { name: 'United Kingdom', code: 'GB', dialCode: '+44', flag: '🇬🇧' },
  { name: 'Germany', code: 'DE', dialCode: '+49', flag: '🇩🇪' },
  { name: 'France', code: 'FR', dialCode: '+33', flag: '🇫🇷' },
  { name: 'Italy', code: 'IT', dialCode: '+39', flag: '🇮🇹' },
  { name: 'Spain', code: 'ES', dialCode: '+34', flag: '🇪🇸' },
  { name: 'Japan', code: 'JP', dialCode: '+81', flag: '🇯🇵' },
  { name: 'South Korea', code: 'KR', dialCode: '+82', flag: '🇰🇷' },
  { name: 'China', code: 'CN', dialCode: '+86', flag: '🇨🇳' },
  { name: 'India', code: 'IN', dialCode: '+91', flag: '🇮🇳' },
  { name: 'Australia', code: 'AU', dialCode: '+61', flag: '🇦🇺' },
  { name: 'Brazil', code: 'BR', dialCode: '+55', flag: '🇧🇷' },
  { name: 'Mexico', code: 'MX', dialCode: '+52', flag: '🇲🇽' },
];

interface PhoneInputProps {
  value: string;
  onChangeText: (phone: string) => void;
  countryCode: string;
  onCountryChange: (countryCode: string) => void;
  placeholder?: string;
  error?: string | undefined;
  disabled?: boolean;
  autoFocus?: boolean;
  onSubmitEditing?: () => void;
}

export function PhoneInput({
  value,
  onChangeText,
  countryCode,
  onCountryChange,
  placeholder = "Phone number",
  error,
  disabled = false,
  autoFocus = false,
  onSubmitEditing,
}: PhoneInputProps) {
  const { theme } = useTheme();
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const selectedCountry = COUNTRIES.find(c => c.dialCode === countryCode) ?? COUNTRIES[0];

  // Format phone number as user types
  const formatPhoneNumber = (text: string) => {
    // Remove all non-digits
    const digits = text.replace(/\D/g, '');
    
    // Apply US/CA formatting for +1 numbers
    if (countryCode === '+1' && digits.length >= 3) {
      if (digits.length <= 3) {
        return `(${digits}`;
      } else if (digits.length <= 6) {
        return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
      } else {
        return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
      }
    }
    
    // Apply Korean formatting for +82 numbers
    if (countryCode === '+82' && digits.length >= 3) {
      // Remove leading 0 if present
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
    
    // For other countries, just return the digits
    return digits;
  };

  const handleTextChange = (text: string) => {
    const formatted = formatPhoneNumber(text);
    onChangeText(formatted);
  };

  const handleCountrySelect = (country: Country) => {
    onCountryChange(country.dialCode);
    setShowCountryPicker(false);
    // Clear the phone number when changing countries
    onChangeText('');
    // Focus input after country selection
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const validatePhone = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    const fullNumber = `${countryCode}${digits}`;
    return VALIDATION_PATTERNS.PHONE.test(fullNumber);
  };

  const isValid = value.length > 0 ? validatePhone(value) : true;

  const renderCountryItem = ({ item }: { item: Country }) => (
    <TouchableOpacity
      style={[
        styles.countryItem,
        { borderBottomColor: theme.colors.border }
      ]}
      onPress={() => handleCountrySelect(item)}
    >
      <Text style={styles.flag}>{item.flag}</Text>
      <View style={styles.countryInfo}>
        <Text style={[styles.countryName, { color: theme.colors.text }]}>
          {item.name}
        </Text>
        <Text style={[styles.dialCode, { color: theme.colors.textSecondary }]}>
          {item.dialCode}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.inputContainer,
          {
            borderColor: error ? theme.colors.error : 
                         isValid ? theme.colors.border : theme.colors.error,
            backgroundColor: theme.colors.surface,
          },
          disabled && { opacity: 0.6 },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.countrySelector,
            { borderRightColor: theme.colors.border }
          ]}
          onPress={() => !disabled && setShowCountryPicker(true)}
          disabled={disabled}
        >
          <Text style={styles.flag}>{selectedCountry?.flag}</Text>
          <Text style={[styles.countryCode, { color: theme.colors.text }]}>
            {selectedCountry?.dialCode}
          </Text>
          <Text style={[styles.chevron, { color: theme.colors.textSecondary }]}>
            ▼
          </Text>
        </TouchableOpacity>

        <TextInput
          ref={inputRef}
          style={[
            styles.input,
            { 
              color: theme.colors.text,
              flex: 1,
            }
          ]}
          value={value}
          onChangeText={handleTextChange}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textSecondary}
          keyboardType="phone-pad"
          textContentType="telephoneNumber"
          autoComplete="tel"
          blurOnSubmit={false}
          autoFocus={autoFocus}
          editable={!disabled}
          onSubmitEditing={onSubmitEditing}
          returnKeyType="done"
        />
      </View>

      {error && (
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          {error}
        </Text>
      )}

      {!isValid && !error && value.length > 0 && (
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          Please enter a valid phone number
        </Text>
      )}

      <Modal
        visible={showCountryPicker}
        animationType="slide"
        onRequestClose={() => setShowCountryPicker(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              Select Country
            </Text>
            <TouchableOpacity
              onPress={() => setShowCountryPicker(false)}
              style={styles.closeButton}
            >
              <Text style={[styles.closeButtonText, { color: theme.colors.primary }]}>
                Done
              </Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={COUNTRIES}
            renderItem={renderCountryItem}
            keyExtractor={(item) => item.code}
            style={styles.countryList}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
    minHeight: 56,
  },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderRightWidth: 1,
    minWidth: 100,
  },
  flag: {
    fontSize: 20,
    marginRight: 8,
  },
  countryCode: {
    fontSize: 16,
    fontWeight: '500',
    marginRight: 4,
  },
  chevron: {
    fontSize: 10,
    transform: [{ scaleY: 0.6 }],
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
  },
  errorText: {
    fontSize: 14,
    marginTop: 8,
    marginLeft: 4,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  countryList: {
    flex: 1,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  countryInfo: {
    marginLeft: 12,
    flex: 1,
  },
  countryName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  dialCode: {
    fontSize: 14,
  },
});