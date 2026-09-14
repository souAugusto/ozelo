import Slider from '@react-native-community/slider';
import { StyleSheet, Text, View } from 'react-native';

import { Colors, Spacing } from '@/constants/theme';

type WeightSliderProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
};

/** Interactive weight picker used in the onboarding funnel. */
export function WeightSlider({ label, value, onChange, min = 40, max = 200 }: WeightSliderProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value} kg</Text>
      </View>
      <Slider
        value={value}
        onValueChange={onChange}
        minimumValue={min}
        maximumValue={max}
        step={1}
        minimumTrackTintColor={Colors.accentMint}
        maximumTrackTintColor={Colors.cardBorder}
        thumbTintColor={Colors.accentMint}
      />
      <View style={styles.rangeRow}>
        <Text style={styles.rangeLabel}>{min} kg</Text>
        <Text style={styles.rangeLabel}>{max} kg</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.xs,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  value: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  rangeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rangeLabel: {
    fontSize: 11,
    color: Colors.textMuted,
  },
});
