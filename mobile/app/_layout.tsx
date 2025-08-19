import { StatusBar } from "expo-status-bar";
import { Stack } from "expo-router";
import { AppProvider } from "@/containers";
import "react-native-reanimated";
import "@/lib/i18n";

export default function RootLayout() {
  return (
    <AppProvider>
      <Stack screenOptions={{ 
        headerShown: false,
        contentStyle: { backgroundColor: '#000000' },
        animation: 'slide_from_right', // Enable smooth iOS-style transitions
        gestureEnabled: true,
        animationDuration: 300, // Smooth but not slow
      }}>
        {/* Onboarding Flow */}
        <Stack.Screen 
          name="onboarding" 
          options={{
            gestureEnabled: false,
            animation: 'fade',
          }}
        />
        
        {/* Main App with Orbital Navigation */}
        <Stack.Screen 
          name="(main)" 
          options={{
            gestureEnabled: false,
          }}
        />
        
        {/* Modal Screens */}
        <Stack.Screen 
          name="meal-detail" 
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
        
        <Stack.Screen 
          name="ai-coach" 
          options={{
            presentation: 'modal',
            animation: 'slide_from_left',
          }}
        />
        
        <Stack.Screen 
          name="profile" 
          options={{
            presentation: 'modal',
          }}
        />
        
        <Stack.Screen 
          name="challenge-detail" 
          options={{
            presentation: 'modal',
          }}
        />
        
        {/* Settings Flow - Connected Navigation */}
        <Stack.Screen 
          name="settings" 
          options={{
            animation: 'slide_from_right',
            gestureEnabled: true,
          }}
        />
        
        <Stack.Screen 
          name="settings/account" 
          options={{
            animation: 'slide_from_right',
            gestureEnabled: true,
          }}
        />
        
        <Stack.Screen 
          name="settings/display" 
          options={{
            animation: 'slide_from_right',
            gestureEnabled: true,
          }}
        />
        
        <Stack.Screen 
          name="settings/notifications" 
          options={{
            animation: 'slide_from_right',
            gestureEnabled: true,
          }}
        />
        
        <Stack.Screen 
          name="settings/privacy" 
          options={{
            animation: 'slide_from_right',
            gestureEnabled: true,
          }}
        />
        
        <Stack.Screen 
          name="settings/goals" 
          options={{
            animation: 'slide_from_right',
            gestureEnabled: true,
          }}
        />
        
        <Stack.Screen 
          name="settings/data" 
          options={{
            animation: 'slide_from_right',
            gestureEnabled: true,
          }}
        />
      </Stack>
      <StatusBar style="light" />
    </AppProvider>
  );
}