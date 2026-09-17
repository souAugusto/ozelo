import {
  IconCheck,
  IconDeviceMobile,
  IconDotsVertical,
  IconShare2,
  IconSquarePlus,
} from '@tabler/icons-react-native';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton, SecondaryButton } from '@/components/ui/Button';
import { Card, GradientCard } from '@/components/ui/Card';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useInstallPromptEvent } from '@/hooks/useInstallPromptEvent';
import { detectOs, useStandalone } from '@/hooks/useStandalone';
import { BorderWidth, Colors, IconSize, Radius, Spacing, Typography } from '@/constants/theme';

const ANDROID_STEPS = [
  { icon: IconDotsVertical, text: 'Toque no menu (⋮) no canto superior do navegador Chrome.' },
  { icon: IconSquarePlus, text: 'Toque em "Adicionar à tela inicial" (ou "Instalar app").' },
  { icon: IconCheck, text: 'Confirme — o ícone do Ozelo aparece na sua tela inicial.' },
];

const IOS_STEPS = [
  { icon: IconShare2, text: 'Toque no ícone de compartilhar (□↑) na barra do Safari.' },
  { icon: IconSquarePlus, text: 'Role e toque em "Adicionar à Tela de Início".' },
  { icon: IconCheck, text: 'Confirme — o ícone do Ozelo aparece na sua tela inicial.' },
];

export default function InstallAppScreen() {
  const standalone = useStandalone();
  const os = detectOs();
  const { canPromptInstall, promptInstall } = useInstallPromptEvent();

  useEffect(() => {
    if (standalone) {
      // Already installed — this step has nothing left to do.
      const timer = setTimeout(() => router.replace('/app/enable-notifications'), 800);
      return () => clearTimeout(timer);
    }
  }, [standalone]);

  const steps = os === 'ios' ? IOS_STEPS : ANDROID_STEPS;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScreenHeader title="Instalar o Ozelo" />
      <ScrollView contentContainerStyle={styles.content}>
        {standalone ? (
          <GradientCard>
            <View style={styles.doneRow}>
              <IconCheck size={IconSize.lg} color="#FFFFFF" strokeWidth={2} />
              <Text style={styles.doneText}>App instalado! Redirecionando...</Text>
            </View>
          </GradientCard>
        ) : (
          <>
            <View style={styles.header}>
              <IconDeviceMobile size={32} color={Colors.accentMint} strokeWidth={1.5} />
              <Text style={Typography.title}>Instale pra receber lembretes</Text>
              <Text style={Typography.subtitle}>
                Para receber lembretes de aplicação e hidratação, instale o Ozelo no seu celular.
                É rápido e não ocupa espaço de app na loja.
              </Text>
            </View>

            {os !== 'ios' && canPromptInstall && (
              <PrimaryButton label="Instalar agora" onPress={promptInstall} />
            )}

            <View style={styles.steps}>
              {steps.map((step, index) => (
                <Card key={index} style={styles.stepCard}>
                  <View style={styles.stepIconWrap}>
                    <step.icon size={IconSize.lg} color={Colors.accentMint} strokeWidth={1.75} />
                  </View>
                  <View style={styles.stepTextWrap}>
                    <Text style={styles.stepNumber}>Passo {index + 1}</Text>
                    <Text style={styles.stepText}>{step.text}</Text>
                  </View>
                </Card>
              ))}
            </View>

            <SecondaryButton label="Já instalei" onPress={() => router.replace('/app/enable-notifications')} />
            <View style={styles.laterWrap}>
              <Text style={styles.laterText} onPress={() => router.replace('/app')}>
                Prefiro fazer isso depois
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  header: {
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  doneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    justifyContent: 'center',
  },
  doneText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  steps: {
    gap: Spacing.sm,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  stepIconWrap: {
    width: 44,
    height: 44,
    borderRadius: Radius.sm,
    backgroundColor: `${Colors.accentMint}1F`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepTextWrap: {
    flex: 1,
    gap: 2,
  },
  stepNumber: {
    ...Typography.label,
  },
  stepText: {
    ...Typography.body,
  },
  laterWrap: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  laterText: {
    ...Typography.bodySecondary,
    textDecorationLine: 'underline',
  },
});
