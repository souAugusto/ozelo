import { IconVaccine } from '@tabler/icons-react-native';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { OnboardingScreen } from '@/components/onboarding/OnboardingScreen';
import { GradientIconTile } from '@/components/ui/Avatar';
import { PrimaryButton } from '@/components/ui/Button';
import { Colors, Spacing, Typography } from '@/constants/theme';

export default function WelcomeScreen() {
  return (
    <OnboardingScreen scrollable={false}>
      <View style={styles.center}>
        <GradientIconTile>
          <IconVaccine size={30} color="#FFFFFF" strokeWidth={1.75} />
        </GradientIconTile>
        <Text style={[Typography.title, styles.title]}>
          Acompanhamento feito pra quem usa GLP-1
        </Text>
        <Text style={[Typography.subtitle, styles.subtitle]}>
          Medicação, alimentação, sintomas e progresso, tudo em um só lugar —
          pensado pra quem usa Ozempic, Mounjaro ou Wegovy.
        </Text>
      </View>
      <View style={styles.actions}>
        <PrimaryButton label="Começar" onPress={() => router.push('/(onboarding)/medication')} />
        <Pressable onPress={() => router.push('/(auth)/login')} style={styles.loginLink}>
          <Text style={styles.loginLinkLabel}>
            Já tem conta? <Text style={styles.loginLinkHighlight}>Entrar</Text>
          </Text>
        </Pressable>
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
    gap: Spacing.md,
  },
  loginLink: {
    alignItems: 'center',
  },
  loginLinkLabel: {
    ...Typography.bodySecondary,
  },
  loginLinkHighlight: {
    color: Colors.accentMint,
    fontWeight: '600',
  },
});
