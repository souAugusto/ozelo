import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { OnboardingScreen } from '@/components/onboarding/OnboardingScreen';
import { PrimaryButton } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useOnboarding } from '@/context/OnboardingContext';
import { startCheckout } from '@/lib/stripe';
import { supabase } from '@/lib/supabase';
import { Typography } from '@/constants/theme';
import type { Symptom } from '@/types/database';

const ONBOARDING_SEEN_KEY = 'ozelo:onboarding-seen';
const KNOWN_SYMPTOMS: Symptom[] = ['nausea', 'fatigue', 'difficulty_eating'];

export default function CreateAccountStep() {
  const { answers } = useOnboarding();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = fullName.trim().length > 0 && email.includes('@') && password.length >= 6;

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: fullName.trim() } },
      });
      if (error) throw error;

      await AsyncStorage.setItem(ONBOARDING_SEEN_KEY, 'true');

      if (!data.session) {
        Alert.alert(
          'Confirme seu e-mail',
          'Enviamos um link de confirmação. Depois de confirmar, faça login pra continuar.'
        );
        router.replace('/(auth)/login');
        return;
      }

      await supabase
        .from('profiles')
        .update({
          medication: answers.medication,
          current_weight_kg: answers.currentWeight ? Number(answers.currentWeight) : null,
          goal_weight_kg: answers.goalWeight ? Number(answers.goalWeight) : null,
          onboarding_completed_at: new Date().toISOString(),
        })
        .eq('id', data.session.user.id);

      const symptomsToLog = answers.symptoms.filter((s): s is Symptom =>
        KNOWN_SYMPTOMS.includes(s as Symptom)
      );
      if (symptomsToLog.length > 0) {
        await supabase.from('symptom_logs').insert(
          symptomsToLog.map((symptom) => ({
            user_id: data.session!.user.id,
            symptom,
            intensity: 'mild' as const,
          }))
        );
      }

      await startCheckout(answers.selectedPlan);
    } catch (error) {
      Alert.alert('Não foi possível continuar', (error as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <OnboardingScreen>
      <View style={styles.header}>
        <Text style={Typography.title}>Crie sua conta</Text>
        <Text style={Typography.subtitle}>
          Pra salvar seu plano e liberar sua assinatura com segurança.
        </Text>
      </View>
      <View style={styles.form}>
        <Input label="Nome" value={fullName} onChangeText={setFullName} placeholder="Seu nome" />
        <Input
          label="E-mail"
          value={email}
          onChangeText={setEmail}
          placeholder="voce@email.com"
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <Input
          label="Senha"
          value={password}
          onChangeText={setPassword}
          placeholder="Mínimo 6 caracteres"
          secureTextEntry
        />
      </View>
      <PrimaryButton
        label="Continuar para o pagamento"
        disabled={!canSubmit}
        loading={submitting}
        onPress={handleSubmit}
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
