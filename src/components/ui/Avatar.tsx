import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { StyleSheet, Text } from 'react-native';

import { Gradient, Radius } from '@/constants/theme';

export function Avatar({ initials, size = 44 }: { initials: string; size?: number }) {
  return (
    <LinearGradient
      colors={Gradient.colors}
      start={Gradient.start}
      end={Gradient.end}
      style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }]}
    >
      <Text style={[styles.initials, { fontSize: size * 0.36 }]}>{initials}</Text>
    </LinearGradient>
  );
}

/** 60px rounded-square icon tile used on the onboarding welcome screen. */
export function GradientIconTile({
  children,
  size = 60,
}: {
  children: ReactNode;
  size?: number;
}) {
  return (
    <LinearGradient
      colors={Gradient.colors}
      start={Gradient.start}
      end={Gradient.end}
      style={[styles.tile, { width: size, height: size, borderRadius: Radius.lg }]}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  tile: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
