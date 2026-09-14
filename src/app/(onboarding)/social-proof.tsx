import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { OnboardingScreen } from '@/components/onboarding/OnboardingScreen';
import { Card } from '@/components/ui/Card';
import { PrimaryButton } from '@/components/ui/Button';
import { Colors, Spacing, Typography } from '@/constants/theme';

export default function SocialProofStep() {
  return (
    <OnboardingScreen scrollable={false}>
      <View style={styles.center}>
        <Text style={styles.stat}>73%</Text>
        <Text style={styles.statCaption}>
          das pessoas que usam GLP-1 relatam mudança no hábito intestinal durante o tratamento
        </Text>
        <Card style={styles.quoteCard}>
          <Text style={styles.quote}>
            “Achei que era só comigo. Ver que é esperado — e conseguir acompanhar os padrões — me
            deixou muito mais tranquila.”
          </Text>
          <Text style={styles.quoteAuthor}>Usuária Ozelo, 3º mês de tratamento</Text>
        </Card>
      </View>
      <PrimaryButton label="Continuar" onPress={() => router.push('/(onboarding)/showcase-photos')} />
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
  },
  stat: {
    fontFamily: Typography.display.fontFamily,
    fontSize: 64,
    fontWeight: '700',
    color: Colors.accentMint,
  },
  statCaption: {
    ...Typography.subtitle,
    textAlign: 'center',
    paddingHorizontal: Spacing.md,
  },
  quoteCard: {
    gap: Spacing.sm,
  },
  quote: {
    ...Typography.body,
    fontStyle: 'italic',
  },
  quoteAuthor: {
    ...Typography.caption,
  },
});
