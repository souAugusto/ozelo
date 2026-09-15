import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { Colors } from '@/constants/theme';
import { AuthProvider } from '@/context/AuthProvider';
import { OnboardingProvider } from '@/context/OnboardingContext';

export default function RootLayout() {
  return (
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
        </Stack>
      </OnboardingProvider>
    </AuthProvider>
  );
}
