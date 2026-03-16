import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import { GYM_HABITS } from '../data/mockData';
import { supabase } from '../lib/supabase';
import SkeletonOverlay from '../components/SkeletonOverlay';
import {
  CheckCircle, AlertTriangle, ChevronRight, X, Eye, GitCompare,
} from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';

const SEVERITY_COLORS = {
  mild: COLORS.success,
  moderate: '#F59E0B',
  severe: COLORS.accent,
};

const THUMB_WIDTH = 100;
const THUMB_HEIGHT = 133; // 4:3 aspect

function AngleThumbnail({ keypoints, issues, storagePath }) {
  const [thumbUri, setThumbUri] = useState(null);

  useEffect(() => {
    if (!storagePath || !keypoints?.length) return;
    let cancelled = false;

    (async () => {
      try {
        // Pick the middle frame for the thumbnail
        const midIdx = Math.floor(keypoints.length / 2);
        const timestampMs = keypoints[midIdx]?.timestamp_ms ?? 0;

        const { data } = await supabase.storage
          .from('session-videos')
          .createSignedUrl(storagePath, 3600);

        if (cancelled || !data?.signedUrl) return;

        const { uri } = await VideoThumbnails.getThumbnailAsync(data.signedUrl, {
          time: timestampMs,
          quality: 0.6,
        });
        if (!cancelled) setThumbUri(uri);
      } catch (e) {
        console.warn('Thumbnail extraction failed:', e.message);
      }
    })();

    return () => { cancelled = true; };
  }, [storagePath, keypoints]);

  // Pick the middle frame's landmarks for the thumbnail skeleton
  const midFrame = keypoints?.[Math.floor((keypoints?.length ?? 0) / 2)];

  return (
    <View style={styles.thumbContainer}>
      {thumbUri ? (
        <Image
          source={{ uri: thumbUri }}
          style={styles.thumbImage}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.thumbImage, styles.thumbPlaceholder]}>
          <Eye color={COLORS.textTertiary} size={20} />
        </View>
      )}
      {midFrame?.landmarks && (
        <View style={StyleSheet.absoluteFill}>
          <SkeletonOverlay
            landmarks={midFrame.landmarks}
            issues={issues}
            width={THUMB_WIDTH}
            height={THUMB_HEIGHT}
          />
        </View>
      )}
    </View>
  );
}

export default function SessionResultScreen({ navigation, route }) {
  const { sessionId, category, analysisResults } = route.params;
  const { user } = useAuth();
  const results = analysisResults ?? [];
  const [previousSession, setPreviousSession] = useState(null);

  // Check for a previous analyzed session with the same lift category
  useEffect(() => {
    if (!user?.id || !category?.id || !sessionId) return;
    (async () => {
      try {
        // Find the most recent completed session for the same category that isn't the current one
        const { data: prevSessions } = await supabase
          .from('gym_sessions')
          .select('id, date, category_label')
          .eq('user_id', user.id)
          .eq('category_id', category.id)
          .eq('analysis_status', 'complete')
          .neq('id', sessionId)
          .order('created_at', { ascending: false })
          .limit(1);

        if (!prevSessions?.length) return;

        const prevSession = prevSessions[0];

        // Fetch its analysis results with keypoints
        const { data: prevResults } = await supabase
          .from('analysis_results')
          .select('angle, symmetry_score, issues, keypoints')
          .eq('session_id', prevSession.id);

        if (!prevResults?.length) return;

        // Fetch storage paths for the previous session's videos
        const { data: prevVideos } = await supabase
          .from('session_videos')
          .select('angle, storage_path')
          .eq('session_id', prevSession.id);

        const videoMap = {};
        for (const v of prevVideos ?? []) {
          videoMap[v.angle] = v.storage_path;
        }

        const enrichedResults = prevResults.map(r => ({
          ...r,
          storagePath: videoMap[r.angle] ?? null,
        }));

        setPreviousSession({
          id: prevSession.id,
          date: prevSession.date,
          results: enrichedResults,
        });
      } catch (e) {
        console.warn('Failed to fetch previous session:', e.message);
      }
    })();
  }, [user?.id, category?.id, sessionId]);

  const handleCompare = () => {
    if (!previousSession) return;
    navigation.navigate('CompareSession', {
      currentResults: results,
      previousResults: previousSession.results,
      currentDate: new Date().toISOString(),
      previousDate: previousSession.date,
      categoryLabel: category?.label ?? 'Session',
    });
  };

  const overallScore = results.length > 0
    ? Math.round(results.reduce((sum, r) => sum + r.symmetry_score, 0) / results.length)
    : null;

  const getScoreColor = (score) => {
    if (score >= 80) return COLORS.success;
    if (score >= 60) return '#F59E0B';
    return COLORS.accent;
  };

  const handleFixPress = (issueId) => {
    const habit = GYM_HABITS.find(h => h.id === issueId);
    if (habit) {
      navigation.navigate('Library');
    }
  };

  const handleAnglePress = (result) => {
    if (!result.keypoints?.length) return;
    navigation.navigate('SkeletonViewer', {
      angle: result.angle,
      keypoints: result.keypoints,
      issues: result.issues,
      symmetryScore: result.symmetry_score,
      storagePath: result.storagePath,
    });
  };

  const hasKeypoints = (result) => result.keypoints?.length > 0;

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>FORM ANALYSIS</Text>
            <Text style={styles.headerSub}>{category?.label ?? 'Session'}</Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.popToTop()}
            style={styles.closeBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <X color={COLORS.textTertiary} size={20} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Overall Score */}
          {overallScore !== null ? (
            <View style={styles.scoreCard}>
              <LinearGradient
                colors={['rgba(0, 229, 204, 0.08)', 'rgba(0, 229, 204, 0.02)']}
                style={styles.scoreGradient}
              >
                <Text style={styles.scoreLabel}>OVERALL SYMMETRY</Text>
                <View style={styles.scoreRow}>
                  <Text style={[styles.scoreValue, { color: getScoreColor(overallScore) }]}>
                    {overallScore}
                  </Text>
                  <Text style={styles.scoreUnit}>/100</Text>
                </View>
                <View style={styles.scoreBarBg}>
                  <LinearGradient
                    colors={[COLORS.accent, getScoreColor(overallScore)]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.scoreBarFill, { width: `${overallScore}%` }]}
                  />
                </View>
              </LinearGradient>
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No analysis results available</Text>
            </View>
          )}

          {/* Compare to Previous */}
          {previousSession && (
            <TouchableOpacity
              style={styles.compareBtn}
              onPress={handleCompare}
              activeOpacity={0.7}
            >
              <GitCompare color={COLORS.primary} size={18} />
              <View style={styles.compareBtnInfo}>
                <Text style={styles.compareBtnText}>Compare to Previous</Text>
                <Text style={styles.compareBtnSub}>
                  {new Date(previousSession.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  {' — '}
                  {Math.round(previousSession.results.reduce((s, r) => s + r.symmetry_score, 0) / previousSession.results.length)}/100
                </Text>
              </View>
              <ChevronRight color={COLORS.primary} size={18} />
            </TouchableOpacity>
          )}

          {/* Per-angle cards */}
          {results.map((result) => (
            <TouchableOpacity
              key={result.angle}
              style={styles.angleCard}
              activeOpacity={hasKeypoints(result) ? 0.7 : 1}
              onPress={() => handleAnglePress(result)}
              disabled={!hasKeypoints(result)}
            >
              <View style={styles.angleTopRow}>
                {/* Skeleton thumbnail */}
                {hasKeypoints(result) && (
                  <AngleThumbnail
                    keypoints={result.keypoints}
                    issues={result.issues}
                    storagePath={result.storagePath}
                  />
                )}

                {/* Score + info */}
                <View style={styles.angleInfoCol}>
                  <View style={styles.angleHeader}>
                    <View style={styles.angleBadge}>
                      <Text style={styles.angleBadgeText}>{result.angle.toUpperCase()}</Text>
                    </View>
                    <Text style={[styles.angleScore, { color: getScoreColor(result.symmetry_score) }]}>
                      {result.symmetry_score}/100
                    </Text>
                  </View>

                  {/* Score bar */}
                  <View style={styles.angleBarBg}>
                    <LinearGradient
                      colors={[COLORS.accent, getScoreColor(result.symmetry_score)]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[styles.angleBarFill, { width: `${result.symmetry_score}%` }]}
                    />
                  </View>

                  {/* Tap hint */}
                  {hasKeypoints(result) && (
                    <View style={styles.tapHint}>
                      <Eye color={COLORS.textTertiary} size={12} />
                      <Text style={styles.tapHintText}>Tap to view skeleton</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Issues */}
              {result.issues.length === 0 ? (
                <View style={styles.noIssues}>
                  <CheckCircle color={COLORS.success} size={16} />
                  <Text style={styles.noIssuesText}>No issues detected</Text>
                </View>
              ) : (
                result.issues.map((issue, idx) => (
                  <View key={`${issue.id}-${idx}`} style={styles.issueRow}>
                    <View style={styles.issueLeft}>
                      <AlertTriangle color={SEVERITY_COLORS[issue.severity]} size={14} />
                      <View style={styles.issueInfo}>
                        <View style={styles.issueLabelRow}>
                          <Text style={styles.issueLabel}>{issue.label}</Text>
                          <View style={[styles.severityBadge, { backgroundColor: SEVERITY_COLORS[issue.severity] + '20' }]}>
                            <Text style={[styles.severityText, { color: SEVERITY_COLORS[issue.severity] }]}>
                              {issue.severity.toUpperCase()}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.issueDetail}>{issue.detail}</Text>
                      </View>
                    </View>
                    {GYM_HABITS.find(h => h.id === issue.id) && (
                      <TouchableOpacity
                        style={styles.fixBtn}
                        onPress={() => handleFixPress(issue.id)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.fixBtnText}>Fix</Text>
                        <ChevronRight color={COLORS.primary} size={14} />
                      </TouchableOpacity>
                    )}
                  </View>
                ))
              )}
            </TouchableOpacity>
          ))}

          <View style={{ height: SPACING.xl }} />
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.doneBtn}
            onPress={() => navigation.popToTop()}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryDim]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.doneBtnGradient}
            >
              <Text style={styles.doneBtnText}>Done</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
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
  headerTitle: { fontSize: 28, fontWeight: '900', color: COLORS.text, letterSpacing: -0.5 },
  headerSub: { fontSize: 14, color: COLORS.primary, fontWeight: '600', marginTop: 2 },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },

  content: { padding: SPACING.m, paddingTop: SPACING.s },

  // Overall score
  scoreCard: {
    borderRadius: RADIUS.l, overflow: 'hidden',
    borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.l,
  },
  scoreGradient: { padding: SPACING.l },
  scoreLabel: {
    fontSize: 11, fontWeight: '700', color: COLORS.textTertiary,
    letterSpacing: 1.5, marginBottom: SPACING.m,
  },
  scoreRow: { flexDirection: 'row', alignItems: 'flex-end', gap: SPACING.xs, marginBottom: SPACING.m },
  scoreValue: { fontSize: 56, fontWeight: '900', lineHeight: 56 },
  scoreUnit: { fontSize: 20, color: COLORS.textTertiary, fontWeight: '600', marginBottom: 8 },
  scoreBarBg: {
    height: 8, backgroundColor: COLORS.surface, borderRadius: 4, overflow: 'hidden',
  },
  scoreBarFill: { height: '100%', borderRadius: 4 },

  emptyCard: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.l,
    padding: SPACING.xl, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.l,
  },
  emptyText: { color: COLORS.textTertiary, fontSize: 15 },

  // Compare button
  compareBtn: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.m,
    backgroundColor: COLORS.primaryGlow, borderRadius: RADIUS.m,
    padding: SPACING.m, marginBottom: SPACING.l,
    borderWidth: 1, borderColor: COLORS.primary + '40',
  },
  compareBtnInfo: { flex: 1 },
  compareBtnText: { fontSize: 15, fontWeight: '700', color: COLORS.primary },
  compareBtnSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },

  // Angle cards
  angleCard: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.l,
    padding: SPACING.m, borderWidth: 1, borderColor: COLORS.border,
    marginBottom: SPACING.m,
  },
  angleTopRow: {
    flexDirection: 'row', gap: SPACING.m, marginBottom: SPACING.m,
  },
  angleInfoCol: { flex: 1 },
  angleHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: SPACING.m,
  },
  angleBadge: {
    backgroundColor: COLORS.primaryGlow, paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.xs, borderRadius: RADIUS.full,
  },
  angleBadgeText: { fontSize: 11, fontWeight: '800', color: COLORS.primary, letterSpacing: 1.5 },
  angleScore: { fontSize: 20, fontWeight: '900' },
  angleBarBg: {
    height: 6, backgroundColor: COLORS.background, borderRadius: 3,
    overflow: 'hidden', marginBottom: SPACING.s,
  },
  angleBarFill: { height: '100%', borderRadius: 3 },

  tapHint: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  tapHintText: { fontSize: 11, color: COLORS.textTertiary, fontWeight: '500' },

  // Thumbnail
  thumbContainer: {
    width: THUMB_WIDTH, height: THUMB_HEIGHT,
    borderRadius: RADIUS.m, overflow: 'hidden',
    backgroundColor: COLORS.background,
    borderWidth: 1, borderColor: COLORS.border,
  },
  thumbImage: {
    width: THUMB_WIDTH, height: THUMB_HEIGHT,
    borderRadius: RADIUS.m,
  },
  thumbPlaceholder: {
    backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center',
  },

  // Issues
  noIssues: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.s,
    paddingVertical: SPACING.s,
  },
  noIssuesText: { color: COLORS.success, fontSize: 14, fontWeight: '600' },
  issueRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingVertical: SPACING.s, borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  issueLeft: { flexDirection: 'row', gap: SPACING.s, flex: 1, paddingTop: 2 },
  issueInfo: { flex: 1 },
  issueLabelRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.s, marginBottom: 4 },
  issueLabel: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  severityBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: RADIUS.s },
  severityText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  issueDetail: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 18 },
  fixBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 2,
    paddingLeft: SPACING.s, paddingTop: 2,
  },
  fixBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.primary },

  // Footer
  footer: { padding: SPACING.m, paddingBottom: SPACING.l },
  doneBtn: { borderRadius: RADIUS.m, overflow: 'hidden' },
  doneBtnGradient: {
    alignItems: 'center', justifyContent: 'center', paddingVertical: 16,
  },
  doneBtnText: { color: COLORS.background, fontWeight: '800', fontSize: 16, letterSpacing: 0.5 },
});
