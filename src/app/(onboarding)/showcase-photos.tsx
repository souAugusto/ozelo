import { IconBellRinging, IconLock, IconUserCircle } from '@tabler/icons-react-native';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { PrimaryButton, SecondaryButton } from '@/components/ui/Button';
import { OnboardingScreen } from '@/components/onboarding/OnboardingScreen';
import { Colors, IconSize, Spacing, Typography } from '@/constants/theme';

const BENEFITS = [
  { icon: IconLock, label: 'Fotos privadas, visíveis só pra você' },
  { icon: IconBellRinging, label: 'Lembrete semanal pra registrar' },
];

export default function ShowcasePhotosStep() {
  const goNext = () => router.push('/(onboarding)/showcase-nutrition');

  return (
    <OnboardingScreen>
      <View style={styles.header}>
        <Text style={Typography.title}>Veja sua evolução, não só o número da balança</Text>
      </View>

      <Card>
        <View style={styles.comparisonRow}>
          <View style={styles.comparisonItem}>
            <View style={styles.placeholder}>
              <IconUserCircle size={40} color={Colors.textMuted} strokeWidth={1.5} />
            </View>
            <Text style={styles.weekLabel}>Semana 1</Text>
          </View>
          <View style={styles.comparisonItem}>
            <View style={styles.placeholder}>
              <IconUserCircle size={40} color={Colors.textMuted} strokeWidth={1.5} />
            </View>
            <Text style={styles.weekLabel}>Semana 8</Text>
          </View>
        </View>
        <Text style={styles.caption}>Exemplo ilustrativo</Text>
      </Card>

      <View style={styles.benefits}>
        {BENEFITS.map((benefit) => (
          <View key={benefit.label} style={styles.benefitRow}>
            <benefit.icon size={IconSize.md} color={Colors.accentMint} strokeWidth={1.75} />
            <Text style={styles.benefitLabel}>{benefit.label}</Text>
          </View>
        ))}
      </View>

      <Card style={styles.ctaCard}>
        <Text style={styles.ctaTitle}>Pronto pra começar?</Text>
        <PrimaryButton label="Quero ver minha evolução" onPress={goNext} />
        <SecondaryButton label="Prefiro decidir depois" onPress={goNext} />
      </Card>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 8,
  },
  comparisonRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  comparisonItem: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  placeholder: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: Colors.cardElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekLabel: {
    ...Typography.bodySecondary,
  },
  caption: {
    ...Typography.caption,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  benefits: {
    gap: Spacing.sm,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  benefitLabel: {
    ...Typography.body,
  },
  ctaCard: {
    gap: Spacing.sm,
  },
  ctaTitle: {
    ...Typography.subtitle,
    color: Colors.textPrimary,
    fontWeight: '700',
  },
});
