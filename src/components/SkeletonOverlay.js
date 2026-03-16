import React from 'react';
import Svg, { Circle, Line, Text as SvgText } from 'react-native-svg';
import { COLORS } from '../constants/theme';

// MediaPipe Pose 33-landmark connection map
const CONNECTIONS = [
  // Torso
  [11, 12], // shoulders
  [11, 23], // left shoulder → left hip
  [12, 24], // right shoulder → right hip
  [23, 24], // hips
  // Left arm
  [11, 13], [13, 15],
  // Right arm
  [12, 14], [14, 16],
  // Left leg
  [23, 25], [25, 27],
  // Right leg
  [24, 26], [26, 28],
  // Left foot
  [27, 29], [27, 31],
  // Right foot
  [28, 30], [28, 32],
  // Face
  [0, 1], [0, 4], [1, 2], [2, 3], [4, 5], [5, 6],
  [9, 10], // mouth
];

// Map issue IDs to the landmark indices they affect
const ISSUE_LANDMARKS = {
  forward_lean: [11, 12, 23, 24],  // shoulders + hips
  butt_wink: [23, 24, 25, 26],     // hips + knees
  hip_shift: [23, 24],              // hips
  hip_hike: [23, 24],               // hips
  ankle_cave: [25, 26, 27, 28],    // knees + ankles
  shoulder_shrug: [11, 12],         // shoulders
  bar_rotation: [15, 16],           // wrists
  wrist_symmetry: [15, 16],        // wrists
};

// Map issue IDs to the connections they affect
const ISSUE_CONNECTIONS = {
  forward_lean: [[11, 23], [12, 24]],
  butt_wink: [[23, 25], [24, 26]],
  hip_shift: [[23, 24]],
  hip_hike: [[23, 24]],
  ankle_cave: [[25, 27], [26, 28]],
  shoulder_shrug: [[11, 12]],
  bar_rotation: [[15, 16]],
  wrist_symmetry: [[15, 16]],
};

const SEVERITY_COLORS = {
  mild: COLORS.success,
  moderate: '#F59E0B',
  severe: COLORS.accent,
};

const MEASUREMENT_LABELS = {
  forward_lean: { landmark: 23, label: '°' },
  butt_wink: { landmark: 23, label: '°' },
  hip_shift: { landmark: 23, label: '%' },
  hip_hike: { landmark: 23, label: '%' },
  ankle_cave: { landmark: 25, label: '°' },
  shoulder_shrug: { landmark: 11, label: '%' },
  bar_rotation: { landmark: 15, label: '°' },
  wrist_symmetry: { landmark: 15, label: '%' },
};

export default function SkeletonOverlay({
  landmarks,
  issues = [],
  width,
  height,
  showMeasurements = false,
}) {
  if (!landmarks?.length || !width || !height) return null;

  // Build a set of affected landmark indices and connection keys per severity
  const landmarkSeverity = {};
  const connectionSeverity = {};

  for (const issue of issues) {
    const severity = issue.severity;
    const affectedLandmarks = ISSUE_LANDMARKS[issue.id] || [];
    const affectedConnections = ISSUE_CONNECTIONS[issue.id] || [];

    for (const idx of affectedLandmarks) {
      if (!landmarkSeverity[idx] || severityRank(severity) > severityRank(landmarkSeverity[idx])) {
        landmarkSeverity[idx] = severity;
      }
    }

    for (const [a, b] of affectedConnections) {
      const key = `${a}-${b}`;
      if (!connectionSeverity[key] || severityRank(severity) > severityRank(connectionSeverity[key])) {
        connectionSeverity[key] = severity;
      }
    }
  }

  const jointRadius = Math.max(3, Math.min(width, height) * 0.012);
  const strokeWidth = Math.max(1.5, Math.min(width, height) * 0.006);

  return (
    <Svg width={width} height={height}>
      {/* Connections */}
      {CONNECTIONS.map(([a, b]) => {
        const la = landmarks[a];
        const lb = landmarks[b];
        if (!la || !lb || la.visibility < 0.5 || lb.visibility < 0.5) return null;

        const key = `${a}-${b}`;
        const severity = connectionSeverity[key];
        const color = severity ? SEVERITY_COLORS[severity] : COLORS.primary;
        const sw = severity ? strokeWidth * 1.5 : strokeWidth;

        return (
          <Line
            key={key}
            x1={la.x * width}
            y1={la.y * height}
            x2={lb.x * width}
            y2={lb.y * height}
            stroke={color}
            strokeWidth={sw}
            strokeOpacity={0.85}
            strokeLinecap="round"
          />
        );
      })}

      {/* Joints */}
      {landmarks.map((lm, idx) => {
        if (lm.visibility < 0.5) return null;

        const severity = landmarkSeverity[idx];
        const color = severity ? SEVERITY_COLORS[severity] : COLORS.primary;
        const r = severity ? jointRadius * 1.4 : jointRadius;

        return (
          <Circle
            key={`joint-${idx}`}
            cx={lm.x * width}
            cy={lm.y * height}
            r={r}
            fill={color}
            opacity={0.9}
          />
        );
      })}

      {/* Measurement labels */}
      {showMeasurements && issues.map((issue) => {
        const meta = MEASUREMENT_LABELS[issue.id];
        if (!meta || issue.measurement == null) return null;

        const lm = landmarks[meta.landmark];
        if (!lm || lm.visibility < 0.5) return null;

        const val = typeof issue.measurement === 'number' && issue.measurement < 1
          ? `${(issue.measurement * 100).toFixed(1)}${meta.label}`
          : `${issue.measurement}${meta.label}`;

        return (
          <SvgText
            key={`meas-${issue.id}`}
            x={lm.x * width + jointRadius * 2.5}
            y={lm.y * height - jointRadius}
            fill={SEVERITY_COLORS[issue.severity] || COLORS.primary}
            fontSize={Math.max(10, width * 0.032)}
            fontWeight="bold"
          >
            {val}
          </SvgText>
        );
      })}
    </Svg>
  );
}

function severityRank(s) {
  return s === 'severe' ? 3 : s === 'moderate' ? 2 : s === 'mild' ? 1 : 0;
}
