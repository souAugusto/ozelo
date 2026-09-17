import { IconPencil, IconTrash } from '@tabler/icons-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { Colors, IconSize, Spacing } from '@/constants/theme';

type RowActionsProps = {
  onEdit: () => void;
  onDelete: () => void;
};

/** Edit/delete icon pair attached to an editable history row. */
export function RowActions({ onEdit, onDelete }: RowActionsProps) {
  return (
    <View style={styles.row}>
      <Pressable onPress={onEdit} hitSlop={8} style={styles.button}>
        <IconPencil size={IconSize.sm} color={Colors.textSecondary} strokeWidth={1.75} />
      </Pressable>
      <Pressable onPress={onDelete} hitSlop={8} style={styles.button}>
        <IconTrash size={IconSize.sm} color={Colors.accentCoral} strokeWidth={1.75} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  button: {
    padding: 2,
  },
});
