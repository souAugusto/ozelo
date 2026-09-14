import { IconChevronRight } from '@tabler/icons-react-native';
import { ComponentType } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BorderWidth, Colors, IconSize, Radius, Spacing } from '@/constants/theme';

type TablerIconComponent = ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

type ListRowProps = {
  icon: TablerIconComponent;
  iconColor?: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
};

/** Horizontal navigation card used for dashboard sections (bowel, symptoms, progress...). */
export function ListRow({ icon: IconComponent, iconColor = Colors.accentMint, title, subtitle, onPress }: ListRowProps) {
  return (
    <Pressable onPress={onPress} style={styles.row}>
      <View style={[styles.iconWrap, { backgroundColor: `${iconColor}1F` }]}>
        <IconComponent size={IconSize.lg} color={iconColor} strokeWidth={1.75} />
      </View>
      <View style={styles.textWrap}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <IconChevronRight size={IconSize.md} color={Colors.textSecondary} strokeWidth={1.75} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.card,
    borderWidth: BorderWidth.hairline,
    borderColor: Colors.cardBorder,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
});
