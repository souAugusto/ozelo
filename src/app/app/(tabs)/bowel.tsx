import { IconAlertTriangle, IconCircleCheck, IconDroplet, IconPointFilled } from '@tabler/icons-react-native';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/ui/Button';
import { Card, GradientCard } from '@/components/ui/Card';
import { QuickSelectButton } from '@/components/ui/QuickSelectButton';
import { useAuth } from '@/context/AuthProvider';
import { addBowelLog, getRecentBowelLogs } from '@/lib/queries';
import { Colors, Spacing, Typography } from '@/constants/theme';
import type { BowelLog, BowelType } from '@/types/database';

const TYPES: { value: BowelType; label: string; icon: typeof IconCircleCheck; color: string }[] = [
  { value: 'normal', label: 'Normal', icon: IconCircleCheck, color: Colors.accentMint },
  { value: 'loose', label: 'Mole', icon: IconDroplet, color: Colors.accentCoral },
  { value: 'hard', label: 'Endurecido', icon: IconPointFilled, color: Colors.accentAmber },
  { value: 'discomfort', label: 'Desconforto', icon: IconAlertTriangle, color: Colors.accentCoral },
];

const TYPE_LABEL: Record<BowelType, string> = {
  normal: 'Normal',
  loose: 'Mole',
  hard: 'Endurecido',
  discomfort: 'Desconforto',
};

function daysAgo(dateIso: string) {
  const diffMs = Date.now() - new Date(dateIso).getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

function formatDateTime(dateIso: string) {
  const date = new Date(dateIso);
  return date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export default function BowelScreen() {
  const { session } = useAuth();
  const [selectedType, setSelectedType] = useState<BowelType>('normal');
  const [history, setHistory] = useState<BowelLog[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const reload = useCallback(() => {
    if (!session) return;
    getRecentBowelLogs(session.user.id).then(setHistory).catch(() => {});
  }, [session]);

  useFocusEffect(reload);

  async function handleRegister() {
    if (!session) return;
    setSubmitting(true);
    try {
      await addBowelLog(session.user.id, selectedType);
      reload();
    } finally {
      setSubmitting(false);
    }
  }

  const lastLog = history[0];
  const daysSince = lastLog ? daysAgo(lastLog.logged_at) : null;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={Typography.title}>Controle intestinal</Text>

        <GradientCard>
          <Text style={styles.gradientLabel}>Último registro</Text>
          <Text style={styles.gradientValue}>
            {lastLog ? `${TYPE_LABEL[lastLog.type]} · ${formatDateTime(lastLog.logged_at)}` : 'Nenhum registro ainda'}
          </Text>
        </GradientCard>

        <View style={styles.grid}>
          {TYPES.map((type) => (
            <QuickSelectButton
              key={type.value}
              label={type.label}
              icon={type.icon}
              color={type.color}
              selected={selectedType === type.value}
              onPress={() => setSelectedType(type.value)}
            />
          ))}
        </View>

        <Card>
          <Text style={styles.statusLabel}>Dias sem registro</Text>
          <Text style={styles.statusValue}>{daysSince === null ? '—' : daysSince}</Text>
        </Card>

        <View style={styles.history}>
          <Text style={Typography.label}>Histórico recente</Text>
          {history.map((log) => (
            <Card key={log.id} style={styles.historyRow}>
              <Text style={styles.historyType}>{TYPE_LABEL[log.type]}</Text>
              <Text style={styles.historyDate}>{formatDateTime(log.logged_at)}</Text>
            </Card>
          ))}
        </View>

        <PrimaryButton label="Registrar agora" loading={submitting} onPress={handleRegister} />
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
  statusLabel: {
    ...Typography.bodySecondary,
  },
  statusValue: {
    ...Typography.title,
    marginTop: 4,
  },
  history: {
    gap: Spacing.sm,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  historyType: {
    ...Typography.body,
    fontWeight: '600',
  },
  historyDate: {
    ...Typography.bodySecondary,
  },
});
