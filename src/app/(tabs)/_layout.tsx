import {
  IconChartLine,
  IconHome,
  IconStethoscope,
  IconToiletPaper,
  IconToolsKitchen2,
} from '@tabler/icons-react-native';
import { Redirect, Tabs } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '@/context/AuthProvider';
import { BorderWidth, Colors } from '@/constants/theme';

export default function TabsLayout() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={Colors.textPrimary} />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.accentMint,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: {
          backgroundColor: Colors.card,
          borderTopColor: Colors.cardBorder,
          borderTopWidth: BorderWidth.hairline,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Início', tabBarIcon: ({ color, size }) => <IconHome color={color} size={size} strokeWidth={1.75} /> }}
      />
      <Tabs.Screen
        name="nutrition"
        options={{ title: 'Diário', tabBarIcon: ({ color, size }) => <IconToolsKitchen2 color={color} size={size} strokeWidth={1.75} /> }}
      />
      <Tabs.Screen
        name="bowel"
        options={{ title: 'Intestino', tabBarIcon: ({ color, size }) => <IconToiletPaper color={color} size={size} strokeWidth={1.75} /> }}
      />
      <Tabs.Screen
        name="symptoms"
        options={{ title: 'Sintomas', tabBarIcon: ({ color, size }) => <IconStethoscope color={color} size={size} strokeWidth={1.75} /> }}
      />
      <Tabs.Screen
        name="progress"
        options={{ title: 'Progresso', tabBarIcon: ({ color, size }) => <IconChartLine color={color} size={size} strokeWidth={1.75} /> }}
      />
    </Tabs>
  );
}
