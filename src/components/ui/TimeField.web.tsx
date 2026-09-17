import type { CSSProperties } from 'react';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { BorderWidth, Colors, Radius, Spacing } from '@/constants/theme';

type TimeFieldProps = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
};

let pickerStyleInjected = false;

/** Injects the one-time CSS needed to make the browser's clock icon visible
 * on Ozelo's dark background — `::-webkit-calendar-picker-indicator` can
 * only be reached via a real stylesheet, not inline styles. */
function useDarkTimePickerStyle() {
  useEffect(() => {
    if (pickerStyleInjected || typeof document === 'undefined') return;
    pickerStyleInjected = true;
    const style = document.createElement('style');
    style.textContent = `
      input[data-ozelo-time]::-webkit-calendar-picker-indicator {
        filter: invert(1);
        cursor: pointer;
      }
    `;
    document.head.appendChild(style);
  }, []);
}

/** Web renders the browser/OS's native time picker (a proper clock or wheel
 * UI) instead of asking the user to type "HH:MM" by hand. */
export function TimeField({ label, value, onChange }: TimeFieldProps) {
  useDarkTimePickerStyle();

  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <input
        type="time"
        data-ozelo-time="true"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        style={{ ...webInputStyle, colorScheme: 'dark' }}
      />
    </View>
  );
}

const webInputStyle: CSSProperties = {
  backgroundColor: Colors.card,
  border: `${BorderWidth.hairline}px solid ${Colors.cardBorder}`,
  borderRadius: Radius.md,
  paddingLeft: Spacing.md,
  paddingRight: Spacing.md,
  paddingTop: Spacing.sm,
  paddingBottom: Spacing.sm,
  fontSize: 16,
  color: Colors.textPrimary,
  fontFamily: 'inherit',
  width: '100%',
  boxSizing: 'border-box',
};

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.xxs,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
});
