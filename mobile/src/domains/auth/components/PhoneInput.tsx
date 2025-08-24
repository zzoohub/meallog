import { useState, useRef, useMemo } from 'react';
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
import { phoneValidationService } from '../services/phoneValidationService';
import { usePhoneValidation } from '../hooks/usePhoneValidation';
import type { Country } from '../types';

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

  // Get all countries from validation service
  const countries = useMemo(() => phoneValidationService.getAllCountries(), []);
  const selectedCountry = phoneValidationService.getCountryByDialCode(countryCode) ?? countries[0];

  // Validate phone number using validation service
  const validation = useMemo(() => {
    if (!value) return { isValid: true };
    return phoneValidationService.validatePhone(value, countryCode);
  }, [value, countryCode]);

  const handleTextChange = (text: string) => {
    // Format phone number using validation service
    const formatted = phoneValidationService.formatPhoneForDisplay(text, countryCode);
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

  const isValid = validation.isValid;
  const validationError = validation.error;

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

      {!isValid && !error && value.length > 0 && validationError && (
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          {validationError}
        </Text>
      )}
      
      {validation.suggestions && validation.suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          {validation.suggestions.map((suggestion, index) => (
            <Text key={index} style={[styles.suggestionText, { color: theme.colors.textSecondary }]}>
              {suggestion}
            </Text>
          ))}
        </View>
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
            data={countries}
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
  suggestionsContainer: {
    marginTop: 4,
  },
  suggestionText: {
    fontSize: 12,
    marginTop: 2,
    marginLeft: 4,
  },
});