import { IconBellRinging, IconClock, IconCrown, IconFileExport, IconLock, IconScale, IconStethoscope } from '@tabler/icons-react-native';
import { router } from 'expo-router';
import { ScrollView, Share, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/Avatar';
import { PrimaryButton, TextDangerButton } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useAuth } from '@/context/AuthProvider';
import { useStandalone } from '@/hooks/useStandalone';
import { showAlert } from '@/lib/alert';
import { openBillingPortal } from '@/lib/stripe';
import { supabase } from '@/lib/supabase';
import { Colors, IconSize, Spacing, Typography } from '@/constants/theme';

const NOTIFICATION_STATUS_LABEL: Record<string, string> = {
  granted: 'Ativados',
  denied: 'Bloqueados no navegador',
  not_requested: 'Não configurados',
};

const STATUS_LABEL: Record<string, string> = {
  active: 'Ativa',
  trialing: 'Em teste',
  past_due: 'Pagamento pendente',
  canceled: 'Cancelada',
  incomplete: 'Incompleta',
  unpaid: 'Inadimplente',
};

function initialsFor(name: string | null) {
  if (!name) return '·';
  const parts = name.trim().split(' ');
  return (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '');
}

function monthsSince(dateIso: string | null) {
  if (!dateIso) return 0;
  const diffMs = Date.now() - new Date(dateIso).getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30)));
}

export default function ProfileScreen() {
  const { profile, subscription, session, signOut, refreshProfile } = useAuth();
  const standalone = useStandalone();

  async function togglePrivacy(value: boolean) {
    if (!session) return;
    await supabase.from('profiles').update({ sensitive_data_private: value }).eq('id', session.user.id);
    refreshProfile();
  }

  async function toggleWaterReminder(value: boolean) {
    if (!session) return;
    await supabase.from('profiles').update({ water_reminder_enabled: value }).eq('id', session.user.id);
    refreshProfile();
  }

  async function toggleDiaryReminder(value: boolean) {
    if (!session) return;
    await supabase.from('profiles').update({ diary_reminder_enabled: value }).eq('id', session.user.id);
    refreshProfile();
  }

  async function handleManageSubscription() {
    try {
      await openBillingPortal();
    } catch (error) {
      showAlert('Não foi possível abrir o portal', (error as Error).message);
    }
  }

  async function handleExportData() {
    if (!session) return;
    try {
      const [{ data: meals }, { data: bowel }, { data: symptoms }, { data: measurements }] = await Promise.all([
        supabase.from('meals').select('*').eq('user_id', session.user.id),
        supabase.from('bowel_logs').select('*').eq('user_id', session.user.id),
        supabase.from('symptom_logs').select('*').eq('user_id', session.user.id),
        supabase.from('body_measurements').select('*').eq('user_id', session.user.id),
      ]);
      await Share.share({
        title: 'Meus dados Ozelo',
        message: JSON.stringify({ profile, meals, bowel, symptoms, measurements }, null, 2),
      });
    } catch (error) {
      showAlert('Não foi possível exportar', (error as Error).message);
    }
  }

  async function handleSignOut() {
    await signOut();
    router.replace('/app/(auth)/login');
  }

  const treatmentMonths = monthsSince(profile?.treatment_started_at ?? null);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScreenHeader title="Perfil" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Avatar initials={initialsFor(profile?.full_name ?? null)} size={64} />
          <Text style={Typography.title}>{profile?.full_name ?? 'Sem nome'}</Text>
          <Text style={Typography.subtitle}>{treatmentMonths} meses de tratamento</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconStethoscope size={IconSize.md} color={Colors.accentMint} strokeWidth={1.75} />
            <Text style={Typography.label}>Medicação</Text>
          </View>
          <Card style={styles.sectionCard}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Medicamento</Text>
              <Text style={styles.rowValue}>{profile?.medication ?? '—'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Dose</Text>
              <Text style={styles.rowValue}>{profile?.medication_dose ?? '—'}</Text>
            </View>
            <View style={styles.row}>
              <View style={styles.rowLabelWithIcon}>
                <IconClock size={IconSize.sm} color={Colors.textSecondary} strokeWidth={1.75} />
                <Text style={styles.rowLabel}>Horário do lembrete</Text>
              </View>
              <Text style={styles.rowValue}>{profile?.reminder_time?.slice(0, 5) ?? '—'}</Text>
            </View>
          </Card>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconBellRinging size={IconSize.md} color={Colors.accentCoral} strokeWidth={1.75} />
            <Text style={Typography.label}>Notificações</Text>
          </View>
          <Card style={styles.sectionCard}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Status</Text>
              <Text style={styles.rowValue}>
                {!standalone
                  ? 'App não instalado'
                  : NOTIFICATION_STATUS_LABEL[profile?.notification_permission ?? 'not_requested']}
              </Text>
            </View>

            {!standalone && (
              <PrimaryButton label="Instalar app" onPress={() => router.push('/app/install-app')} />
            )}

            {standalone && profile?.notification_permission !== 'granted' && (
              <PrimaryButton
                label="Ativar lembretes"
                onPress={() => router.push('/app/enable-notifications')}
              />
            )}

            {standalone && profile?.notification_permission === 'granted' && (
              <>
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>Lembrete de hidratação</Text>
                  <Switch
                    value={profile?.water_reminder_enabled ?? true}
                    onValueChange={toggleWaterReminder}
                    trackColor={{ true: Colors.gradientStart, false: Colors.cardBorder }}
                  />
                </View>
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>Lembrete do diário alimentar</Text>
                  <Switch
                    value={profile?.diary_reminder_enabled ?? true}
                    onValueChange={toggleDiaryReminder}
                    trackColor={{ true: Colors.gradientStart, false: Colors.cardBorder }}
                  />
                </View>
              </>
            )}
          </Card>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconScale size={IconSize.md} color={Colors.accentAmber} strokeWidth={1.75} />
            <Text style={Typography.label}>Preferências</Text>
          </View>
          <Card style={styles.sectionCard}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Meta de proteína</Text>
              <Text style={styles.rowValue}>{profile?.protein_goal_g ?? '—'} g/dia</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Meta de água</Text>
              <Text style={styles.rowValue}>{profile?.water_goal_ml ?? '—'} ml/dia</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Unidades</Text>
              <Text style={styles.rowValue}>{profile?.units === 'imperial' ? 'Imperial' : 'Métrico'}</Text>
            </View>
            <View style={styles.row}>
              <View style={styles.rowLabelWithIcon}>
                <IconLock size={IconSize.sm} color={Colors.textSecondary} strokeWidth={1.75} />
                <Text style={styles.rowLabel}>Privacidade de dados sensíveis</Text>
              </View>
              <Switch
                value={profile?.sensitive_data_private ?? true}
                onValueChange={togglePrivacy}
                trackColor={{ true: Colors.gradientStart, false: Colors.cardBorder }}
              />
            </View>
          </Card>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconCrown size={IconSize.md} color={Colors.accentAmber} strokeWidth={1.75} />
            <Text style={Typography.label}>Conta</Text>
          </View>
          <Card style={styles.sectionCard}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Assinatura</Text>
              <Text style={styles.rowValue}>
                {subscription ? STATUS_LABEL[subscription.status] ?? subscription.status : 'Sem assinatura'}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel} onPress={handleManageSubscription}>
                Gerenciar assinatura
              </Text>
            </View>
            <View style={styles.row}>
              <View style={styles.rowLabelWithIcon}>
                <IconFileExport size={IconSize.sm} color={Colors.textSecondary} strokeWidth={1.75} />
                <Text style={styles.rowLabel} onPress={handleExportData}>
                  Exportar meus dados
                </Text>
              </View>
            </View>
          </Card>
        </View>

        <TextDangerButton label="Sair da conta" onPress={handleSignOut} />
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
    gap: Spacing.lg,
  },
  header: {
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  section: {
    gap: Spacing.xs,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  sectionCard: {
    gap: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLabelWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  rowLabel: {
    ...Typography.body,
  },
  rowValue: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
});
