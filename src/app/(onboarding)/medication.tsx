import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { OnboardingScreen } from '@/components/onboarding/OnboardingScreen';
import { PrimaryButton } from '@/components/ui/Button';
import { SelectOption } from '@/components/ui/SelectOption';
import { useOnboarding } from '@/context/OnboardingContext';
import { Typography } from '@/constants/theme';
import type { Medication } from '@/types/database';

const OPTIONS: { value: Medication; label: string }[] = [
  { value: 'ozempic', label: 'Ozempic' },
  { value: 'mounjaro', label: 'Mounjaro' },
  { value: 'wegovy', label: 'Wegovy' },
  { value: 'other', label: 'Outro' },
];

export default function MedicationStep() {
  const { answers, update } = useOnboarding();

  return (
    <OnboardingScreen step={1}>
      <View style={styles.header}>
        <Text style={Typography.title}>Qual medicamento você usa?</Text>
        <Text style={Typography.subtitle}>Vamos adaptar seus lembretes e metas pra ele.</Text>
      </View>
      <View style={styles.options}>
        {OPTIONS.map((option) => (
          <SelectOption
            key={option.value}
            label={option.label}
            selected={answers.medication === option.value}
            onPress={() => update('medication', option.value)}
          />
        ))}
      </View>
      <PrimaryButton
        label="Continuar"
        disabled={!answers.medication}
        onPress={() => router.push('/(onboarding)/symptoms')}
      />
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
