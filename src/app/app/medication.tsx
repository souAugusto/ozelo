import { IconTrash, IconVaccine } from '@tabler/icons-react-native';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/ui/Button';
import { Card, GradientCard } from '@/components/ui/Card';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Input } from '@/components/ui/Input';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { TimeField } from '@/components/ui/TimeField';
import { UndoToast } from '@/components/ui/UndoToast';
import { useAuth } from '@/context/AuthProvider';
import { useUndoableDelete } from '@/hooks/useUndoableDelete';
import { showAlert } from '@/lib/alert';
import { computeNextMedicationAt, formatNextMedication, WEEKDAY_LABELS } from '@/lib/medicationSchedule';
import {
  addMedicationLog,
  deleteMedicationLog,
  getRecentMedicationLogs,
  saveMedicationSchedule,
  updateNextMedicationAt,
} from '@/lib/queries';
import { BorderWidth, Colors, IconSize, Radius, Spacing, Typography } from '@/constants/theme';
import type { MedicationFrequencyType, MedicationLog } from '@/types/database';

const FREQUENCY_OPTIONS: { value: MedicationFrequencyType; label: string }[] = [
  { value: 'weekly', label: 'Semanal' },
  { value: 'interval_days', label: 'A cada X dias' },
];

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export default function MedicationScreen() {
  const { session, profile, refreshProfile } = useAuth();
  const [frequencyType, setFrequencyType] = useState<MedicationFrequencyType>(
    profile?.medication_frequency_type ?? 'weekly'
  );
  const [weekday, setWeekday] = useState(profile?.medication_weekday ?? 1);
  const [intervalDays, setIntervalDays] = useState(String(profile?.medication_interval_days ?? 7));
  const [time, setTime] = useState(profile?.reminder_time?.slice(0, 5) ?? '08:00');
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [logging, setLogging] = useState(false);
  const [history, setHistory] = useState<MedicationLog[]>([]);
  const [confirmingDelete, setConfirmingDelete] = useState<MedicationLog | null>(null);

  const reload = useCallback(() => {
    if (!session) return;
    getRecentMedicationLogs(session.user.id).then(setHistory).catch(() => {});
  }, [session]);

  useFocusEffect(reload);

  const { pending: pendingDelete, scheduleDelete, undo } = useUndoableDelete<MedicationLog>((log) =>
    deleteMedicationLog(log.id)
  );

  async function handleSaveSchedule() {
    if (!session) return;
    if (!TIME_REGEX.test(time)) {
      showAlert('Horário inválido', 'Informe o horário no formato HH:MM, ex: 08:00.');
      return;
    }
    const parsedInterval = Number(intervalDays);
    if (frequencyType === 'interval_days' && (!parsedInterval || parsedInterval < 1)) {
      showAlert('Intervalo inválido', 'Informe um número de dias maior que zero.');
      return;
    }

    setSavingSchedule(true);
    try {
      const nextAt = computeNextMedicationAt({
        frequencyType,
        time,
        weekday: frequencyType === 'weekly' ? weekday : null,
        intervalDays: frequencyType === 'interval_days' ? parsedInterval : null,
      });
      await saveMedicationSchedule(session.user.id, {
        frequencyType,
        time,
        weekday: frequencyType === 'weekly' ? weekday : null,
        intervalDays: frequencyType === 'interval_days' ? parsedInterval : null,
        nextMedicationAt: nextAt.toISOString(),
      });
      await refreshProfile();
      showAlert('Agendamento salvo', `Próxima aplicação: ${formatNextMedication(nextAt.toISOString())}`);
    } catch (error) {
      showAlert('Não foi possível salvar o agendamento', (error as Error).message);
    } finally {
      setSavingSchedule(false);
    }
  }

  async function handleLogApplication() {
    if (!session || !profile) return;
    setLogging(true);
    try {
      const appliedAt = new Date();
      await addMedicationLog(session.user.id, profile.medication ?? 'other', profile.medication_dose ?? undefined);

      if (profile.medication_frequency_type) {
        const nextAt = computeNextMedicationAt({
          frequencyType: profile.medication_frequency_type,
          time: profile.reminder_time?.slice(0, 5) ?? time,
          weekday: profile.medication_weekday,
          intervalDays: profile.medication_interval_days,
          anchor: appliedAt,
        });
        await updateNextMedicationAt(session.user.id, nextAt.toISOString());
      }

      await refreshProfile();
      reload();
      showAlert('Aplicação registrada!', 'Sua próxima aplicação foi recalculada automaticamente.');
    } catch (error) {
      showAlert('Não foi possível registrar', (error as Error).message);
    } finally {
      setLogging(false);
    }
  }

  function handleDeleteConfirmed() {
    if (!confirmingDelete) return;
    const log = confirmingDelete;
    setHistory((prev) => prev.filter((l) => l.id !== log.id));
    scheduleDelete(log);
    setConfirmingDelete(null);
  }

  function handleUndo() {
    if (!pendingDelete) return;
    setHistory((prev) =>
      [...prev, pendingDelete].sort((a, b) => new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime())
    );
    undo();
  }

  const hasSchedule = !!profile?.medication_frequency_type && !!profile?.next_medication_at;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScreenHeader title="Aplicação da medicação" />
      <ScrollView contentContainerStyle={styles.content}>
        <GradientCard>
          <View style={styles.nextRow}>
            <View style={styles.nextIconWrap}>
              <IconVaccine size={IconSize.lg} color="#FFFFFF" strokeWidth={1.75} />
            </View>
            <View>
              <Text style={styles.nextLabel}>Próxima aplicação</Text>
              <Text style={styles.nextValue}>
                {hasSchedule ? formatNextMedication(profile!.next_medication_at) : 'Configure abaixo'}
              </Text>
            </View>
          </View>
        </GradientCard>

        <PrimaryButton label="Registrar aplicação agora" loading={logging} onPress={handleLogApplication} />

        <Card style={styles.scheduleCard}>
          <Text style={Typography.label}>Agendamento</Text>

          <SegmentedControl options={FREQUENCY_OPTIONS} value={frequencyType} onChange={setFrequencyType} />

          {frequencyType === 'weekly' ? (
            <View style={styles.weekdayRow}>
              {WEEKDAY_LABELS.map((label, index) => (
                <Pressable
                  key={label}
                  style={[styles.weekdayChip, weekday === index && styles.weekdayChipSelected]}
                  onPress={() => setWeekday(index)}
                >
                  <Text style={[styles.weekdayChipLabel, weekday === index && styles.weekdayChipLabelSelected]}>
                    {label.slice(0, 3)}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : (
            <Input
              label="A cada quantos dias"
              value={intervalDays}
              onChangeText={setIntervalDays}
              placeholder="Ex: 7"
              keyboardType="number-pad"
            />
          )}

          <TimeField label="Horário" value={time} onChange={setTime} />

          <PrimaryButton label="Salvar agendamento" loading={savingSchedule} onPress={handleSaveSchedule} />
        </Card>

        <View style={styles.history}>
          <Text style={Typography.label}>Histórico de aplicações</Text>
          {history.length === 0 && <Text style={styles.emptyState}>Nenhuma aplicação registrada ainda.</Text>}
          {history.map((log) => (
            <Card key={log.id} style={styles.historyRow}>
              <Text style={styles.historyDate}>{formatDateTime(log.applied_at)}</Text>
              <Pressable onPress={() => setConfirmingDelete(log)} hitSlop={8}>
                <IconTrash size={IconSize.sm} color={Colors.accentCoral} strokeWidth={1.75} />
              </Pressable>
            </Card>
          ))}
        </View>
      </ScrollView>

      <ConfirmModal
        visible={!!confirmingDelete}
        title="Excluir aplicação?"
        message="Esse registro será removido do seu histórico. A próxima aplicação prevista não muda."
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setConfirmingDelete(null)}
      />
      <UndoToast visible={!!pendingDelete} message="Aplicação excluída" onUndo={handleUndo} />
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
  nextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  nextIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '600',
  },
  nextValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  scheduleCard: {
    gap: Spacing.sm,
  },
  weekdayRow: {
    flexDirection: 'row',
    gap: Spacing.xxs,
  },
  weekdayChip: {
    flex: 1,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
    borderWidth: BorderWidth.hairline,
    borderColor: Colors.cardBorder,
    alignItems: 'center',
  },
  weekdayChipSelected: {
    borderColor: Colors.gradientStart,
    borderWidth: BorderWidth.selected,
    backgroundColor: Colors.cardElevated,
  },
  weekdayChipLabel: {
    ...Typography.caption,
    fontWeight: '700',
  },
  weekdayChipLabelSelected: {
    color: Colors.textPrimary,
  },
  history: {
    gap: Spacing.sm,
  },
  emptyState: {
    ...Typography.bodySecondary,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyDate: {
    ...Typography.body,
    fontWeight: '600',
  },
});
