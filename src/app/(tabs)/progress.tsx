import { IconCamera, IconRuler } from '@tabler/icons-react-native';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LineChart } from '@/components/charts/LineChart';
import { Card, GradientCard } from '@/components/ui/Card';
import { useAuth } from '@/context/AuthProvider';
import { getBodyMeasurements } from '@/lib/queries';
import { Colors, IconSize, Radius, Spacing, Typography } from '@/constants/theme';
import type { BodyMeasurement } from '@/types/database';

function weeksSince(dateIso: string | null) {
  if (!dateIso) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(dateIso).getTime()) / (1000 * 60 * 60 * 24 * 7)));
}

export default function ProgressScreen() {
  const { session, profile } = useAuth();
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);

  useFocusEffect(
    useCallback(() => {
      if (!session) return;
      getBodyMeasurements(session.user.id).then(setMeasurements).catch(() => {});
    }, [session])
  );

  const currentWeight = profile?.current_weight_kg ?? 0;
  const goalWeight = profile?.goal_weight_kg ?? currentWeight;
  const startingWeight = measurements[0]?.weight_kg ?? currentWeight;
  const latestWeight = measurements[measurements.length - 1]?.weight_kg ?? currentWeight;
  const weightLost = Math.max(0, startingWeight - latestWeight);
  const weeks = weeksSince(profile?.treatment_started_at ?? null);

  const weightSeries = measurements
    .filter((m) => m.weight_kg !== null)
    .map((m, index) => ({ label: `S${index + 1}`, value: Number(m.weight_kg) }));

  const latest = measurements[measurements.length - 1];
  const previous = measurements[measurements.length - 2];
  const waistDelta = latest?.waist_cm && previous?.waist_cm ? Number(latest.waist_cm) - Number(previous.waist_cm) : null;
  const hipDelta = latest?.hip_cm && previous?.hip_cm ? Number(latest.hip_cm) - Number(previous.hip_cm) : null;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={Typography.title}>Progresso</Text>

        <View style={styles.grid}>
          <GradientCard style={styles.gridCard}>
            <Text style={styles.gradientLabel}>Peso perdido</Text>
            <Text style={styles.gradientValue}>{weightLost.toFixed(1)} kg</Text>
          </GradientCard>
          <Card style={styles.gridCard}>
            <Text style={styles.neutralLabel}>Semanas de uso</Text>
            <Text style={styles.neutralValue}>{weeks}</Text>
          </Card>
        </View>

        <Card>
          <Text style={[Typography.label, styles.sectionLabel]}>Evolução do peso</Text>
          {weightSeries.length > 0 ? (
            <LineChart data={weightSeries} lineColor="#00E5C7" pointColor="#7C4DFF" />
          ) : (
            <Text style={styles.emptyState}>Registre suas medidas pra ver o gráfico aqui.</Text>
          )}
        </Card>

        <View style={styles.measurements}>
          <Text style={Typography.label}>Medidas corporais</Text>
          <Card style={styles.measurementRow}>
            <View style={styles.measurementIconWrap}>
              <IconRuler size={IconSize.md} color={Colors.accentMint} strokeWidth={1.75} />
            </View>
            <Text style={styles.measurementName}>Cintura</Text>
            <Text style={styles.measurementValue}>
              {latest?.waist_cm ? `${latest.waist_cm} cm` : '—'}
              {waistDelta !== null && (
                <Text style={styles.measurementDelta}> ({waistDelta > 0 ? '+' : ''}{waistDelta.toFixed(1)})</Text>
              )}
            </Text>
          </Card>
          <Card style={styles.measurementRow}>
            <View style={styles.measurementIconWrap}>
              <IconRuler size={IconSize.md} color={Colors.accentMint} strokeWidth={1.75} />
            </View>
            <Text style={styles.measurementName}>Quadril</Text>
            <Text style={styles.measurementValue}>
              {latest?.hip_cm ? `${latest.hip_cm} cm` : '—'}
              {hipDelta !== null && (
                <Text style={styles.measurementDelta}> ({hipDelta > 0 ? '+' : ''}{hipDelta.toFixed(1)})</Text>
              )}
            </Text>
          </Card>
        </View>

        <Pressable onPress={() => router.push('/photos')}>
          <Card style={styles.photosRow}>
            <IconCamera size={IconSize.md} color={Colors.accentAmber} strokeWidth={1.75} />
            <Text style={styles.photosLabel}>Ver fotos de progresso</Text>
          </Card>
        </Pressable>
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
  grid: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  gridCard: {
    flex: 1,
  },
  gradientLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '600',
  },
  gradientValue: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    marginTop: 4,
  },
  neutralLabel: {
    ...Typography.bodySecondary,
  },
  neutralValue: {
    ...Typography.title,
    marginTop: 4,
  },
  sectionLabel: {
    marginBottom: Spacing.xs,
  },
  emptyState: {
    ...Typography.bodySecondary,
  },
  measurements: {
    gap: Spacing.sm,
  },
  measurementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  measurementIconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: `${Colors.accentMint}1F`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  measurementName: {
    ...Typography.body,
    flex: 1,
    fontWeight: '600',
  },
  measurementValue: {
    ...Typography.body,
    fontWeight: '700',
  },
  measurementDelta: {
    ...Typography.caption,
  },
  photosRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  photosLabel: {
    ...Typography.body,
    fontWeight: '600',
  },
});
