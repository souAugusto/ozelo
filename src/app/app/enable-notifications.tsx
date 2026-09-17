import { IconBellRinging } from '@tabler/icons-react-native';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GradientIconTile } from '@/components/ui/Avatar';
import { PrimaryButton, SecondaryButton } from '@/components/ui/Button';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useAuth } from '@/context/AuthProvider';
import { useStandalone } from '@/hooks/useStandalone';
import { showAlert } from '@/lib/alert';
import { requestNotificationPermissionAndSubscribe } from '@/lib/pushNotifications';
import { Colors, Spacing, Typography } from '@/constants/theme';

/**
 * Shown right after install, and reachable again from Profile. Requesting
 * Notification.requestPermission() with no context tends to get an instant
 * "block", and a denied browser prompt can't be re-triggered programmatically
 * — so this screen exists to ask in our own words first.
 */
export default function EnableNotificationsScreen() {
  const { session, refreshProfile } = useAuth();
  const standalone = useStandalone();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!standalone) {
      router.replace('/app/install-app');
    }
  }, [standalone]);

  async function handleEnable() {
    if (!session) return;
    setSubmitting(true);
    try {
      const outcome = await requestNotificationPermissionAndSubscribe(session.user.id);
      await refreshProfile();
      if (outcome === 'granted') {
        router.replace('/app');
      } else {
        showAlert(
          'Sem problemas',
          'Você pode ativar os lembretes depois, em Perfil, ou nas configurações de notificação do navegador.'
        );
        router.replace('/app');
      }
    } catch (error) {
      showAlert('Não foi possível ativar', (error as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSkip() {
    router.replace('/app');
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScreenHeader title="Lembretes" />
      <View style={styles.content}>
        <View style={styles.center}>
          <GradientIconTile>
            <IconBellRinging size={30} color="#FFFFFF" strokeWidth={1.75} />
          </GradientIconTile>
          <Text style={[Typography.title, styles.title]}>
            Podemos te avisar na hora certa da sua aplicação e da hidratação?
          </Text>
          <Text style={[Typography.subtitle, styles.subtitle]}>
            Você pode mudar de ideia quando quiser, em Perfil → Preferências.
          </Text>
        </View>
        <View style={styles.actions}>
          <PrimaryButton label="Ativar lembretes" loading={submitting} onPress={handleEnable} />
          <SecondaryButton label="Agora não" onPress={handleSkip} />
        </View>
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
    padding: Spacing.lg,
    justifyContent: 'space-between',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
  },
  actions: {
    gap: Spacing.sm,
  },
});
