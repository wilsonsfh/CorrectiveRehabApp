import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, Switch, ActivityIndicator, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { X, ChevronLeft, ChevronRight, AlertTriangle, CheckCircle } from 'lucide-react-native';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import SkeletonOverlay from '../components/SkeletonOverlay';
import { supabase } from '../lib/supabase';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const FRAME_WIDTH = SCREEN_WIDTH - SPACING.m * 2;
const FRAME_HEIGHT = FRAME_WIDTH * (4 / 3);

const SEVERITY_COLORS = {
  mild: COLORS.success,
  moderate: '#F59E0B',
  severe: COLORS.accent,
};

export default function SkeletonViewerScreen({ navigation, route }) {
  const { angle, keypoints, issues, symmetryScore, storagePath } = route.params;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showMeasurements, setShowMeasurements] = useState(false);
  const [thumbnails, setThumbnails] = useState({});
  const [loading, setLoading] = useState(true);
  const [videoUrl, setVideoUrl] = useState(null);

  const totalFrames = keypoints?.length ?? 0;
  const currentFrame = keypoints?.[currentIndex];

  // Get a signed URL for the video
  useEffect(() => {
    if (!storagePath) {
      setLoading(false);
      return;
    }
    (async () => {
      const { data, error } = await supabase.storage
        .from('session-videos')
        .createSignedUrl(storagePath, 3600);
      if (error || !data?.signedUrl) {
        console.warn('Failed to get signed URL:', error?.message);
        setLoading(false);
        return;
      }
      setVideoUrl(data.signedUrl);
    })();
  }, [storagePath]);

  // Extract thumbnails for all keyframes (native only)
  useEffect(() => {
    if (Platform.OS === 'web') {
      setLoading(false); // skip thumbnail extraction on web
      return;
    }
    if (!videoUrl || !keypoints?.length) {
      setLoading(false);
      return;
    }
    let cancelled = false;

    (async () => {
      const thumbs = {};
      for (let i = 0; i < keypoints.length; i++) {
        if (cancelled) break;
        try {
          const { uri } = await VideoThumbnails.getThumbnailAsync(videoUrl, {
            time: keypoints[i].timestamp_ms,
            quality: 0.8,
          });
          thumbs[i] = uri;
        } catch (e) {
          console.warn(`Thumbnail extraction failed for frame ${i}:`, e.message);
        }
      }
      if (!cancelled) {
        setThumbnails(thumbs);
        setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [videoUrl, keypoints]);

  const goNext = useCallback(() => {
    setCurrentIndex(i => Math.min(i + 1, totalFrames - 1));
  }, [totalFrames]);

  const goPrev = useCallback(() => {
    setCurrentIndex(i => Math.max(i - 1, 0));
  }, []);

  if (!keypoints?.length) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.centered}>
          <Text style={styles.emptyText}>No keypoint data available</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backLink}>
            <Text style={styles.backLinkText}>Go Back</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>{angle.toUpperCase()} VIEW</Text>
            <Text style={styles.headerSub}>
              Frame {currentIndex + 1} / {totalFrames}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.closeBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <X color={COLORS.textTertiary} size={20} />
          </TouchableOpacity>
        </View>

        {/* Frame viewer */}
        <View style={styles.frameContainer}>
          {loading ? (
            <View style={[styles.framePlaceholder, { width: FRAME_WIDTH, height: FRAME_HEIGHT }]}>
              <ActivityIndicator color={COLORS.primary} size="large" />
              <Text style={styles.loadingText}>Extracting frames...</Text>
            </View>
          ) : (
            <View style={{ width: FRAME_WIDTH, height: FRAME_HEIGHT }}>
              {thumbnails[currentIndex] ? (
                <Image
                  source={{ uri: thumbnails[currentIndex] }}
                  style={{ width: FRAME_WIDTH, height: FRAME_HEIGHT, borderRadius: RADIUS.m }}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.framePlaceholder, { width: FRAME_WIDTH, height: FRAME_HEIGHT }]}>
                  <Text style={styles.placeholderText}>Frame not available</Text>
                </View>
              )}
              {/* Skeleton overlay on top of frame */}
              <View style={StyleSheet.absoluteFill}>
                <SkeletonOverlay
                  landmarks={currentFrame?.landmarks}
                  issues={issues}
                  width={FRAME_WIDTH}
                  height={FRAME_HEIGHT}
                  showMeasurements={showMeasurements}
                />
              </View>
            </View>
          )}
        </View>

        {/* Frame navigation */}
        <View style={styles.navRow}>
          <TouchableOpacity
            onPress={goPrev}
            disabled={currentIndex === 0}
            style={[styles.navBtn, currentIndex === 0 && styles.navBtnDisabled]}
          >
            <ChevronLeft color={currentIndex === 0 ? COLORS.textTertiary : COLORS.text} size={28} />
          </TouchableOpacity>

          {/* Frame dots */}
          <View style={styles.dotsRow}>
            {keypoints.map((_, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => setCurrentIndex(i)}
                style={[styles.dot, i === currentIndex && styles.dotActive]}
              />
            ))}
          </View>

          <TouchableOpacity
            onPress={goNext}
            disabled={currentIndex === totalFrames - 1}
            style={[styles.navBtn, currentIndex === totalFrames - 1 && styles.navBtnDisabled]}
          >
            <ChevronRight
              color={currentIndex === totalFrames - 1 ? COLORS.textTertiary : COLORS.text}
              size={28}
            />
          </TouchableOpacity>
        </View>

        {/* Measurements toggle */}
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Show Measurements</Text>
          <Switch
            value={showMeasurements}
            onValueChange={setShowMeasurements}
            trackColor={{ false: COLORS.border, true: COLORS.primaryDim }}
            thumbColor={showMeasurements ? COLORS.primary : COLORS.textTertiary}
          />
        </View>

        {/* Issue summary bar */}
        <View style={styles.issueBar}>
          {issues.length === 0 ? (
            <View style={styles.issueItem}>
              <CheckCircle color={COLORS.success} size={14} />
              <Text style={styles.noIssuesText}>No issues detected</Text>
            </View>
          ) : (
            issues.map((issue, idx) => (
              <View key={`${issue.id}-${idx}`} style={styles.issueItem}>
                <AlertTriangle color={SEVERITY_COLORS[issue.severity]} size={14} />
                <Text style={styles.issueLabel}>{issue.label}</Text>
                <View style={[styles.severityBadge, { backgroundColor: SEVERITY_COLORS[issue.severity] + '20' }]}>
                  <Text style={[styles.severityText, { color: SEVERITY_COLORS[issue.severity] }]}>
                    {issue.severity.toUpperCase()}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: COLORS.textTertiary, fontSize: 16, marginBottom: SPACING.m },
  backLink: { paddingVertical: SPACING.s, paddingHorizontal: SPACING.m },
  backLinkText: { color: COLORS.primary, fontSize: 15, fontWeight: '600' },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    padding: SPACING.m, paddingBottom: SPACING.s,
  },
  headerTitle: { fontSize: 24, fontWeight: '900', color: COLORS.text, letterSpacing: -0.5 },
  headerSub: { fontSize: 13, color: COLORS.primary, fontWeight: '600', marginTop: 2 },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },

  frameContainer: {
    alignItems: 'center', paddingHorizontal: SPACING.m,
    marginBottom: SPACING.m,
  },
  framePlaceholder: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.m,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  placeholderText: { color: COLORS.textTertiary, fontSize: 14 },
  loadingText: { color: COLORS.textSecondary, fontSize: 14, marginTop: SPACING.s },

  navRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.m, marginBottom: SPACING.m,
  },
  navBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  navBtnDisabled: { opacity: 0.4 },

  dotsRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, flex: 1, flexWrap: 'wrap', paddingHorizontal: SPACING.s,
  },
  dot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: COLORS.border,
  },
  dotActive: {
    backgroundColor: COLORS.primary,
    width: 10, height: 10, borderRadius: 5,
  },

  toggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.m, marginBottom: SPACING.m,
  },
  toggleLabel: { color: COLORS.textSecondary, fontSize: 14, fontWeight: '600' },

  issueBar: {
    marginHorizontal: SPACING.m, backgroundColor: COLORS.surface,
    borderRadius: RADIUS.m, padding: SPACING.m,
    borderWidth: 1, borderColor: COLORS.border,
    gap: SPACING.s,
  },
  issueItem: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.s,
  },
  issueLabel: { color: COLORS.text, fontSize: 13, fontWeight: '600', flex: 1 },
  noIssuesText: { color: COLORS.success, fontSize: 13, fontWeight: '600' },
  severityBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: RADIUS.s },
  severityText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
});
