import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { BarChart } from '@/components/charts/BarChart';
import { OnboardingScreen } from '@/components/onboarding/OnboardingScreen';
import { Card } from '@/components/ui/Card';
import { PrimaryButton } from '@/components/ui/Button';
import { Colors, Typography } from '@/constants/theme';

const WEEK_PROTEIN = [
  { label: 'Seg', value: 62 },
  { label: 'Ter', value: 78 },
  { label: 'Qua', value: 55 },
  { label: 'Qui', value: 84 },
  { label: 'Sex', value: 91 },
  { label: 'Sáb', value: 70 },
  { label: 'Dom', value: 88 },
];

const PROTEIN_GOAL = 90;

export default function ShowcaseNutritionStep() {
  return (
    <OnboardingScreen>
      <View style={styles.header}>
        <Text style={Typography.title}>Coma o suficiente, mesmo com pouco apetite</Text>
        <Text style={Typography.subtitle}>
          Acompanhe sua proteína diária e veja se está dentro da sua meta.
        </Text>
      </View>
      <Card>
        <BarChart data={WEEK_PROTEIN} goal={PROTEIN_GOAL} />
        <Text style={styles.legend}>Linha tracejada = sua meta diária de proteína</Text>
      </Card>
      <PrimaryButton label="Continuar" onPress={() => router.push('/(onboarding)/showcase-bowel')} />
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 8,
  },
  legend: {
    ...Typography.caption,
    textAlign: 'center',
    marginTop: 8,
    color: Colors.textMuted,
  },
});
