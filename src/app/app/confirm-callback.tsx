import { router } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/context/AuthProvider';
import { Colors, Spacing, Typography } from '@/constants/theme';

/**
 * Landing page for the "Confirm signup" email link (emailRedirectTo).
 * On web, supabase-js picks the session up from the URL automatically;
 * once AuthProvider reflects it, hand off to "/app" to route to the
 * paywall or the app depending on subscription status.
 */
export default function ConfirmCallbackScreen() {
  const { session, loading } = useAuth();

  useEffect(() => {
    if (!loading && session) {
      router.replace('/app');
    }
  }, [loading, session]);

  return (
    <View style={styles.container}>
      <ActivityIndicator color={Colors.textPrimary} />
      <Text style={[Typography.subtitle, styles.text]}>Confirmando sua conta...</Text>
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
  },
  text: {
    textAlign: 'center',
  },
});
