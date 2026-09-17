import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { InstallPrompt } from '@/components/pwa/InstallPrompt';
import { Colors } from '@/constants/theme';
import { AuthProvider } from '@/context/AuthProvider';
import { OnboardingProvider } from '@/context/OnboardingContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <OnboardingProvider>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: Colors.background },
            }}
          >
            <Stack.Screen name="app/profile" options={{ presentation: 'card' }} />
            <Stack.Screen name="app/photos" options={{ presentation: 'card' }} />
            <Stack.Screen name="app/calendar" options={{ presentation: 'card' }} />
            <Stack.Screen name="app/insights" options={{ presentation: 'card' }} />
            <Stack.Screen name="app/install-app" options={{ presentation: 'card' }} />
            <Stack.Screen name="app/enable-notifications" options={{ presentation: 'card' }} />
            <Stack.Screen name="app/medication" options={{ presentation: 'card' }} />
          </Stack>
          <InstallPrompt />
        </OnboardingProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
