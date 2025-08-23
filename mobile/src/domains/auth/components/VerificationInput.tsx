import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/lib/theme';
import { VALIDATION_PATTERNS } from '@/constants';

interface VerificationInputProps {
  length?: number;
  value: string;
  onChangeText: (code: string) => void;
  onComplete?: (code: string) => void;
  error?: string | undefined;
  disabled?: boolean;
  autoFocus?: boolean;
}

export function VerificationInput({
  length = 6,
  value,
  onChangeText,
  onComplete,
  error,
  disabled = false,
  autoFocus = true,
}: VerificationInputProps) {
  const { theme } = useTheme();
  const [focusedIndex, setFocusedIndex] = useState(autoFocus ? 0 : -1);
  const inputRefs = useRef<Array<TextInput | null>>([]);

  // Split the value into individual digits
  const digits = value.split('').slice(0, length);
  while (digits.length < length) {
    digits.push('');
  }

  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0]?.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    // Auto-submit when code is complete
    if (value.length === length && onComplete) {
      onComplete(value);
    }
  }, [value, length, onComplete]);

  useEffect(() => {
    // Haptic feedback on error
    if (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [error]);

  const handleChangeText = (text: string, index: number) => {
    // Only allow digits
    const digit = text.replace(/\D/g, '').slice(-1);
    
    // Create new code array
    const newDigits = [...digits];
    newDigits[index] = digit;
    
    // Update the code
    const newCode = newDigits.join('');
    onChangeText(newCode);

    // Move to next input or handle completion
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
      setFocusedIndex(index + 1);
    } else if (digit && index === length - 1) {
      // Last digit entered, blur to trigger completion
      inputRefs.current[index]?.blur();
      setFocusedIndex(-1);
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace') {
      if (!digits[index] && index > 0) {
        // If current input is empty and backspace is pressed, move to previous input
        inputRefs.current[index - 1]?.focus();
        setFocusedIndex(index - 1);
      }
    }
  };

  const handleFocus = (index: number) => {
    setFocusedIndex(index);
  };

  const handleBlur = () => {
    setFocusedIndex(-1);
  };

  const handleCellPress = (index: number) => {
    if (!disabled) {
      inputRefs.current[index]?.focus();
    }
  };

  const isValid = value.length === 0 || VALIDATION_PATTERNS.VERIFICATION_CODE.test(value);
  const borderColor = error ? theme.colors.error : 
                     !isValid ? theme.colors.error : theme.colors.border;

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        {digits.map((digit, index) => {
          const isFocused = focusedIndex === index;
          const hasValue = digit !== '';
          
          return (
            <View key={index} style={styles.cellContainer}>
              <TouchableOpacity
                onPress={() => handleCellPress(index)}
                style={[
                  styles.cell,
                  {
                    borderColor: (isFocused || hasValue) ? theme.colors.primary : borderColor,
                    backgroundColor: theme.colors.surface,
                    transform: isFocused ? [{ scale: 1.02 }] : [{ scale: 1 }],
                    shadowOpacity: isFocused ? 0.1 : 0.05,
                  },
                  disabled && { opacity: 0.6 },
                ]}
              >
                <TextInput
                  ref={(ref) => { inputRefs.current[index] = ref; }}
                  style={[
                    styles.input,
                    {
                      color: theme.colors.text,
                    }
                  ]}
                  value={digit}
                  onChangeText={(text) => handleChangeText(text, index)}
                  onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                  onFocus={() => handleFocus(index)}
                  onBlur={handleBlur}
                  keyboardType="number-pad"
                  textContentType="oneTimeCode"
                  maxLength={1}
                  editable={!disabled}
                  selectTextOnFocus
                  caretHidden
                  blurOnSubmit={false}
                  autoCorrect={false}
                  autoCapitalize="none"
                />
                
                {/* Visual digit display */}
                <View style={styles.digitDisplay}>
                  <Text style={[
                    styles.digitText,
                    { color: theme.colors.text },
                    !hasValue && { opacity: 0 }
                  ]}>
                    {digit}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>

      {/* Error message container - Reserve space to prevent layout shift */}
      <View style={styles.errorContainer}>
        {error && (
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            {error}
          </Text>
        )}

        {!isValid && !error && value.length > 0 && (
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            Please enter a valid 6-digit code
          </Text>
        )}
      </View>
    </View>
  );
}

const { width } = Dimensions.get('window');
const cellSize = Math.min((width - 48 - 60) / 6, 56); // Account for 24px padding on each side + gaps

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  cellContainer: {
    position: 'relative',
  },
  cell: {
    width: cellSize,
    height: cellSize,
    borderWidth: 2,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    // Apply consistent shadow to all cells to prevent layout shift
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  input: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
    opacity: 0, // Hide the actual input, show the digit display instead
  },
  digitDisplay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  digitText: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorContainer: {
    minHeight: 40, // Reserve space for error message to prevent layout shift
    marginTop: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 18,
  },
});