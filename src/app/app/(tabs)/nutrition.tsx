import { IconMeat, IconSalad } from '@tabler/icons-react-native';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton, SecondaryButton } from '@/components/ui/Button';
import { Card, GradientCard } from '@/components/ui/Card';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Input } from '@/components/ui/Input';
import { LinearProgressBar } from '@/components/ui/ProgressBar';
import { RowActions } from '@/components/ui/RowActions';
import { UndoToast } from '@/components/ui/UndoToast';
import { useAuth } from '@/context/AuthProvider';
import { useUndoableDelete } from '@/hooks/useUndoableDelete';
import { addMeal, deleteMeal, getRecentMeals, getTodayProteinTotal, updateMeal } from '@/lib/queries';
import { BorderWidth, Colors, IconSize, Radius, Spacing, Typography } from '@/constants/theme';
import type { Meal } from '@/types/database';

function formatTime(dateIso: string) {
  return new Date(dateIso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export default function NutritionScreen() {
  const { session, profile } = useAuth();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [proteinTotal, setProteinTotal] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [mealName, setMealName] = useState('');
  const [mealProtein, setMealProtein] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState<Meal | null>(null);

  const proteinGoal = profile?.protein_goal_g ?? 90;

  const reload = useCallback(() => {
    if (!session) return;
    getRecentMeals(session.user.id).then(setMeals).catch(() => {});
    getTodayProteinTotal(session.user.id).then(setProteinTotal).catch(() => {});
  }, [session]);

  useFocusEffect(reload);

  const { pending: pendingDelete, scheduleDelete, undo } = useUndoableDelete<Meal>((meal) =>
    deleteMeal(meal.id)
  );

  function resetForm() {
    setShowForm(false);
    setEditingMeal(null);
    setMealName('');
    setMealProtein('');
  }

  function startEdit(meal: Meal) {
    setEditingMeal(meal);
    setMealName(meal.name);
    setMealProtein(String(meal.protein_g));
    setShowForm(true);
  }

  async function handleSaveMeal() {
    if (!session || !mealName || !mealProtein) return;
    setSubmitting(true);
    try {
      if (editingMeal) {
        await updateMeal(editingMeal.id, mealName, Number(mealProtein));
      } else {
        await addMeal(session.user.id, mealName, Number(mealProtein));
      }
      resetForm();
      reload();
    } finally {
      setSubmitting(false);
    }
  }

  function handleDeleteConfirmed() {
    if (!confirmingDelete) return;
    const meal = confirmingDelete;
    setMeals((prev) => prev.filter((m) => m.id !== meal.id));
    scheduleDelete(meal);
    setConfirmingDelete(null);
  }

  function handleUndo() {
    if (!pendingDelete) return;
    setMeals((prev) =>
      [...prev, pendingDelete].sort((a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime())
    );
    undo();
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={Typography.title}>Diário alimentar</Text>

        <GradientCard>
          <Text style={styles.gradientLabel}>Proteína hoje</Text>
          <Text style={styles.gradientValue}>
            {Math.round(proteinTotal)} / {proteinGoal} g
          </Text>
          <View style={styles.gradientBarWrap}>
            <LinearProgressBar progress={proteinTotal / proteinGoal} />
          </View>
        </GradientCard>

        <View style={styles.meals}>
          <Text style={Typography.label}>Refeições de hoje</Text>
          {meals.map((meal) => (
            <Card key={meal.id} style={styles.mealRow}>
              <View style={styles.mealIconWrap}>
                <IconMeat size={IconSize.md} color={Colors.accentAmber} strokeWidth={1.75} />
              </View>
              <View style={styles.mealTextWrap}>
                <Text style={styles.mealName}>{meal.name}</Text>
                <Text style={styles.mealTime}>{formatTime(meal.logged_at)}</Text>
              </View>
              <Text style={styles.mealProtein}>{meal.protein_g}g</Text>
              <RowActions onEdit={() => startEdit(meal)} onDelete={() => setConfirmingDelete(meal)} />
            </Card>
          ))}
        </View>

        {showForm ? (
          <Card style={styles.form}>
            <Input label="Refeição" value={mealName} onChangeText={setMealName} placeholder="Ex: Omelete com queijo" />
            <Input
              label="Proteína (g)"
              value={mealProtein}
              onChangeText={setMealProtein}
              placeholder="Ex: 25"
              keyboardType="decimal-pad"
            />
            <PrimaryButton
              label={editingMeal ? 'Salvar alterações' : 'Salvar refeição'}
              loading={submitting}
              onPress={handleSaveMeal}
            />
            <SecondaryButton label="Cancelar" onPress={resetForm} />
          </Card>
        ) : (
          <Pressable style={styles.dashedButton} onPress={() => setShowForm(true)}>
            <Text style={styles.dashedButtonLabel}>+ Adicionar refeição</Text>
          </Pressable>
        )}

        <Card style={styles.recipeCard}>
          <View style={styles.recipeHeader}>
            <IconSalad size={IconSize.md} color={Colors.accentMint} strokeWidth={1.75} />
            <Text style={styles.recipeTitle}>Sugestão de baixo volume</Text>
          </View>
          <Text style={styles.recipeName}>Ovos mexidos com queijo cottage</Text>
          <Text style={styles.recipeDetail}>
            2 ovos + 2 colheres de cottage · ~24g de proteína em poucas colheradas, ideal pra
            quando o apetite está reduzido.
          </Text>
        </Card>
      </ScrollView>

      <ConfirmModal
        visible={!!confirmingDelete}
        title="Excluir refeição?"
        message={confirmingDelete ? `"${confirmingDelete.name}" será removida do seu diário.` : undefined}
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setConfirmingDelete(null)}
      />
      <UndoToast visible={!!pendingDelete} message="Refeição excluída" onUndo={handleUndo} />
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
    fontSize: 22,
    fontWeight: '700',
    marginTop: 4,
  },
  gradientBarWrap: {
    marginTop: Spacing.sm,
  },
  meals: {
    gap: Spacing.sm,
  },
  mealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  mealIconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: `${Colors.accentAmber}1F`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealTextWrap: {
    flex: 1,
  },
  mealName: {
    ...Typography.body,
    fontWeight: '600',
  },
  mealTime: {
    ...Typography.caption,
  },
  mealProtein: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.accentMint,
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
  recipeCard: {
    gap: Spacing.xs,
  },
  recipeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  recipeTitle: {
    ...Typography.label,
  },
  recipeName: {
    ...Typography.body,
    fontWeight: '700',
  },
  recipeDetail: {
    ...Typography.bodySecondary,
  },
});
