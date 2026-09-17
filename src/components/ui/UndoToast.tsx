import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BorderWidth, Colors, Radius, Spacing } from '@/constants/theme';

type UndoToastProps = {
  visible: boolean;
  message: string;
  onUndo: () => void;
};

/** Bottom toast shown for the 5s grace period after a delete, before it's committed. */
export function UndoToast({ visible, message, onUndo }: UndoToastProps) {
  if (!visible) return null;

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <View style={styles.toast}>
        <Text style={styles.message}>{message}</Text>
        <Pressable onPress={onUndo} hitSlop={8}>
          <Text style={styles.undo}>Desfazer</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
    backgroundColor: Colors.cardElevated,
    borderWidth: BorderWidth.hairline,
    borderColor: Colors.cardBorder,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    maxWidth: 420,
    width: '100%',
  },
  message: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '500',
    flexShrink: 1,
  },
  undo: {
    color: Colors.accentMint,
    fontWeight: '700',
    fontSize: 14,
  },
});
