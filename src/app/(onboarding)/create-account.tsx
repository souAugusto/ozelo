import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { OnboardingScreen } from '@/components/onboarding/OnboardingScreen';
import { PrimaryButton } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useOnboarding } from '@/context/OnboardingContext';
import { showAlert } from '@/lib/alert';
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
      const symptomsToLog = answers.symptoms.filter((s): s is Symptom =>
        KNOWN_SYMPTOMS.includes(s as Symptom)
      );

      // Onboarding answers travel as user metadata: Supabase saves this the
      // instant the account is created, even before the email is confirmed
      // and a session exists — a DB trigger (handle_new_user) turns it into
      // the profile row and symptom logs.
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            medication: answers.medication,
            current_weight_kg: answers.currentWeight || null,
            goal_weight_kg: answers.goalWeight || null,
            symptoms: symptomsToLog,
          },
          emailRedirectTo: `${process.env.EXPO_PUBLIC_APP_URL}/confirm-callback`,
        },
      });
      if (error) throw error;

      await AsyncStorage.setItem(ONBOARDING_SEEN_KEY, 'true');

      if (!data.session) {
        router.replace({ pathname: '/(onboarding)/confirm-email', params: { email: email.trim() } });
        return;
      }

      await startCheckout(answers.selectedPlan);
    } catch (error) {
      showAlert('Não foi possível continuar', (error as Error).message);
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
