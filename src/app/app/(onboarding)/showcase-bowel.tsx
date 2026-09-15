import { IconCircleCheck } from '@tabler/icons-react-native';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { LineChart } from '@/components/charts/LineChart';
import { OnboardingScreen } from '@/components/onboarding/OnboardingScreen';
import { Card } from '@/components/ui/Card';
import { PrimaryButton } from '@/components/ui/Button';
import { Colors, IconSize, Radius, Spacing, Typography } from '@/constants/theme';

const INTERVALS = [
  { label: 'Sem 1', value: 1 },
  { label: 'Sem 2', value: 2 },
  { label: 'Sem 3', value: 1.5 },
  { label: 'Sem 4', value: 2.5 },
  { label: 'Sem 5', value: 2 },
  { label: 'Sem 6', value: 1.5 },
];

export default function ShowcaseBowelStep() {
  return (
    <OnboardingScreen>
      <View style={styles.header}>
        <Text style={Typography.title}>Identifique padrões no seu hábito intestinal</Text>
        <Text style={Typography.subtitle}>
          Acompanhe o intervalo em dias entre seus registros ao longo das semanas.
        </Text>
      </View>
      <Card>
        <LineChart data={INTERVALS} />
      </Card>
      <View style={styles.badge}>
        <IconCircleCheck size={IconSize.md} color={Colors.accentMint} strokeWidth={1.75} />
        <Text style={styles.badgeLabel}>Dentro do padrão esperado pra você</Text>
      </View>
      <PrimaryButton label="Continuar" onPress={() => router.push('/app/(onboarding)/personalizing')} />
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    alignSelf: 'flex-start',
    backgroundColor: `${Colors.accentMint}1F`,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  badgeLabel: {
    ...Typography.bodySecondary,
    color: Colors.accentMint,
    fontWeight: '600',
  },
});
