import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { OnboardingScreen } from '@/components/onboarding/OnboardingScreen';
import { PrimaryButton } from '@/components/ui/Button';
import { SelectOption } from '@/components/ui/SelectOption';
import { useOnboarding } from '@/context/OnboardingContext';
import { Typography } from '@/constants/theme';

const OPTIONS = [
  { value: 'nausea', label: 'Náusea' },
  { value: 'bowel_change', label: 'Mudança no hábito intestinal' },
  { value: 'fatigue', label: 'Fadiga' },
  { value: 'difficulty_eating', label: 'Dificuldade pra comer o suficiente' },
];

export default function SymptomsStep() {
  const { answers, toggleSymptom } = useOnboarding();

  return (
    <OnboardingScreen step={2}>
      <View style={styles.header}>
        <Text style={Typography.title}>Você já notou algum desses sintomas?</Text>
        <Text style={Typography.subtitle}>Selecione todos que fizerem sentido pra você.</Text>
      </View>
      <View style={styles.options}>
        {OPTIONS.map((option) => (
          <SelectOption
            key={option.value}
            variant="checkbox"
            label={option.label}
            selected={answers.symptoms.includes(option.value)}
            onPress={() => toggleSymptom(option.value)}
          />
        ))}
      </View>
      <PrimaryButton label="Continuar" onPress={() => router.push('/app/(onboarding)/bowel-habit')} />
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 8,
  },
  options: {
    gap: 12,
    flex: 1,
  },
});
