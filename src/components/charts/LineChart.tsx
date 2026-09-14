import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Line as SvgLine,
  LinearGradient as SvgLinearGradient,
  Path,
  Stop,
} from 'react-native-svg';

import { Colors, Spacing } from '@/constants/theme';

type LineChartPoint = {
  label: string;
  value: number;
};

type LineChartProps = {
  data: LineChartPoint[];
  height?: number;
  lineColor?: string;
  pointColor?: string;
};

const PADDING_X = 20;
const PADDING_Y = 24;

/** Reusable line chart (used in Progresso and the onboarding bowel-habit showcase). */
export function LineChart({
  data,
  height = 200,
  lineColor = '#00E5C7',
  pointColor = '#7C4DFF',
}: LineChartProps) {
  const [width, setWidth] = useState(0);

  if (data.length === 0) return null;

  const values = data.map((point) => point.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue || 1;

  const chartWidth = Math.max(width - PADDING_X * 2, 1);
  const chartHeight = height - PADDING_Y * 2;

  const points = data.map((point, index) => {
    const x = PADDING_X + (index / Math.max(data.length - 1, 1)) * chartWidth;
    const y = PADDING_Y + chartHeight - ((point.value - minValue) / range) * chartHeight;
    return { x, y, value: point.value, label: point.label };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - PADDING_Y} L ${points[0].x} ${height - PADDING_Y} Z`;

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={{ height }}>
      {width > 0 && (
        <Svg width={width} height={height}>
          <Defs>
            <SvgLinearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={lineColor} stopOpacity={0.25} />
              <Stop offset="1" stopColor={lineColor} stopOpacity={0} />
            </SvgLinearGradient>
          </Defs>
          <SvgLine
            x1={PADDING_X}
            y1={height - PADDING_Y}
            x2={width - PADDING_X}
            y2={height - PADDING_Y}
            stroke={Colors.cardBorder}
            strokeWidth={1}
          />
          <Path d={areaPath} fill="url(#areaFill)" stroke="none" />
          <Path d={linePath} fill="none" stroke={lineColor} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
          {points.map((p, i) => (
            <Circle key={i} cx={p.x} cy={p.y} r={4} fill={pointColor} />
          ))}
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
