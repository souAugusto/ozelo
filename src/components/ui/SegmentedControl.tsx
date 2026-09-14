import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Gradient, Radius, Spacing } from '@/constants/theme';

type SegmentedControlProps<T extends string> = {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
};

/** 3-level intensity selector (leve/moderado/forte) with gradient fill on the active segment. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <View style={styles.row}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable key={option.value} style={styles.segmentWrap} onPress={() => onChange(option.value)}>
            {active ? (
              <LinearGradient
                colors={Gradient.colors}
                start={Gradient.start}
                end={Gradient.end}
                style={styles.segment}
              >
                <Text style={styles.activeLabel}>{option.label}</Text>
              </LinearGradient>
            ) : (
              <View style={[styles.segment, styles.inactive]}>
                <Text style={styles.inactiveLabel}>{option.label}</Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  segmentWrap: {
    flex: 1,
  },
  segment: {
    borderRadius: Radius.sm,
    paddingVertical: Spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inactive: {
    backgroundColor: Colors.cardElevated,
  },
  activeLabel: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  inactiveLabel: {
    color: Colors.textSecondary,
    fontWeight: '600',
    fontSize: 14,
  },
});
