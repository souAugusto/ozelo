import { LinearGradient } from 'expo-linear-gradient';
import { PropsWithChildren } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { BorderWidth, Colors, Gradient, Radius, Spacing } from '@/constants/theme';

type CardProps = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  elevated?: boolean;
}>;

/** Standard dark card used across every section of the app. */
export function Card({ children, style, elevated }: CardProps) {
  return (
    <View style={[styles.card, elevated && styles.elevated, style]}>{children}</View>
  );
}

/** Highlight card with the brand purple-to-cyan gradient background. */
export function GradientCard({ children, style }: CardProps) {
  return (
    <LinearGradient
      colors={Gradient.colors}
      start={Gradient.start}
      end={Gradient.end}
      style={[styles.card, styles.gradientCard, style]}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderWidth: BorderWidth.hairline,
    borderColor: Colors.cardBorder,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  elevated: {
    backgroundColor: Colors.cardElevated,
  },
  gradientCard: {
    borderWidth: 0,
  },
});
