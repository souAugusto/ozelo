import { IconMailCheck } from '@tabler/icons-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { OnboardingScreen } from '@/components/onboarding/OnboardingScreen';
import { GradientIconTile } from '@/components/ui/Avatar';
import { PrimaryButton, SecondaryButton } from '@/components/ui/Button';
import { showAlert } from '@/lib/alert';
import { supabase } from '@/lib/supabase';
import { Colors, Spacing, Typography } from '@/constants/theme';

export default function ConfirmEmailStep() {
  const { email } = useLocalSearchParams<{ email?: string }>();
  const [resending, setResending] = useState(false);

  async function handleResend() {
    if (!email) return;
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email });
      if (error) throw error;
      showAlert('Enviado', 'Reenviamos o link de confirmação pro seu e-mail.');
    } catch (error) {
      showAlert('Não foi possível reenviar', (error as Error).message);
    } finally {
      setResending(false);
    }
  }

  return (
    <OnboardingScreen scrollable={false}>
      <View style={styles.center}>
        <GradientIconTile>
          <IconMailCheck size={30} color="#FFFFFF" strokeWidth={1.75} />
        </GradientIconTile>
        <Text style={[Typography.title, styles.title]}>Confirme seu e-mail</Text>
        <Text style={[Typography.subtitle, styles.subtitle]}>
          Enviamos um link de confirmação {email ? `pra ${email}` : 'pro seu e-mail'}. Assim que
          confirmar, volte aqui e entre pra finalizar sua assinatura.
        </Text>
      </View>
      <View style={styles.actions}>
        <PrimaryButton label="Já confirmei, entrar" onPress={() => router.replace('/(auth)/login')} />
        <SecondaryButton label="Reenviar e-mail" loading={resending} onPress={handleResend} />
      </View>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    color: Colors.textSecondary,
  },
  actions: {
    gap: Spacing.sm,
  },
});
