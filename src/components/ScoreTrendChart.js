import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { COLORS, SPACING, RADIUS } from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * ScoreTrendChart
 *
 * Props:
 *   data       — array of { date: string, score: number } sorted oldest → newest
 *   liftLabel  — e.g. "Squat"
 *   width      — optional chart width (defaults to screen width - 2 * SPACING.m)
 */
export default function ScoreTrendChart({ data, liftLabel, width }) {
  if (!data || data.length < 2) return null;

  const chartWidth = width ?? SCREEN_WIDTH - SPACING.m * 2;

  // Keep last 10 points max so the chart stays readable
  const points = data.slice(-10);
  const scores = points.map(p => p.score);
  const labels = points.map((p, i) => {
    // Show a label every other point to avoid crowding
    if (i % 2 !== 0) return '';
    const d = new Date(p.date);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  });

  const minScore = Math.max(0, Math.min(...scores) - 5);
  const maxScore = Math.min(100, Math.max(...scores) + 5);

  return (
    <View style={styles.container}>
      {liftLabel && (
        <Text style={styles.label}>{liftLabel.toUpperCase()} TREND</Text>
      )}
      <LineChart
        data={{ labels, datasets: [{ data: scores }] }}
        width={chartWidth}
        height={120}
        yAxisSuffix=""
        fromZero={false}
        chartConfig={{
          backgroundGradientFrom: COLORS.surface,
          backgroundGradientTo: COLORS.surface,
          backgroundGradientFromOpacity: 0,
          backgroundGradientToOpacity: 0,
          decimalPlaces: 0,
          color: () => COLORS.primary,
          labelColor: () => COLORS.textTertiary,
          strokeWidth: 2,
          propsForDots: {
            r: '4',
            strokeWidth: '2',
            stroke: COLORS.primary,
            fill: COLORS.background,
          },
          propsForBackgroundLines: {
            stroke: COLORS.border,
            strokeDasharray: '4',
          },
        }}
        bezier
        withShadow={false}
        withInnerLines={true}
        withOuterLines={false}
        style={styles.chart}
        yLabelsOffset={4}
      />
      <View style={styles.rangeRow}>
        <Text style={styles.rangeText}>Min {Math.min(...scores)}</Text>
        <Text style={styles.rangeText}>Max {Math.max(...scores)}</Text>
        <Text style={styles.rangeText}>Target 85+</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.l,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingTop: SPACING.m,
    paddingBottom: SPACING.s,
    overflow: 'hidden',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textTertiary,
    letterSpacing: 1.5,
    marginLeft: SPACING.m,
    marginBottom: SPACING.s,
  },
  chart: {
    marginLeft: -SPACING.s,
  },
  rangeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.m,
    marginTop: 2,
  },
  rangeText: {
    fontSize: 10,
    color: COLORS.textTertiary,
    fontWeight: '500',
  },
});
