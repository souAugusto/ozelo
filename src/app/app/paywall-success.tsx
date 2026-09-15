import { IconCircleCheckFilled } from '@tabler/icons-react-native';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/context/AuthProvider';
import { Colors, Spacing, Typography } from '@/constants/theme';

/** Landing page after a successful Stripe Checkout redirect. */
export default function PaywallSuccessScreen() {
  const { refreshProfile } = useAuth();

  useEffect(() => {
    refreshProfile();
    const timer = setTimeout(() => router.replace('/app/(tabs)'), 1800);
    return () => clearTimeout(timer);
  }, [refreshProfile]);

  return (
    <View style={styles.container}>
      <IconCircleCheckFilled size={56} color={Colors.accentMint} />
      <Text style={Typography.title}>Assinatura confirmada</Text>
      <Text style={[Typography.subtitle, styles.subtitle]}>Preparando seu painel...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  subtitle: {
    textAlign: 'center',
  },
});
