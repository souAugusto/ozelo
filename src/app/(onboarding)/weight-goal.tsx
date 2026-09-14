import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { OnboardingScreen } from '@/components/onboarding/OnboardingScreen';
import { PrimaryButton } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useOnboarding } from '@/context/OnboardingContext';
import { Typography } from '@/constants/theme';

export default function WeightGoalStep() {
  const { answers, update } = useOnboarding();
  const canContinue = answers.currentWeight.length > 0 && answers.goalWeight.length > 0;

  return (
    <OnboardingScreen step={4}>
      <View style={styles.header}>
        <Text style={Typography.title}>Qual sua meta de peso?</Text>
        <Text style={Typography.subtitle}>
          Vamos usar isso pra acompanhar sua evolução ao longo do tratamento.
        </Text>
      </View>
      <View style={styles.form}>
        <Input
          label="Peso atual (kg)"
          keyboardType="decimal-pad"
          value={answers.currentWeight}
          onChangeText={(value) => update('currentWeight', value)}
          placeholder="Ex: 92"
        />
        <Input
          label="Meta de peso (kg)"
          keyboardType="decimal-pad"
          value={answers.goalWeight}
          onChangeText={(value) => update('goalWeight', value)}
          placeholder="Ex: 78"
        />
      </View>
      <PrimaryButton
        label="Continuar"
        disabled={!canContinue}
        onPress={() => router.push('/(onboarding)/social-proof')}
      />
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 8,
  },
  form: {
    gap: 16,
    flex: 1,
  },
});
