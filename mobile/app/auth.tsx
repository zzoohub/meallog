import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuth, AuthFlow } from '@/domains/auth';
import { useEffect } from 'react';

export default function AuthScreen() {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    // If user is already authenticated, redirect to main app
    if (isAuthenticated) {
      router.replace('/(main)');
    }
  }, [isAuthenticated]);

  const handleAuthComplete = () => {
    router.replace('/(main)');
  };

  return (
    <View style={styles.container}>
      <AuthFlow 
        onComplete={handleAuthComplete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});