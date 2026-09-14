import { StyleSheet, Text, View, ViewStyle } from 'react-native';

import { Colors, Radius, Spacing } from '@/constants/theme';

export function Badge({ label, style }: { label: string; style?: ViewStyle }) {
  return (
    <View style={[styles.badge, style]}>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: Colors.accentCoral,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
