import { IconBrain, IconDroplet, IconFlame, IconRotate } from '@tabler/icons-react-native';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton, SecondaryButton } from '@/components/ui/Button';
import { Card, GradientCard } from '@/components/ui/Card';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { QuickSelectButton } from '@/components/ui/QuickSelectButton';
import { RowActions } from '@/components/ui/RowActions';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { UndoToast } from '@/components/ui/UndoToast';
import { useAuth } from '@/context/AuthProvider';
import { useUndoableDelete } from '@/hooks/useUndoableDelete';
import {
  addSymptomLog,
  deleteSymptomLog,
  getLatestMedicationLog,
  getRecentSymptomLogs,
  updateSymptomLog,
} from '@/lib/queries';
import { BorderWidth, Colors, Radius, Spacing, Typography } from '@/constants/theme';
import type { MedicationLog, Symptom, SymptomIntensity, SymptomLog } from '@/types/database';

const TYPES: { value: Symptom; label: string; icon: typeof IconDroplet; color: string }[] = [
  { value: 'nausea', label: 'Náusea', icon: IconDroplet, color: Colors.accentCoral },
  { value: 'reflux', label: 'Refluxo', icon: IconFlame, color: Colors.accentAmber },
  { value: 'headache', label: 'Dor de cabeça', icon: IconBrain, color: Colors.accentAmber },
  { value: 'dizziness', label: 'Tontura', icon: IconRotate, color: Colors.accentCoral },
];

const SYMPTOM_LABEL: Record<string, string> = {
  nausea: 'Náusea',
  reflux: 'Refluxo',
  headache: 'Dor de cabeça',
  dizziness: 'Tontura',
  fatigue: 'Fadiga',
  difficulty_eating: 'Dificuldade pra comer',
};

const INTENSITY_OPTIONS: { value: SymptomIntensity; label: string }[] = [
  { value: 'mild', label: 'Leve' },
  { value: 'moderate', label: 'Moderado' },
  { value: 'severe', label: 'Forte' },
];

function daysAgo(dateIso: string) {
  return Math.floor((Date.now() - new Date(dateIso).getTime()) / (1000 * 60 * 60 * 24));
}

function formatDateTime(dateIso: string) {
  return new Date(dateIso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function hoursSinceDose(logIso: string, doseIso: string | undefined) {
  if (!doseIso) return null;
  const diffMs = new Date(logIso).getTime() - new Date(doseIso).getTime();
  return Math.round(diffMs / (1000 * 60 * 60));
}

export default function SymptomsScreen() {
  const { session } = useAuth();
  const [selectedSymptom, setSelectedSymptom] = useState<Symptom>('nausea');
  const [intensity, setIntensity] = useState<SymptomIntensity>('mild');
  const [history, setHistory] = useState<SymptomLog[]>([]);
  const [lastDose, setLastDose] = useState<MedicationLog | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingLog, setEditingLog] = useState<SymptomLog | null>(null);
  const [editingSymptom, setEditingSymptom] = useState<Symptom>('nausea');
  const [editingIntensity, setEditingIntensity] = useState<SymptomIntensity>('mild');
  const [confirmingDelete, setConfirmingDelete] = useState<SymptomLog | null>(null);

  const reload = useCallback(() => {
    if (!session) return;
    getRecentSymptomLogs(session.user.id).then(setHistory).catch(() => {});
    getLatestMedicationLog(session.user.id).then(setLastDose).catch(() => {});
  }, [session]);

  useFocusEffect(reload);

  const { pending: pendingDelete, scheduleDelete, undo } = useUndoableDelete<SymptomLog>((log) =>
    deleteSymptomLog(log.id)
  );

  async function handleRegister() {
    if (!session) return;
    setSubmitting(true);
    try {
      await addSymptomLog(session.user.id, selectedSymptom, intensity);
      reload();
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit(log: SymptomLog) {
    setEditingLog(log);
    setEditingSymptom(log.symptom);
    setEditingIntensity(log.intensity);
  }

  async function handleSaveEdit() {
    if (!editingLog) return;
    setSubmitting(true);
    try {
      await updateSymptomLog(editingLog.id, editingSymptom, editingIntensity);
      setEditingLog(null);
      reload();
    } finally {
      setSubmitting(false);
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
      [...prev, pendingDelete].sort((a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime())
    );
    undo();
  }

  const lastLog = history[0];
  const statusText = lastLog
    ? daysAgo(lastLog.logged_at) === 0
      ? `Último: ${SYMPTOM_LABEL[lastLog.symptom]} hoje`
      : `${daysAgo(lastLog.logged_at)} dias sem registro`
    : 'Nenhum sintoma registrado';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={Typography.title}>Sintomas</Text>

        <GradientCard>
          <Text style={styles.gradientLabel}>Status</Text>
          <Text style={styles.gradientValue}>{statusText}</Text>
        </GradientCard>

        <View style={styles.grid}>
          {TYPES.map((type) => (
            <QuickSelectButton
              key={type.value}
              label={type.label}
              icon={type.icon}
              color={type.color}
              selected={selectedSymptom === type.value}
              onPress={() => setSelectedSymptom(type.value)}
            />
          ))}
        </View>

        <View>
          <Text style={[Typography.label, styles.sectionLabel]}>Intensidade</Text>
          <SegmentedControl options={INTENSITY_OPTIONS} value={intensity} onChange={setIntensity} />
        </View>

        <View style={styles.history}>
          <Text style={Typography.label}>Histórico recente</Text>
          {history.map((log) => {
            const hours = lastDose ? hoursSinceDose(log.logged_at, lastDose.applied_at) : null;
            return (
              <Card key={log.id} style={styles.historyRow}>
                <View style={styles.historyTextWrap}>
                  <Text style={styles.historyType}>{SYMPTOM_LABEL[log.symptom]}</Text>
                  <Text style={styles.historyDate}>{formatDateTime(log.logged_at)}</Text>
                  {hours !== null && (
                    <Text style={styles.historyDose}>{hours >= 0 ? `${hours}h após a dose` : '—'}</Text>
                  )}
                </View>
                <RowActions onEdit={() => startEdit(log)} onDelete={() => setConfirmingDelete(log)} />
              </Card>
            );
          })}
        </View>

        <PrimaryButton label="Registrar sintoma" loading={submitting} onPress={handleRegister} />
      </ScrollView>

      <Modal visible={!!editingLog} transparent animationType="fade" onRequestClose={() => setEditingLog(null)}>
        <View style={styles.editBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setEditingLog(null)} />
          <View style={styles.editCard}>
            <Text style={styles.editTitle}>Editar sintoma</Text>
            <View style={styles.grid}>
              {TYPES.map((type) => (
                <QuickSelectButton
                  key={type.value}
                  label={type.label}
                  icon={type.icon}
                  color={type.color}
                  selected={editingSymptom === type.value}
                  onPress={() => setEditingSymptom(type.value)}
                />
              ))}
            </View>
            <SegmentedControl options={INTENSITY_OPTIONS} value={editingIntensity} onChange={setEditingIntensity} />
            <PrimaryButton label="Salvar" loading={submitting} onPress={handleSaveEdit} />
            <SecondaryButton label="Cancelar" onPress={() => setEditingLog(null)} />
          </View>
        </View>
      </Modal>

      <ConfirmModal
        visible={!!confirmingDelete}
        title="Excluir sintoma?"
        message="Esse registro de sintoma será removido do seu histórico."
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setConfirmingDelete(null)}
      />
      <UndoToast visible={!!pendingDelete} message="Sintoma excluído" onUndo={handleUndo} />
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
  gradientLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '600',
  },
  gradientValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  sectionLabel: {
    marginBottom: Spacing.xs,
  },
  history: {
    gap: Spacing.sm,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyTextWrap: {
    flex: 1,
    gap: 2,
  },
  historyType: {
    ...Typography.body,
    fontWeight: '600',
  },
  historyDate: {
    ...Typography.bodySecondary,
  },
  historyDose: {
    ...Typography.caption,
    color: Colors.accentAmber,
  },
  editBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  editCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: Colors.card,
    borderWidth: BorderWidth.hairline,
    borderColor: Colors.cardBorder,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  editTitle: {
    ...Typography.title,
    fontSize: 18,
  },
});
