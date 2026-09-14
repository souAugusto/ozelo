import { ComponentType } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BorderWidth, Colors, IconSize, Radius, Spacing } from '@/constants/theme';

type TablerIconComponent = ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

type QuickSelectButtonProps = {
  label: string;
  icon: TablerIconComponent;
  color: string;
  selected?: boolean;
  onPress: () => void;
};

/** 2x2 quick-select tile used in bowel tracking and symptoms screens. */
export function QuickSelectButton({ label, icon: IconComponent, color, selected, onPress }: QuickSelectButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.tile, selected && { borderColor: color, borderWidth: BorderWidth.selected }]}
    >
      <View style={[styles.iconWrap, { backgroundColor: `${color}1F` }]}>
        <IconComponent size={IconSize.lg} color={color} strokeWidth={1.75} />
      </View>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flexBasis: '48%',
    flexGrow: 1,
    backgroundColor: Colors.card,
    borderWidth: BorderWidth.hairline,
    borderColor: Colors.cardBorder,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
});
