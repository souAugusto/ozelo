import { IconCamera, IconRuler } from '@tabler/icons-react-native';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LineChart } from '@/components/charts/LineChart';
import { PrimaryButton, SecondaryButton } from '@/components/ui/Button';
import { Card, GradientCard } from '@/components/ui/Card';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Input } from '@/components/ui/Input';
import { RowActions } from '@/components/ui/RowActions';
import { UndoToast } from '@/components/ui/UndoToast';
import { useAuth } from '@/context/AuthProvider';
import { showAlert } from '@/lib/alert';
import { useUndoableDelete } from '@/hooks/useUndoableDelete';
import {
  addBodyMeasurement,
  deleteBodyMeasurement,
  getBodyMeasurements,
  updateBodyMeasurement,
} from '@/lib/queries';
import { BorderWidth, Colors, IconSize, Radius, Spacing, Typography } from '@/constants/theme';
import type { BodyMeasurement } from '@/types/database';

function weeksSince(dateIso: string | null) {
  if (!dateIso) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(dateIso).getTime()) / (1000 * 60 * 60 * 24 * 7)));
}

function formatDate(dateIso: string) {
  return new Date(dateIso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function ProgressScreen() {
  const { session, profile } = useAuth();
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingMeasurement, setEditingMeasurement] = useState<BodyMeasurement | null>(null);
  const [weightInput, setWeightInput] = useState('');
  const [waistInput, setWaistInput] = useState('');
  const [hipInput, setHipInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState<BodyMeasurement | null>(null);

  const reload = useCallback(() => {
    if (!session) return;
    getBodyMeasurements(session.user.id)
      .then(setMeasurements)
      .catch((error) => showAlert('Não foi possível carregar suas medidas', (error as Error).message));
  }, [session]);

  useFocusEffect(reload);

  const { pending: pendingDelete, scheduleDelete, undo } = useUndoableDelete<BodyMeasurement>((measurement) =>
    deleteBodyMeasurement(measurement.id)
  );

  const currentWeight = profile?.current_weight_kg ?? 0;
  const startingWeight = measurements[0]?.weight_kg ?? currentWeight;
  const latestWeight = measurements[measurements.length - 1]?.weight_kg ?? currentWeight;
  const weightLost = Math.max(0, startingWeight - latestWeight);
  const weeks = weeksSince(profile?.treatment_started_at ?? null);

  const weightSeries = measurements
    .filter((m) => m.weight_kg !== null)
    .map((m, index) => ({ label: `S${index + 1}`, value: Number(m.weight_kg) }));

  function resetForm() {
    setShowForm(false);
    setEditingMeasurement(null);
    setWeightInput('');
    setWaistInput('');
    setHipInput('');
  }

  function startEdit(measurement: BodyMeasurement) {
    setEditingMeasurement(measurement);
    setWeightInput(measurement.weight_kg !== null ? String(measurement.weight_kg) : '');
    setWaistInput(measurement.waist_cm !== null ? String(measurement.waist_cm) : '');
    setHipInput(measurement.hip_cm !== null ? String(measurement.hip_cm) : '');
    setShowForm(true);
  }

  async function handleSaveMeasurement() {
    if (!session) return;
    if (!weightInput && !waistInput && !hipInput) {
      showAlert('Preencha ao menos um campo', 'Informe peso, cintura ou quadril pra registrar a medida.');
      return;
    }
    setSubmitting(true);
    try {
      const values = {
        weightKg: weightInput ? Number(weightInput) : null,
        waistCm: waistInput ? Number(waistInput) : null,
        hipCm: hipInput ? Number(hipInput) : null,
      };
      if (editingMeasurement) {
        await updateBodyMeasurement(editingMeasurement.id, values);
      } else {
        await addBodyMeasurement(session.user.id, values);
      }
      resetForm();
      reload();
    } catch (error) {
      showAlert('Não foi possível salvar a medida', (error as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  function handleDeleteConfirmed() {
    if (!confirmingDelete) return;
    const measurement = confirmingDelete;
    setMeasurements((prev) => prev.filter((m) => m.id !== measurement.id));
    scheduleDelete(measurement);
    setConfirmingDelete(null);
  }

  function handleUndo() {
    if (!pendingDelete) return;
    setMeasurements((prev) =>
      [...prev, pendingDelete].sort((a, b) => new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime())
    );
    undo();
  }

  const history = [...measurements].reverse();

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
          {history.length === 0 && <Text style={styles.emptyState}>Nenhuma medida registrada ainda.</Text>}
          {history.map((measurement) => (
            <Card key={measurement.id} style={styles.measurementRow}>
              <View style={styles.measurementIconWrap}>
                <IconRuler size={IconSize.md} color={Colors.accentMint} strokeWidth={1.75} />
              </View>
              <View style={styles.measurementTextWrap}>
                <Text style={styles.measurementDate}>{formatDate(measurement.measured_at)}</Text>
                <Text style={styles.measurementValues}>
                  {measurement.weight_kg !== null ? `${measurement.weight_kg} kg` : '—'}
                  {'  ·  '}
                  Cintura {measurement.waist_cm !== null ? `${measurement.waist_cm} cm` : '—'}
                  {'  ·  '}
                  Quadril {measurement.hip_cm !== null ? `${measurement.hip_cm} cm` : '—'}
                </Text>
              </View>
              <RowActions onEdit={() => startEdit(measurement)} onDelete={() => setConfirmingDelete(measurement)} />
            </Card>
          ))}
        </View>

        {showForm ? (
          <Card style={styles.form}>
            <Input label="Peso (kg)" value={weightInput} onChangeText={setWeightInput} placeholder="Ex: 82.5" keyboardType="decimal-pad" />
            <Input label="Cintura (cm)" value={waistInput} onChangeText={setWaistInput} placeholder="Ex: 90" keyboardType="decimal-pad" />
            <Input label="Quadril (cm)" value={hipInput} onChangeText={setHipInput} placeholder="Ex: 100" keyboardType="decimal-pad" />
            <PrimaryButton
              label={editingMeasurement ? 'Salvar alterações' : 'Salvar medida'}
              loading={submitting}
              onPress={handleSaveMeasurement}
            />
            <SecondaryButton label="Cancelar" onPress={resetForm} />
          </Card>
        ) : (
          <Pressable style={styles.dashedButton} onPress={() => setShowForm(true)}>
            <Text style={styles.dashedButtonLabel}>+ Adicionar medida</Text>
          </Pressable>
        )}

        <Pressable onPress={() => router.push('/app/photos')}>
          <Card style={styles.photosRow}>
            <IconCamera size={IconSize.md} color={Colors.accentAmber} strokeWidth={1.75} />
            <Text style={styles.photosLabel}>Ver fotos de progresso</Text>
          </Card>
        </Pressable>
      </ScrollView>

      <ConfirmModal
        visible={!!confirmingDelete}
        title="Excluir medida?"
        message="Esse registro de medida será removido do seu histórico."
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setConfirmingDelete(null)}
      />
      <UndoToast visible={!!pendingDelete} message="Medida excluída" onUndo={handleUndo} />
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
  measurementTextWrap: {
    flex: 1,
    gap: 2,
  },
  measurementDate: {
    ...Typography.body,
    fontWeight: '600',
  },
  measurementValues: {
    ...Typography.caption,
  },
  dashedButton: {
    borderWidth: BorderWidth.hairline,
    borderStyle: 'dashed',
    borderColor: Colors.cardBorder,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  dashedButtonLabel: {
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  form: {
    gap: Spacing.sm,
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
