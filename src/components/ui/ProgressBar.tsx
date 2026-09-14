import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { Colors, Gradient, Radius, Spacing } from '@/constants/theme';

/** Segmented progress bar for the onboarding funnel (6-8 steps). */
export function SegmentedProgressBar({ step, totalSteps }: { step: number; totalSteps: number }) {
  return (
    <View style={styles.segmentedRow}>
      {Array.from({ length: totalSteps }).map((_, index) => {
        const filled = index < step;
        return filled ? (
          <LinearGradient
            key={index}
            colors={Gradient.colors}
            start={Gradient.start}
            end={Gradient.end}
            style={styles.segment}
          />
        ) : (
          <View key={index} style={[styles.segment, styles.segmentEmpty]} />
        );
      })}
    </View>
  );
}

/** Linear progress bar (e.g. protein/water goal, weight trend). */
export function LinearProgressBar({ progress }: { progress: number }) {
  const clamped = Math.max(0, Math.min(1, progress));
  return (
    <View style={styles.track}>
      <LinearGradient
        colors={Gradient.colors}
        start={Gradient.start}
        end={Gradient.end}
        style={[styles.fill, { width: `${clamped * 100}%` }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  segmentedRow: {
    flexDirection: 'row',
    gap: Spacing.xxs,
  },
  segment: {
    flex: 1,
    height: 4,
    borderRadius: Radius.pill,
  },
  segmentEmpty: {
    backgroundColor: Colors.cardBorder,
  },
  track: {
    height: 8,
    borderRadius: Radius.pill,
    backgroundColor: Colors.cardBorder,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: Radius.pill,
  },
});
