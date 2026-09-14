import { IconChevronLeft } from '@tabler/icons-react-native';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, IconSize, Spacing } from '@/constants/theme';

export function ScreenHeader({ title }: { title: string }) {
  return (
    <View style={styles.row}>
      <Pressable onPress={() => router.back()} hitSlop={12}>
        <IconChevronLeft size={IconSize.lg} color={Colors.textPrimary} strokeWidth={1.75} />
      </Pressable>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.spacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  spacer: {
    width: IconSize.lg,
  },
});
