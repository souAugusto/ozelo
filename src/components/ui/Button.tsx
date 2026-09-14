import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';

import { BorderWidth, Colors, Gradient, Radius, Spacing } from '@/constants/theme';

type ButtonProps = {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
};

/** Primary CTA: brand gradient background, white text. */
export function PrimaryButton({ label, onPress, disabled, loading, style }: ButtonProps) {
  return (
    <Pressable onPress={onPress} disabled={disabled || loading} style={style}>
      {({ pressed }) => (
        <LinearGradient
          colors={Gradient.colors}
          start={Gradient.start}
          end={Gradient.end}
          style={[styles.base, (disabled || pressed) && styles.pressedOpacity]}
        >
          {loading ? (
            <ActivityIndicator color={Colors.textOnGradient} />
          ) : (
            <Text style={styles.primaryLabel}>{label}</Text>
          )}
        </LinearGradient>
      )}
    </Pressable>
  );
}

/** Secondary action: transparent background, hairline border. */
export function SecondaryButton({ label, onPress, disabled, loading, style }: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        styles.secondary,
        (disabled || pressed) && styles.pressedOpacity,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={Colors.buttonSecondaryText} />
      ) : (
        <Text style={styles.secondaryLabel}>{label}</Text>
      )}
    </Pressable>
  );
}

/** Text-only destructive action (e.g. "Sair da conta"). */
export function TextDangerButton({ label, onPress, disabled }: ButtonProps) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={styles.dangerWrap}>
      <Text style={styles.dangerLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  pressedOpacity: {
    opacity: 0.85,
  },
  primaryLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: BorderWidth.hairline,
    borderColor: Colors.cardBorder,
  },
  secondaryLabel: {
    color: Colors.buttonSecondaryText,
    fontSize: 16,
    fontWeight: '600',
  },
  dangerWrap: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  dangerLabel: {
    color: Colors.accentCoral,
    fontSize: 15,
    fontWeight: '600',
  },
});
