import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, ActivityIndicator, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as VideoThumbnails from 'expo-video-thumbnails';
import {
  X, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Minus,
  AlertTriangle, CheckCircle,
} from 'lucide-react-native';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import { supabase } from '../lib/supabase';
import SkeletonOverlay from '../components/SkeletonOverlay';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const FRAME_WIDTH = (SCREEN_WIDTH - SPACING.m * 3) / 2;
const FRAME_HEIGHT = FRAME_WIDTH * (4 / 3);

const SEVERITY_COLORS = {
  mild: COLORS.success,
  moderate: '#F59E0B',
  severe: COLORS.accent,
};

const SEVERITY_RANK = { mild: 1, moderate: 2, severe: 3 };

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function CompareFrame({ keypoints, issues, storagePath, frameIndex, onPrev, onNext, total }) {
  const [thumbUri, setThumbUri] = useState(null);
  const frame = keypoints?.[frameIndex];

  useEffect(() => {
    if (!storagePath || !frame) return;
    let cancelled = false;

    (async () => {
      try {
        const { data } = await supabase.storage
          .from('session-videos')
          .createSignedUrl(storagePath, 3600);
        if (cancelled || !data?.signedUrl) return;

        const { uri } = await VideoThumbnails.getThumbnailAsync(data.signedUrl, {
          time: frame.timestamp_ms,
          quality: 0.7,
        });
        if (!cancelled) setThumbUri(uri);
      } catch (e) {
        console.warn('Compare thumb failed:', e.message);
      }
    })();

    return () => { cancelled = true; };
  }, [storagePath, frameIndex]);

  return (
    <View style={styles.frameCol}>
      <View style={styles.frameBox}>
        {thumbUri ? (
          <Image
            source={{ uri: thumbUri }}
            style={{ width: FRAME_WIDTH, height: FRAME_HEIGHT, borderRadius: RADIUS.s }}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.framePlaceholder, { width: FRAME_WIDTH, height: FRAME_HEIGHT }]} />
        )}
        {frame?.landmarks && (
          <View style={StyleSheet.absoluteFill}>
            <SkeletonOverlay
              landmarks={frame.landmarks}
              issues={issues}
              width={FRAME_WIDTH}
              height={FRAME_HEIGHT}
            />
          </View>
        )}
      </View>
      {/* Mini nav */}
      <View style={styles.miniNav}>
        <TouchableOpacity onPress={onPrev} disabled={frameIndex === 0} style={styles.miniNavBtn}>
          <ChevronLeft color={frameIndex === 0 ? COLORS.textTertiary : COLORS.text} size={16} />
        </TouchableOpacity>
        <Text style={styles.miniNavText}>{frameIndex + 1}/{total}</Text>
        <TouchableOpacity onPress={onNext} disabled={frameIndex === total - 1} style={styles.miniNavBtn}>
          <ChevronRight color={frameIndex === total - 1 ? COLORS.textTertiary : COLORS.text} size={16} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function IssueDiff({ currentIssues, previousIssues }) {
  const prevMap = {};
  for (const issue of previousIssues) {
    prevMap[issue.id] = issue;
  }
  const currMap = {};
  for (const issue of currentIssues) {
    currMap[issue.id] = issue;
  }

  const allIds = [...new Set([...Object.keys(prevMap), ...Object.keys(currMap)])];
  if (allIds.length === 0) {
    return (
      <View style={styles.diffRow}>
        <CheckCircle color={COLORS.success} size={14} />
        <Text style={styles.diffTextGood}>No issues in either session</Text>
      </View>
    );
  }

  return allIds.map((id) => {
    const prev = prevMap[id];
    const curr = currMap[id];

    if (prev && curr) {
      // Both sessions have this issue — improved, regressed, or same?
      const prevRank = SEVERITY_RANK[prev.severity] || 0;
      const currRank = SEVERITY_RANK[curr.severity] || 0;
      if (currRank < prevRank) {
        return (
          <View key={id} style={styles.diffRow}>
            <TrendingDown color={COLORS.success} size={14} />
            <Text style={styles.diffText}>
              <Text style={styles.diffLabel}>{curr.label}: </Text>
              <Text style={{ color: SEVERITY_COLORS[prev.severity] }}>{prev.severity}</Text>
              {' → '}
              <Text style={{ color: SEVERITY_COLORS[curr.severity] }}>{curr.severity}</Text>
            </Text>
          </View>
        );
      } else if (currRank > prevRank) {
        return (
          <View key={id} style={styles.diffRow}>
            <TrendingUp color={COLORS.accent} size={14} />
            <Text style={styles.diffText}>
              <Text style={styles.diffLabel}>{curr.label}: </Text>
              <Text style={{ color: SEVERITY_COLORS[prev.severity] }}>{prev.severity}</Text>
              {' → '}
              <Text style={{ color: SEVERITY_COLORS[curr.severity] }}>{curr.severity}</Text>
            </Text>
          </View>
        );
      } else {
        return (
          <View key={id} style={styles.diffRow}>
            <Minus color={COLORS.textTertiary} size={14} />
            <Text style={styles.diffText}>
              <Text style={styles.diffLabel}>{curr.label}: </Text>
              <Text style={{ color: SEVERITY_COLORS[curr.severity] }}>{curr.severity}</Text>
              {' (unchanged)'}
            </Text>
          </View>
        );
      }
    } else if (prev && !curr) {
      // Resolved
      return (
        <View key={id} style={styles.diffRow}>
          <CheckCircle color={COLORS.success} size={14} />
          <Text style={styles.diffText}>
            <Text style={[styles.diffLabel, { textDecorationLine: 'line-through' }]}>{prev.label}</Text>
            <Text style={{ color: COLORS.success }}> resolved</Text>
          </Text>
        </View>
      );
    } else {
      // New issue
      return (
        <View key={id} style={styles.diffRow}>
          <AlertTriangle color={SEVERITY_COLORS[curr.severity]} size={14} />
          <Text style={styles.diffText}>
            <Text style={styles.diffLabel}>{curr.label}: </Text>
            <Text style={{ color: SEVERITY_COLORS[curr.severity] }}>new ({curr.severity})</Text>
          </Text>
        </View>
      );
    }
  });
}

export default function CompareSessionScreen({ navigation, route }) {
  const { currentResults, previousResults, currentDate, previousDate, categoryLabel } = route.params;

  // Match angles that exist in both sessions
  const commonAngles = currentResults
    .filter(cr => previousResults.some(pr => pr.angle === cr.angle))
    .map(cr => cr.angle);

  const [selectedAngle, setSelectedAngle] = useState(commonAngles[0] ?? null);
  const [prevFrameIdx, setPrevFrameIdx] = useState(0);
  const [currFrameIdx, setCurrFrameIdx] = useState(0);

  const currentAngle = currentResults.find(r => r.angle === selectedAngle);
  const previousAngle = previousResults.find(r => r.angle === selectedAngle);

  // Reset frame indices when switching angle
  useEffect(() => {
    setPrevFrameIdx(0);
    setCurrFrameIdx(0);
  }, [selectedAngle]);

  // Compute overall scores
  const currentOverall = Math.round(
    currentResults.reduce((s, r) => s + r.symmetry_score, 0) / currentResults.length
  );
  const previousOverall = Math.round(
    previousResults.reduce((s, r) => s + r.symmetry_score, 0) / previousResults.length
  );
  const delta = currentOverall - previousOverall;

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>COMPARE</Text>
            <Text style={styles.headerSub}>{categoryLabel}</Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.closeBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <X color={COLORS.textTertiary} size={20} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Score comparison */}
          <View style={styles.scoreCompare}>
            <View style={styles.scoreBox}>
              <Text style={styles.scoreDateLabel}>{formatDate(previousDate)}</Text>
              <Text style={styles.scoreNum}>{previousOverall}</Text>
            </View>
            <View style={styles.deltaBox}>
              <Text style={styles.deltaArrow}>→</Text>
              <View style={[styles.deltaBadge, {
                backgroundColor: delta > 0 ? COLORS.successGlow : delta < 0 ? COLORS.accentGlow : COLORS.surface,
              }]}>
                <Text style={[styles.deltaText, {
                  color: delta > 0 ? COLORS.success : delta < 0 ? COLORS.accent : COLORS.textTertiary,
                }]}>
                  {delta > 0 ? '+' : ''}{delta}
                </Text>
              </View>
            </View>
            <View style={styles.scoreBox}>
              <Text style={styles.scoreDateLabel}>{formatDate(currentDate)}</Text>
              <Text style={styles.scoreNum}>{currentOverall}</Text>
            </View>
          </View>

          {/* Angle selector */}
          {commonAngles.length > 1 && (
            <View style={styles.angleTabs}>
              {commonAngles.map(angle => (
                <TouchableOpacity
                  key={angle}
                  style={[styles.angleTab, selectedAngle === angle && styles.angleTabActive]}
                  onPress={() => setSelectedAngle(angle)}
                >
                  <Text style={[styles.angleTabText, selectedAngle === angle && styles.angleTabTextActive]}>
                    {angle.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Side-by-side frames */}
          {selectedAngle && currentAngle && previousAngle && (
            <>
              {/* Date labels */}
              <View style={styles.dateLabels}>
                <Text style={styles.dateLabel}>{formatDate(previousDate)}</Text>
                <Text style={styles.dateLabel}>{formatDate(currentDate)}</Text>
              </View>

              <View style={styles.framesRow}>
                <CompareFrame
                  keypoints={previousAngle.keypoints}
                  issues={previousAngle.issues}
                  storagePath={previousAngle.storagePath}
                  frameIndex={prevFrameIdx}
                  onPrev={() => setPrevFrameIdx(i => Math.max(0, i - 1))}
                  onNext={() => setPrevFrameIdx(i => Math.min((previousAngle.keypoints?.length ?? 1) - 1, i + 1))}
                  total={previousAngle.keypoints?.length ?? 0}
                />
                <CompareFrame
                  keypoints={currentAngle.keypoints}
                  issues={currentAngle.issues}
                  storagePath={currentAngle.storagePath}
                  frameIndex={currFrameIdx}
                  onPrev={() => setCurrFrameIdx(i => Math.max(0, i - 1))}
                  onNext={() => setCurrFrameIdx(i => Math.min((currentAngle.keypoints?.length ?? 1) - 1, i + 1))}
                  total={currentAngle.keypoints?.length ?? 0}
                />
              </View>

              {/* Per-angle score delta */}
              <View style={styles.angleScoreRow}>
                <Text style={styles.angleScoreText}>
                  {previousAngle.symmetry_score} → {currentAngle.symmetry_score}
                </Text>
                {(() => {
                  const d = currentAngle.symmetry_score - previousAngle.symmetry_score;
                  return (
                    <View style={[styles.deltaBadge, {
                      backgroundColor: d > 0 ? COLORS.successGlow : d < 0 ? COLORS.accentGlow : COLORS.surface,
                    }]}>
                      <Text style={[styles.deltaText, {
                        color: d > 0 ? COLORS.success : d < 0 ? COLORS.accent : COLORS.textTertiary,
                      }]}>
                        {d > 0 ? '+' : ''}{d}
                      </Text>
                    </View>
                  );
                })()}
              </View>

              {/* Issue diff */}
              <View style={styles.diffCard}>
                <Text style={styles.diffTitle}>CHANGES</Text>
                <IssueDiff
                  currentIssues={currentAngle.issues}
                  previousIssues={previousAngle.issues}
                />
              </View>
            </>
          )}

          {commonAngles.length === 0 && (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No matching angles to compare</Text>
            </View>
          )}

          <View style={{ height: SPACING.xl }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    padding: SPACING.m, paddingBottom: SPACING.s,
  },
  headerTitle: { fontSize: 24, fontWeight: '900', color: COLORS.text, letterSpacing: -0.5 },
  headerSub: { fontSize: 14, color: COLORS.primary, fontWeight: '600', marginTop: 2 },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  content: { padding: SPACING.m, paddingTop: SPACING.s },

  // Score comparison
  scoreCompare: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.l, gap: SPACING.m,
  },
  scoreBox: { alignItems: 'center' },
  scoreDateLabel: { fontSize: 11, color: COLORS.textTertiary, fontWeight: '600', letterSpacing: 1, marginBottom: 4 },
  scoreNum: { fontSize: 40, fontWeight: '900', color: COLORS.text },
  deltaBox: { alignItems: 'center', gap: 4 },
  deltaArrow: { fontSize: 18, color: COLORS.textTertiary },
  deltaBadge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full,
  },
  deltaText: { fontSize: 16, fontWeight: '800' },

  // Angle tabs
  angleTabs: {
    flexDirection: 'row', gap: SPACING.s, marginBottom: SPACING.l,
  },
  angleTab: {
    paddingHorizontal: SPACING.m, paddingVertical: SPACING.s,
    borderRadius: RADIUS.full, backgroundColor: COLORS.surface,
    borderWidth: 1, borderColor: COLORS.border,
  },
  angleTabActive: { backgroundColor: COLORS.primaryGlow, borderColor: COLORS.primary },
  angleTabText: { fontSize: 12, fontWeight: '700', color: COLORS.textTertiary, letterSpacing: 1 },
  angleTabTextActive: { color: COLORS.primary },

  // Date labels
  dateLabels: {
    flexDirection: 'row', justifyContent: 'space-around', marginBottom: SPACING.s,
  },
  dateLabel: { fontSize: 11, color: COLORS.textTertiary, fontWeight: '600', letterSpacing: 1 },

  // Frames
  framesRow: {
    flexDirection: 'row', gap: SPACING.m, marginBottom: SPACING.m,
  },
  frameCol: { flex: 1, alignItems: 'center' },
  frameBox: {
    borderRadius: RADIUS.s, overflow: 'hidden',
    borderWidth: 1, borderColor: COLORS.border,
  },
  framePlaceholder: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.s,
    alignItems: 'center', justifyContent: 'center',
  },
  miniNav: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginTop: SPACING.xs,
  },
  miniNavBtn: { padding: 4 },
  miniNavText: { fontSize: 11, color: COLORS.textTertiary, fontWeight: '600' },

  // Angle score row
  angleScoreRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.m, marginBottom: SPACING.m,
  },
  angleScoreText: { fontSize: 18, fontWeight: '800', color: COLORS.text },

  // Diff card
  diffCard: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.m, padding: SPACING.m,
    borderWidth: 1, borderColor: COLORS.border,
  },
  diffTitle: {
    fontSize: 11, fontWeight: '700', color: COLORS.textTertiary,
    letterSpacing: 1.5, marginBottom: SPACING.m,
  },
  diffRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.s,
    paddingVertical: 6,
  },
  diffText: { fontSize: 13, color: COLORS.textSecondary, flex: 1 },
  diffTextGood: { fontSize: 13, color: COLORS.success, fontWeight: '600' },
  diffLabel: { fontWeight: '700', color: COLORS.text },

  emptyCard: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.l,
    padding: SPACING.xl, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  emptyText: { color: COLORS.textTertiary, fontSize: 15 },
});
