import { IconBrain, IconDroplet, IconFlame, IconRotate } from '@tabler/icons-react-native';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/ui/Button';
import { Card, GradientCard } from '@/components/ui/Card';
import { QuickSelectButton } from '@/components/ui/QuickSelectButton';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { useAuth } from '@/context/AuthProvider';
import { addSymptomLog, getLatestMedicationLog, getRecentSymptomLogs } from '@/lib/queries';
import { Colors, Spacing, Typography } from '@/constants/theme';
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

  const reload = useCallback(() => {
    if (!session) return;
    getRecentSymptomLogs(session.user.id).then(setHistory).catch(() => {});
    getLatestMedicationLog(session.user.id).then(setLastDose).catch(() => {});
  }, [session]);

  useFocusEffect(reload);

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
                <View>
                  <Text style={styles.historyType}>{SYMPTOM_LABEL[log.symptom]}</Text>
                  <Text style={styles.historyDate}>{formatDateTime(log.logged_at)}</Text>
                </View>
                {hours !== null && (
                  <Text style={styles.historyDose}>{hours >= 0 ? `${hours}h após a dose` : '—'}</Text>
                )}
              </Card>
            );
          })}
        </View>

        <PrimaryButton label="Registrar sintoma" loading={submitting} onPress={handleRegister} />
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
});
