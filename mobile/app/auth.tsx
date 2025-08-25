import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/domains/auth/stores/authStore';
import { AuthFlow } from '@/domains/auth';
import { useEffect } from 'react';

export default function AuthScreen() {
  try {
    const { user } = useAuthStore();
    const isAuthenticated = !!user?.isLoggedIn;
    
    useEffect(() => {
      // If user is already authenticated, redirect to main app
      if (isAuthenticated) {
        router.replace('/(main)');
      }
    }, [isAuthenticated]);

    const handleAuthComplete = () => {
      router.replace('/(main)');
    };

    const handleAuthCancel = () => {
      router.replace('/(main)');
    };

    return (
      <View style={styles.container}>
        <AuthFlow 
          onComplete={handleAuthComplete}
          onCancel={handleAuthCancel}
        />
      </View>
    );
  } catch (error) {
    // If AuthProvider is not available, redirect to main
    useEffect(() => {
      router.replace('/(main)');
    }, []);
    
    return <View style={styles.container} />;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});