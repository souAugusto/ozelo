import { IconVaccine } from '@tabler/icons-react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GradientIconTile } from '@/components/ui/Avatar';
import { PrimaryButton } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { supabase } from '@/lib/supabase';
import { Colors, Spacing, Typography } from '@/constants/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleLogin() {
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Não foi possível entrar', (error as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <View style={styles.header}>
          <GradientIconTile size={52}>
            <IconVaccine size={26} color="#FFFFFF" strokeWidth={1.75} />
          </GradientIconTile>
          <Text style={Typography.title}>Bem-vindo de volta</Text>
        </View>

        <View style={styles.form}>
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
            placeholder="Sua senha"
            secureTextEntry
          />
        </View>

        <PrimaryButton
          label="Entrar"
          loading={submitting}
          disabled={!email || !password}
          onPress={handleLogin}
        />

        <Pressable onPress={() => router.push('/(onboarding)/welcome')} style={styles.createAccount}>
          <Text style={styles.createAccountLabel}>
            Não tem conta? <Text style={styles.createAccountLink}>Criar agora</Text>
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.lg,
  },
  header: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  form: {
    gap: Spacing.md,
  },
  createAccount: {
    alignItems: 'center',
  },
  createAccountLabel: {
    ...Typography.bodySecondary,
  },
  createAccountLink: {
    color: Colors.accentMint,
    fontWeight: '600',
  },
});
