import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/lib/theme';
import { PhoneAuthScreen } from './PhoneAuthScreen';
import { VerificationScreen } from './VerificationScreen';
import { useAuthStore } from '../stores/authStore';

interface AuthFlowProps {
  onComplete: () => void;
  onCancel?: () => void;
}

type AuthStep = 'phone' | 'verification';

export function AuthFlow({ onComplete, onCancel }: AuthFlowProps) {
  const { theme } = useTheme();
  const { clearPendingAuth } = useAuthStore();
  const [currentStep, setCurrentStep] = useState<AuthStep>('phone');

  const handlePhoneSuccess = () => {
    setCurrentStep('verification');
  };

  const handleVerificationSuccess = () => {
    onComplete();
  };

  const handleBackToPhone = () => {
    clearPendingAuth();
    setCurrentStep('phone');
  };

  const handleCancel = () => {
    clearPendingAuth();
    onCancel?.();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {currentStep === 'phone' && (
        <PhoneAuthScreen
          onSuccess={handlePhoneSuccess}
          onCancel={handleCancel}
        />
      )}
      
      {currentStep === 'verification' && (
        <VerificationScreen
          onSuccess={handleVerificationSuccess}
          onBack={handleBackToPhone}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});