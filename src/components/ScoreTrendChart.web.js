/**
 * ScoreTrendChart.web.js
 * Web-safe implementation using react-native-svg (SVG is native to the browser).
 * Matches the same prop interface as ScoreTrendChart.js (native version).
 *
 * Props:
 *   data       — array of { date: string, score: number } sorted oldest → newest
 *   liftLabel  — e.g. "Squat"
 *   width      — optional width (defaults to 320)
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Polyline, Line, Text as SvgText, Circle } from 'react-native-svg';
import { COLORS, SPACING, RADIUS } from '../constants/theme';

const CHART_HEIGHT = 80;
const PADDING_LEFT = 28;
const PADDING_RIGHT = 12;
const PADDING_TOP = 10;
const PADDING_BOTTOM = 20;

export default function ScoreTrendChart({ data, liftLabel, width = 320 }) {
  if (!data || data.length < 2) return null;

  const points = data.slice(-10);
  const scores = points.map(p => p.score);
  const minScore = Math.max(0, Math.min(...scores) - 8);
  const maxScore = Math.min(100, Math.max(...scores) + 8);
  const scoreRange = maxScore - minScore || 1;

  const innerW = width - PADDING_LEFT - PADDING_RIGHT;
  const innerH = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM;

  // Map score → y coordinate (inverted: higher score = lower y)
  const toY = score => PADDING_TOP + innerH * (1 - (score - minScore) / scoreRange);
  // Map index → x coordinate
  const toX = i => PADDING_LEFT + (i / (points.length - 1)) * innerW;

  const polyPoints = points
    .map((p, i) => `${toX(i)},${toY(p.score)}`)
    .join(' ');

  // X-axis labels: show first, middle, last
  const labelIndices = [0, Math.floor(points.length / 2), points.length - 1];

  return (
    <View style={styles.container}>
      {liftLabel && (
        <Text style={styles.label}>{liftLabel.toUpperCase()} TREND</Text>
      )}

      <Svg width={width} height={CHART_HEIGHT}>
        {/* Horizontal grid lines */}
        {[0, 0.5, 1].map((t, i) => {
          const y = PADDING_TOP + innerH * t;
          const val = Math.round(maxScore - t * scoreRange);
          return (
            <React.Fragment key={i}>
              <Line
                x1={PADDING_LEFT} y1={y}
                x2={PADDING_LEFT + innerW} y2={y}
                stroke={COLORS.border}
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <SvgText
                x={PADDING_LEFT - 4} y={y + 4}
                fontSize="8" fill={COLORS.textTertiary}
                textAnchor="end"
              >
                {val}
              </SvgText>
            </React.Fragment>
          );
        })}

        {/* Line */}
        <Polyline
          points={polyPoints}
          fill="none"
          stroke={COLORS.primary}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Dots */}
        {points.map((p, i) => (
          <Circle
            key={i}
            cx={toX(i)} cy={toY(p.score)}
            r="3"
            fill={COLORS.background}
            stroke={COLORS.primary}
            strokeWidth="2"
          />
        ))}

        {/* X-axis date labels */}
        {labelIndices.map(i => {
          const d = new Date(points[i].date);
          const label = `${d.getMonth() + 1}/${d.getDate()}`;
          return (
            <SvgText
              key={i}
              x={toX(i)} y={CHART_HEIGHT - 4}
              fontSize="8" fill={COLORS.textTertiary}
              textAnchor="middle"
            >
              {label}
            </SvgText>
          );
        })}
      </Svg>

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
