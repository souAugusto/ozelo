import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { OnboardingScreen } from '@/components/onboarding/OnboardingScreen';
import { PrimaryButton } from '@/components/ui/Button';
import { WeightSlider } from '@/components/ui/WeightSlider';
import { useOnboarding } from '@/context/OnboardingContext';
import { Typography } from '@/constants/theme';

export default function WeightGoalStep() {
  const { answers, update } = useOnboarding();

  return (
    <OnboardingScreen step={4}>
      <View style={styles.header}>
        <Text style={Typography.title}>Qual sua meta de peso?</Text>
        <Text style={Typography.subtitle}>
          Vamos usar isso pra acompanhar sua evolução ao longo do tratamento.
        </Text>
      </View>
      <View style={styles.form}>
        <WeightSlider
          label="Peso atual"
          value={Number(answers.currentWeight)}
          onChange={(value) => update('currentWeight', String(value))}
        />
        <WeightSlider
          label="Meta de peso"
          value={Number(answers.goalWeight)}
          onChange={(value) => update('goalWeight', String(value))}
        />
      </View>
      <PrimaryButton label="Continuar" onPress={() => router.push('/(onboarding)/social-proof')} />
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 8,
  },
  form: {
    gap: 32,
    flex: 1,
  },
});
