import { IconCheck } from '@tabler/icons-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BorderWidth, Colors, IconSize, Radius, Spacing } from '@/constants/theme';

type SelectOptionProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  /** 'radio' for single-choice steps, 'checkbox' for multi-select steps. */
  variant?: 'radio' | 'checkbox';
};

/** Onboarding list option row (single or multi-select). */
export function SelectOption({ label, selected, onPress, variant = 'radio' }: SelectOptionProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.row, selected && styles.rowSelected]}
    >
      <Text style={styles.label}>{label}</Text>
      {variant === 'radio' ? (
        selected ? (
          <View style={styles.radioFilled}>
            <IconCheck size={IconSize.sm} color={Colors.background} strokeWidth={2.5} />
          </View>
        ) : (
          <View style={styles.radioEmpty} />
        )
      ) : selected ? (
        <View style={styles.checkboxFilled}>
          <IconCheck size={IconSize.sm} color={Colors.background} strokeWidth={2.5} />
        </View>
      ) : (
        <View style={styles.checkboxEmpty} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    borderWidth: BorderWidth.hairline,
    borderColor: Colors.cardBorder,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  rowSelected: {
    borderColor: Colors.gradientStart,
    borderWidth: BorderWidth.selected,
  },
  label: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '500',
    flexShrink: 1,
  },
  radioEmpty: {
    width: 22,
    height: 22,
    borderRadius: Radius.pill,
    borderWidth: BorderWidth.hairline,
    borderColor: Colors.cardBorder,
  },
  radioFilled: {
    width: 22,
    height: 22,
    borderRadius: Radius.pill,
    backgroundColor: Colors.accentMint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxEmpty: {
    width: 22,
    height: 22,
    borderRadius: Radius.sm - 2,
    borderWidth: BorderWidth.hairline,
    borderColor: Colors.cardBorder,
  },
  checkboxFilled: {
    width: 22,
    height: 22,
    borderRadius: Radius.sm - 2,
    backgroundColor: Colors.accentMint,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
