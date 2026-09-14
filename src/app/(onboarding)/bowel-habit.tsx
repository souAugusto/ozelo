import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { OnboardingScreen } from '@/components/onboarding/OnboardingScreen';
import { Card } from '@/components/ui/Card';
import { PrimaryButton } from '@/components/ui/Button';
import { SelectOption } from '@/components/ui/SelectOption';
import { useOnboarding } from '@/context/OnboardingContext';
import { Colors, Typography } from '@/constants/theme';

const OPTIONS = [
  { value: 'daily', label: 'Todos os dias' },
  { value: 'every_other_day', label: 'A cada 2 dias' },
  { value: 'few_times_week', label: 'Algumas vezes por semana' },
  { value: 'less_often', label: 'Menos que isso' },
];

export default function BowelHabitStep() {
  const { answers, update } = useOnboarding();

  return (
    <OnboardingScreen step={3}>
      <View style={styles.header}>
        <Text style={Typography.title}>Com que frequência você vai ao banheiro?</Text>
      </View>
      <Card>
        <Text style={styles.normalizer}>
          Muita gente que usa GLP-1 nota mudança nesse hábito. É normal — vamos te ajudar a
          acompanhar e identificar padrões.
        </Text>
      </Card>
      <View style={styles.options}>
        {OPTIONS.map((option) => (
          <SelectOption
            key={option.value}
            label={option.label}
            selected={answers.bowelFrequency === option.value}
            onPress={() => update('bowelFrequency', option.value)}
          />
        ))}
      </View>
      <PrimaryButton
        label="Continuar"
        disabled={!answers.bowelFrequency}
        onPress={() => router.push('/(onboarding)/weight-goal')}
      />
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 8,
  },
  normalizer: {
    ...Typography.bodySecondary,
    color: Colors.textSecondary,
  },
  options: {
    gap: 12,
    flex: 1,
  },
});
