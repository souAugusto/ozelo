import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthProvider';

const ONBOARDING_SEEN_KEY = 'ozelo:onboarding-seen';

export default function Index() {
  const { session, profile, hasActiveAccess, loading } = useAuth();
  const [onboardingSeen, setOnboardingSeen] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_SEEN_KEY).then((value) => setOnboardingSeen(value === 'true'));
  }, []);

  if (loading || onboardingSeen === null) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={Colors.textPrimary} />
      </View>
    );
  }

  if (session) {
    // Active access (paid or via promo code) always wins — someone who
    // already unlocked the app shouldn't get bounced back into onboarding
    // over a data quirk like a profile row missing onboarding_completed_at.
    if (hasActiveAccess) {
      return <Redirect href="/(tabs)" />;
    }
    if (!profile?.onboarding_completed_at) {
      return <Redirect href="/(onboarding)/welcome" />;
    }
    // Account confirmed and onboarding data saved, but no active
    // subscription yet — send them back to finish the payment they
    // started before confirming their e-mail.
    return <Redirect href="/(onboarding)/paywall" />;
  }

  return <Redirect href={onboardingSeen ? '/(auth)/login' : '/(onboarding)/welcome'} />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
