import { IconChevronLeft, IconChevronRight, IconFlame } from '@tabler/icons-react-native';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useAuth } from '@/context/AuthProvider';
import {
  dateKey,
  getMonthCalendarData,
  getWellnessStreak,
  type DayIndicators,
  type DayRecords,
} from '@/lib/calendarData';
import { deleteBowelLog, deleteMeal, deleteSymptomLog } from '@/lib/queries';
import { BorderWidth, Colors, IconSize, Radius, Spacing, Typography } from '@/constants/theme';
import type { BowelLog, BowelType, Meal, Symptom, SymptomLog } from '@/types/database';

const WEEKDAY_LABELS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const MONTH_LABELS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const BOWEL_LABEL: Record<BowelType, string> = {
  normal: 'Normal',
  loose: 'Mole',
  hard: 'Endurecido',
  discomfort: 'Desconforto',
};

const SYMPTOM_LABEL: Record<Symptom, string> = {
  nausea: 'Náusea',
  reflux: 'Refluxo',
  headache: 'Dor de cabeça',
  dizziness: 'Tontura',
  fatigue: 'Fadiga',
  difficulty_eating: 'Dificuldade pra comer',
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export default function CalendarScreen() {
  const { session, profile } = useAuth();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [indicatorsByDate, setIndicatorsByDate] = useState<Record<string, DayIndicators>>({});
  const [recordsByDate, setRecordsByDate] = useState<Record<string, DayRecords>>({});
  const [streak, setStreak] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<
    | { kind: 'meal'; item: Meal }
    | { kind: 'bowel'; item: BowelLog }
    | { kind: 'symptom'; item: SymptomLog }
    | null
  >(null);

  const waterGoal = profile?.water_goal_ml ?? 2000;
  const proteinGoal = profile?.protein_goal_g ?? 90;

  const reload = useCallback(() => {
    if (!session) return;
    getMonthCalendarData(session.user.id, year, month, waterGoal).then(({ indicatorsByDate, recordsByDate }) => {
      setIndicatorsByDate(indicatorsByDate);
      setRecordsByDate(recordsByDate);
    });
    getWellnessStreak(session.user.id, waterGoal, proteinGoal).then(setStreak);
  }, [session, year, month, waterGoal, proteinGoal]);

  useFocusEffect(reload);

  function goToMonth(delta: number) {
    const next = new Date(year, month + delta, 1);
    setYear(next.getFullYear());
    setMonth(next.getMonth());
  }

  const firstOfMonth = new Date(year, month, 1);
  const startWeekday = firstOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayKey = dateKey(today.toISOString());

  const cells: (number | null)[] = [
    ...Array(startWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  function keyFor(day: number) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    if (deleteTarget.kind === 'meal') await deleteMeal(deleteTarget.item.id);
    if (deleteTarget.kind === 'bowel') await deleteBowelLog(deleteTarget.item.id);
    if (deleteTarget.kind === 'symptom') await deleteSymptomLog(deleteTarget.item.id);
    setDeleteTarget(null);
    reload();
  }

  const selectedRecords = selectedDate ? recordsByDate[selectedDate] : null;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScreenHeader title="Calendário" />
      <ScrollView contentContainerStyle={styles.content}>
        {streak > 0 && (
          <View style={styles.streakCard}>
            <IconFlame size={IconSize.lg} color={Colors.accentAmber} strokeWidth={1.75} />
            <Text style={styles.streakText}>
              {streak} {streak === 1 ? 'dia seguido' : 'dias seguidos'} com hidratação e proteína em dia
            </Text>
          </View>
        )}

        <View style={styles.monthHeader}>
          <Pressable onPress={() => goToMonth(-1)} hitSlop={8}>
            <IconChevronLeft size={IconSize.lg} color={Colors.textPrimary} strokeWidth={1.75} />
          </Pressable>
          <Text style={styles.monthLabel}>
            {MONTH_LABELS[month]} {year}
          </Text>
          <Pressable onPress={() => goToMonth(1)} hitSlop={8}>
            <IconChevronRight size={IconSize.lg} color={Colors.textPrimary} strokeWidth={1.75} />
          </Pressable>
        </View>

        <View style={styles.weekdayRow}>
          {WEEKDAY_LABELS.map((label, i) => (
            <Text key={i} style={styles.weekdayLabel}>
              {label}
            </Text>
          ))}
        </View>

        <View style={styles.grid}>
          {cells.map((day, index) => {
            if (day === null) return <View key={index} style={styles.cell} />;
            const key = keyFor(day);
            const indicators = indicatorsByDate[key];
            const isToday = key === todayKey;
            return (
              <Pressable key={index} style={styles.cell} onPress={() => setSelectedDate(key)}>
                <View style={[styles.cellInner, isToday && styles.cellToday]}>
                  <Text style={[styles.cellNumber, isToday && styles.cellNumberToday]}>{day}</Text>
                  <View style={styles.dotsRow}>
                    {indicators?.medicationApplied && <View style={[styles.dot, { backgroundColor: Colors.accentMint }]} />}
                    {indicators?.hydrationGoalMet && <View style={[styles.dot, { backgroundColor: '#00E5C7' }]} />}
                    {indicators?.symptomLogged && <View style={[styles.dot, { backgroundColor: Colors.accentCoral }]} />}
                    {indicators?.bowelLogged && <View style={[styles.dot, { backgroundColor: Colors.accentAmber }]} />}
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.legend}>
          <LegendItem color={Colors.accentMint} label="Medicação" />
          <LegendItem color="#00E5C7" label="Hidratação" />
          <LegendItem color={Colors.accentCoral} label="Sintoma" />
          <LegendItem color={Colors.accentAmber} label="Intestino" />
        </View>
      </ScrollView>

      <Modal visible={!!selectedDate} transparent animationType="slide" onRequestClose={() => setSelectedDate(null)}>
        <View style={styles.sheetBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setSelectedDate(null)} />
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{selectedDate}</Text>
            <ScrollView style={styles.sheetScroll}>
              {!selectedRecords && <Text style={styles.emptyText}>Nenhum registro nesse dia.</Text>}

              {selectedRecords?.medicationLogs.map((log) => (
                <View key={log.id} style={styles.sheetRow}>
                  <Text style={styles.sheetRowLabel}>Medicação aplicada · {formatTime(log.applied_at)}</Text>
                </View>
              ))}

              {selectedRecords && selectedRecords.hydrationMl > 0 && (
                <View style={styles.sheetRow}>
                  <Text style={styles.sheetRowLabel}>Hidratação: {Math.round(selectedRecords.hydrationMl)} ml</Text>
                </View>
              )}

              {selectedRecords?.meals.map((meal) => (
                <View key={meal.id} style={styles.sheetRow}>
                  <Text style={styles.sheetRowLabel}>
                    {meal.name} · {meal.protein_g}g · {formatTime(meal.logged_at)}
                  </Text>
                  <SheetActions
                    onEdit={() => router.push('/app/(tabs)/nutrition')}
                    onDelete={() => setDeleteTarget({ kind: 'meal', item: meal })}
                  />
                </View>
              ))}

              {selectedRecords?.bowelLogs.map((log) => (
                <View key={log.id} style={styles.sheetRow}>
                  <Text style={styles.sheetRowLabel}>
                    Intestino: {BOWEL_LABEL[log.type]} · {formatTime(log.logged_at)}
                  </Text>
                  <SheetActions
                    onEdit={() => router.push('/app/(tabs)/bowel')}
                    onDelete={() => setDeleteTarget({ kind: 'bowel', item: log })}
                  />
                </View>
              ))}

              {selectedRecords?.symptomLogs.map((log) => (
                <View key={log.id} style={styles.sheetRow}>
                  <Text style={styles.sheetRowLabel}>
                    Sintoma: {SYMPTOM_LABEL[log.symptom]} · {formatTime(log.logged_at)}
                  </Text>
                  <SheetActions
                    onEdit={() => router.push('/app/(tabs)/symptoms')}
                    onDelete={() => setDeleteTarget({ kind: 'symptom', item: log })}
                  />
                </View>
              ))}
            </ScrollView>
            <Pressable style={styles.sheetClose} onPress={() => setSelectedDate(null)}>
              <Text style={styles.sheetCloseLabel}>Fechar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <ConfirmModal
        visible={!!deleteTarget}
        title="Excluir registro?"
        message="Esse registro será removido do seu histórico."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </SafeAreaView>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

function SheetActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <View style={styles.sheetActionsRow}>
      <Pressable onPress={onEdit} hitSlop={8}>
        <Text style={styles.sheetActionLabel}>Editar</Text>
      </Pressable>
      <Pressable onPress={onDelete} hitSlop={8}>
        <Text style={[styles.sheetActionLabel, styles.sheetActionDanger]}>Excluir</Text>
      </Pressable>
    </View>
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
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.card,
    borderWidth: BorderWidth.hairline,
    borderColor: Colors.cardBorder,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  streakText: {
    ...Typography.body,
    fontWeight: '600',
    flex: 1,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthLabel: {
    ...Typography.title,
    fontSize: 18,
  },
  weekdayRow: {
    flexDirection: 'row',
  },
  weekdayLabel: {
    flex: 1,
    textAlign: 'center',
    ...Typography.caption,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    padding: 2,
  },
  cellInner: {
    flex: 1,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  cellToday: {
    backgroundColor: Colors.cardElevated,
    borderWidth: BorderWidth.hairline,
    borderColor: Colors.gradientStart,
  },
  cellNumber: {
    ...Typography.bodySecondary,
    fontSize: 13,
  },
  cellNumberToday: {
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 3,
    height: 6,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xxs,
  },
  legendLabel: {
    ...Typography.caption,
  },
  sheetBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    borderWidth: BorderWidth.hairline,
    borderColor: Colors.cardBorder,
    padding: Spacing.lg,
    maxHeight: '70%',
    gap: Spacing.md,
  },
  sheetTitle: {
    ...Typography.title,
    fontSize: 18,
  },
  sheetScroll: {
    gap: Spacing.sm,
  },
  emptyText: {
    ...Typography.bodySecondary,
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
    borderBottomWidth: BorderWidth.hairline,
    borderBottomColor: Colors.cardBorder,
  },
  sheetRowLabel: {
    ...Typography.body,
    flex: 1,
  },
  sheetActionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  sheetActionLabel: {
    ...Typography.bodySecondary,
    color: Colors.accentMint,
    fontWeight: '600',
  },
  sheetActionDanger: {
    color: Colors.accentCoral,
  },
  sheetClose: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderWidth: BorderWidth.hairline,
    borderColor: Colors.cardBorder,
    borderRadius: Radius.md,
  },
  sheetCloseLabel: {
    color: Colors.buttonSecondaryText,
    fontWeight: '600',
  },
});
