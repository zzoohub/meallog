import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Dimensions,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/lib/theme';
import { Button } from '@/components/ui/Button';
import { VerificationInput } from './VerificationInput';
import { useAuthStore } from '../stores/authStore';

interface VerificationScreenProps {
  onSuccess: () => void;
  onBack: () => void;
}

export function VerificationScreen({ onSuccess, onBack }: VerificationScreenProps) {
  const { theme } = useTheme();
  const {
    verifyCode,
    resendCode,
    pendingPhone,
    isVerifying,
    isLoading,
    error,
    resendCooldown,
    clearError,
  } = useAuthStore();
  
  const [code, setCode] = useState('');

  // Format phone number for display
  const formatPhoneForDisplay = (phone: string | null) => {
    if (!phone) return '';
    
    // Extract country code and number
    const match = phone.match(/^(\+\d{1,3})(.*)$/);
    if (!match) return phone;
    
    const [, countryCode, number] = match;
    
    // Format US/CA numbers
    if (countryCode === '+1' && number?.length === 10) {
      return `${countryCode} (${number.slice(0, 3)}) ${number.slice(3, 6)}-${number.slice(6)}`;
    }
    
    // Format Korean numbers
    if (countryCode === '+82') {
      if (number?.length === 10) {
        // Format as: +82 10-XXXX-XXXX
        return `${countryCode} ${number.slice(0, 2)}-${number.slice(2, 6)}-${number.slice(6)}`;
      } else if (number?.length === 11) {
        // Format as: +82 1XX-XXXX-XXXX
        return `${countryCode} ${number.slice(0, 3)}-${number.slice(3, 7)}-${number.slice(7)}`;
      }
    }
    
    // Format Japanese numbers
    if (countryCode === '+81' && number?.length >= 10) {
      // Format as: +81 XX-XXXX-XXXX
      return `${countryCode} ${number.slice(0, 2)}-${number.slice(2, 6)}-${number.slice(6)}`;
    }
    
    // For other countries, add space after country code
    return `${countryCode} ${number}`;
  };

  const handleCodeChange = (newCode: string) => {
    clearError();
    setCode(newCode);
  };

  const handleCodeComplete = async (completedCode: string) => {
    try {
      await verifyCode({ code: completedCode });
      
      // Haptic feedback on success
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      onSuccess();
    } catch (error) {
      // Error is handled by the store and displayed via error state
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setCode(''); // Clear the code on error
    }
  };

  const handleResendCode = async () => {
    try {
      clearError();
      await resendCode();
      
      // Haptic feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      Alert.alert('Code Sent', 'A new verification code has been sent to your phone.');
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleWrongNumber = () => {
    Alert.alert(
      'Change Phone Number?',
      'This will take you back to enter a different phone number.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Change Number', onPress: onBack },
      ]
    );
  };

  const canResend = resendCooldown === 0 && !isLoading && !isVerifying;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.icon, { color: theme.colors.primary }]}>
                📱
              </Text>
              <Text style={[styles.title, { color: theme.colors.text }]}>
                Check your texts
              </Text>
              <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                We sent a verification code to:
              </Text>
              <Text style={[styles.phoneNumber, { color: theme.colors.text }]}>
                {formatPhoneForDisplay(pendingPhone)}
              </Text>
            </View>

            {/* Verification Input */}
            <View style={styles.inputSection}>
              <VerificationInput
                value={code}
                onChangeText={handleCodeChange}
                onComplete={handleCodeComplete}
                error={error || undefined}
                disabled={isVerifying || isLoading}
                autoFocus
              />
            </View>

            {/* Resend Section */}
            <View style={styles.resendSection}>
              <Text style={[styles.resendText, { color: theme.colors.textSecondary }]}>
                Didn't get it?
              </Text>
              
              {canResend ? (
                <TouchableOpacity
                  onPress={handleResendCode}
                  style={styles.resendButton}
                >
                  <Text style={[styles.resendButtonText, { color: theme.colors.primary }]}>
                    Resend code
                  </Text>
                </TouchableOpacity>
              ) : (
                <Text style={[styles.cooldownText, { color: theme.colors.textSecondary }]}>
                  Resend in 0:{resendCooldown.toString().padStart(2, '0')}
                </Text>
              )}
            </View>

            {/* Alternative Options */}
            <View style={styles.alternativeSection}>
              <TouchableOpacity
                onPress={handleResendCode}
                disabled={!canResend}
                style={[
                  styles.alternativeButton,
                  !canResend && { opacity: 0.5 }
                ]}
              >
                <Text style={[styles.alternativeText, { color: theme.colors.textSecondary }]}>
                  Try voice call
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={handleWrongNumber}
                style={styles.alternativeButton}
                disabled={isVerifying || isLoading}
              >
                <Text style={[styles.alternativeText, { color: theme.colors.textSecondary }]}>
                  Wrong number?
                </Text>
              </TouchableOpacity>
            </View>

            {/* Manual Verify Button (fallback) - Reserved space to prevent layout shift */}
            <View style={styles.verifyButtonContainer}>
              {code.length === 6 && !isVerifying && (
                <Button
                  title="Verify Code"
                  onPress={() => handleCodeComplete(code)}
                  loading={isVerifying}
                  style={styles.verifyButton}
                />
              )}
            </View>

            {/* Back Button */}
            <View style={styles.backSection}>
              <TouchableOpacity
                onPress={onBack}
                style={styles.backButton}
                disabled={isVerifying || isLoading}
              >
                <Text style={[styles.backButtonText, { color: theme.colors.textSecondary }]}>
                  ← Back
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 22,
  },
  phoneNumber: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  inputSection: {
    marginBottom: 32,
  },
  resendSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  resendText: {
    fontSize: 14,
    marginBottom: 8,
  },
  resendButton: {
    padding: 8,
  },
  resendButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  cooldownText: {
    fontSize: 14,
    fontWeight: '500',
  },
  alternativeSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  alternativeButton: {
    padding: 12,
    marginVertical: 4,
  },
  alternativeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  verifyButtonContainer: {
    minHeight: 60, // Reserve space for button + margins to prevent layout shift
    marginTop: 16,
    justifyContent: 'center',
  },
  verifyButton: {
    // Remove marginTop since container handles spacing
  },
  backSection: {
    marginTop: 24,
  },
  backButton: {
    alignItems: 'center',
    padding: 16,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});