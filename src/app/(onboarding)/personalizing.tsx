import { IconCircleCheck, IconSparkles } from '@tabler/icons-react-native';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { OnboardingScreen } from '@/components/onboarding/OnboardingScreen';
import { GradientIconTile } from '@/components/ui/Avatar';
import { Colors, IconSize, Spacing, Typography } from '@/constants/theme';

const CHECKLIST = [
  'Lembretes configurados',
  'Metas calculadas',
  'Monitor intestinal ativado',
];

export default function PersonalizingStep() {
  const [doneCount, setDoneCount] = useState(0);

  useEffect(() => {
    if (doneCount >= CHECKLIST.length) {
      const redirect = setTimeout(() => router.replace('/(onboarding)/paywall'), 600);
      return () => clearTimeout(redirect);
    }
    const timer = setTimeout(() => setDoneCount((count) => count + 1), 700);
    return () => clearTimeout(timer);
  }, [doneCount]);

  return (
    <OnboardingScreen scrollable={false}>
      <View style={styles.center}>
        <GradientIconTile>
          <IconSparkles size={30} color="#FFFFFF" strokeWidth={1.75} />
        </GradientIconTile>
        <Text style={Typography.title}>Montando seu plano</Text>
        <View style={styles.checklist}>
          {CHECKLIST.map((item, index) => {
            const done = index < doneCount;
            return (
              <View key={item} style={styles.checklistRow}>
                <IconCircleCheck
                  size={IconSize.md}
                  color={done ? Colors.accentMint : Colors.cardBorder}
                  strokeWidth={1.75}
                />
                <Text style={[styles.checklistLabel, done && styles.checklistLabelDone]}>{item}</Text>
              </View>
            );
          })}
        </View>
      </View>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
  },
  checklist: {
    gap: Spacing.md,
    alignSelf: 'stretch',
  },
  checklistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  checklistLabel: {
    ...Typography.body,
    color: Colors.textMuted,
  },
  checklistLabelDone: {
    color: Colors.textPrimary,
  },
});
