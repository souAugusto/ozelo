import {
  IconDroplet,
  IconMeat,
  IconStethoscope,
  IconToiletPaper,
  IconVaccine,
} from '@tabler/icons-react-native';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LinearProgressBar } from '@/components/ui/ProgressBar';
import { Avatar } from '@/components/ui/Avatar';
import { Card, GradientCard } from '@/components/ui/Card';
import { ListRow } from '@/components/ui/ListRow';
import { useAuth } from '@/context/AuthProvider';
import { getTodayHydrationTotal, getTodayProteinTotal } from '@/lib/queries';
import { Colors, IconSize, Spacing, Typography } from '@/constants/theme';

function initialsFor(name: string | null) {
  if (!name) return '·';
  const parts = name.trim().split(' ');
  return (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '');
}

export default function DashboardScreen() {
  const { session, profile } = useAuth();
  const [proteinTotal, setProteinTotal] = useState(0);
  const [hydrationTotal, setHydrationTotal] = useState(0);

  useFocusEffect(
    useCallback(() => {
      if (!session) return;
      getTodayProteinTotal(session.user.id).then(setProteinTotal).catch(() => {});
      getTodayHydrationTotal(session.user.id).then(setHydrationTotal).catch(() => {});
    }, [session])
  );

  const proteinGoal = profile?.protein_goal_g ?? 90;
  const waterGoal = profile?.water_goal_ml ?? 2000;
  const firstName = profile?.full_name?.split(' ')[0] ?? 'por aí';
  const reminderTime = profile?.reminder_time?.slice(0, 5) ?? '--:--';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={Typography.subtitle}>Sua semana</Text>
            <Text style={Typography.title}>Olá, {firstName}</Text>
          </View>
          <Pressable onPress={() => router.push('/profile')}>
            <Avatar initials={initialsFor(profile?.full_name ?? null)} />
          </Pressable>
        </View>

        <GradientCard>
          <View style={styles.nextDoseRow}>
            <View style={styles.nextDoseIconWrap}>
              <IconVaccine size={IconSize.lg} color="#FFFFFF" strokeWidth={1.75} />
            </View>
            <View>
              <Text style={styles.nextDoseLabel}>Próxima aplicação</Text>
              <Text style={styles.nextDoseValue}>Hoje · {reminderTime}</Text>
            </View>
          </View>
        </GradientCard>

        <View style={styles.grid}>
          <Card style={styles.gridCard}>
            <IconDroplet size={IconSize.md} color={Colors.accentMint} strokeWidth={1.75} />
            <Text style={styles.gridLabel}>Hidratação</Text>
            <Text style={styles.gridValue}>
              {Math.round(hydrationTotal)} / {waterGoal} ml
            </Text>
            <LinearProgressBar progress={hydrationTotal / waterGoal} />
          </Card>
          <Card style={styles.gridCard}>
            <IconMeat size={IconSize.md} color={Colors.accentAmber} strokeWidth={1.75} />
            <Text style={styles.gridLabel}>Proteína</Text>
            <Text style={styles.gridValue}>
              {Math.round(proteinTotal)} / {proteinGoal} g
            </Text>
            <LinearProgressBar progress={proteinTotal / proteinGoal} />
          </Card>
        </View>

        <View style={styles.sections}>
          <ListRow
            icon={IconToiletPaper}
            iconColor={Colors.accentMint}
            title="Controle intestinal"
            subtitle="Ver histórico e registrar"
            onPress={() => router.push('/(tabs)/bowel')}
          />
          <ListRow
            icon={IconStethoscope}
            iconColor={Colors.accentCoral}
            title="Sintomas"
            subtitle="Ver histórico e registrar"
            onPress={() => router.push('/(tabs)/symptoms')}
          />
          <ListRow
            icon={IconVaccine}
            iconColor={Colors.accentAmber}
            title="Progresso"
            subtitle="Peso, medidas e fotos"
            onPress={() => router.push('/(tabs)/progress')}
          />
        </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nextDoseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  nextDoseIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextDoseLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '600',
  },
  nextDoseValue: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  gridCard: {
    flex: 1,
    gap: Spacing.xs,
  },
  gridLabel: {
    ...Typography.bodySecondary,
  },
  gridValue: {
    ...Typography.body,
    fontWeight: '700',
  },
  sections: {
    gap: Spacing.sm,
  },
});
