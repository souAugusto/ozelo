import { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SegmentedProgressBar } from '@/components/ui/ProgressBar';
import { Colors, Spacing } from '@/constants/theme';

const TOTAL_FUNNEL_STEPS = 4;

type OnboardingScreenProps = PropsWithChildren<{
  /** Current step (1-based) out of TOTAL_FUNNEL_STEPS. Omit to hide the progress bar
   * (used on the welcome, showcase, personalizing and paywall screens). */
  step?: number;
  scrollable?: boolean;
}>;

export function OnboardingScreen({ step, scrollable = true, children }: OnboardingScreenProps) {
  const Container = scrollable ? ScrollView : View;
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {step ? (
        <View style={styles.progressWrap}>
          <SegmentedProgressBar step={step} totalSteps={TOTAL_FUNNEL_STEPS} />
        </View>
      ) : null}
      <Container
        style={styles.container}
        contentContainerStyle={scrollable ? styles.scrollContent : undefined}
      >
        {children}
      </Container>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  progressWrap: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  scrollContent: {
    paddingVertical: Spacing.lg,
    gap: Spacing.lg,
    flexGrow: 1,
  },
});
