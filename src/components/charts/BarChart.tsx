import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, Line as SvgLine, LinearGradient as SvgLinearGradient, Rect, Stop } from 'react-native-svg';

import { Colors, Gradient, Spacing } from '@/constants/theme';

type BarChartPoint = {
  label: string;
  value: number;
};

type BarChartProps = {
  data: BarChartPoint[];
  height?: number;
  /** Draws a dashed reference line at this value (e.g. the daily protein goal). */
  goal?: number;
};

const PADDING_X = 8;
const PADDING_Y = 12;
const BAR_RADIUS = 4;

/** Reusable bar chart (used for protein-per-day in Diário and the onboarding showcase). */
export function BarChart({ data, height = 180, goal }: BarChartProps) {
  const [width, setWidth] = useState(0);

  if (data.length === 0) return null;

  const maxValue = Math.max(...data.map((d) => d.value), goal ?? 0) * 1.15 || 1;
  const chartWidth = Math.max(width - PADDING_X * 2, 1);
  const chartHeight = height - PADDING_Y * 2;
  const gap = 10;
  const barWidth = Math.max((chartWidth - gap * (data.length - 1)) / data.length, 4);

  const goalY = goal !== undefined ? PADDING_Y + chartHeight - (goal / maxValue) * chartHeight : null;

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={{ height }}>
      {width > 0 && (
        <Svg width={width} height={height}>
          <Defs>
            <SvgLinearGradient id="barFill" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={Gradient.colors[0]} />
              <Stop offset="1" stopColor={Gradient.colors[1]} />
            </SvgLinearGradient>
          </Defs>
          {goalY !== null && (
            <SvgLine
              x1={PADDING_X}
              y1={goalY}
              x2={width - PADDING_X}
              y2={goalY}
              stroke={Colors.textMuted}
              strokeWidth={1}
              strokeDasharray="4 4"
            />
          )}
          {data.map((point, index) => {
            const barHeight = Math.max((point.value / maxValue) * chartHeight, 2);
            const x = PADDING_X + index * (barWidth + gap);
            const y = PADDING_Y + chartHeight - barHeight;
            return (
              <Rect
                key={index}
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={BAR_RADIUS}
                fill="url(#barFill)"
              />
            );
          })}
        </Svg>
      )}
      <View style={styles.labelRow}>
        {data.map((point, i) => (
          <Text key={i} style={styles.labelText} numberOfLines={1}>
            {point.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xs,
    marginTop: Spacing.xxs,
  },
  labelText: {
    color: Colors.textMuted,
    fontSize: 10,
    flex: 1,
    textAlign: 'center',
  },
});
