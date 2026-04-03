import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  ChevronLeft,
  Clock,
  BarChart,
  Crosshair,
  CheckCircle,
  Zap,
} from 'lucide-react-native';

const DIFFICULTY_COLORS = {
  Beginner: COLORS.success,
  Intermediate: COLORS.accent,
  Advanced: COLORS.danger,
};

const ExerciseDetailScreen = ({ route, navigation }) => {
  const { exercise } = route.params;
  const { user } = useAuth();
  const [completed, setCompleted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const player = useVideoPlayer(exercise.videoUrl, (player) => {
    player.loop = true;
  });

  const diffColor = DIFFICULTY_COLORS[exercise.difficulty] || COLORS.primary;

  const handleComplete = async () => {
    if (completed) return;

    setSaving(true);
    const { error } = await supabase.from('workout_sessions').insert({
      user_id: user.id,
      exercise_id: exercise.id,
      completed_at: new Date().toISOString(),
      notes: exercise.title,
    });
    setSaving(false);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    setCompleted(true);
  };

  return (
    <View style={styles.container}>
      {/* Video Player */}
      <View style={styles.videoContainer}>
        <VideoView
          player={player}
          style={styles.video}
          contentFit="contain"
          nativeControls={true}
          fullscreenOptions={{ controlsBackgroundColor: '#000' }}
          allowsPictureInPicture
        />
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ChevronLeft color={COLORS.white} size={28} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          {exercise.targetIssue && (
            <View style={styles.targetBadge}>
              <Crosshair color={COLORS.accent} size={12} />
              <Text style={styles.targetText}>
                FIXES: {exercise.targetIssue.toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.title}>{exercise.title}</Text>

        {/* Meta row */}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Clock color={COLORS.textTertiary} size={15} />
            <Text style={styles.metaText}>{exercise.duration}</Text>
          </View>
          <View style={styles.metaDot} />
          <View style={styles.metaItem}>
            <BarChart color={COLORS.textTertiary} size={15} />
            <Text style={[styles.metaText, { color: diffColor }]}>
              {exercise.difficulty}
            </Text>
          </View>
          <View style={styles.metaDot} />
          <View style={styles.metaItem}>
            <Zap color={COLORS.textTertiary} size={15} />
            <Text style={styles.metaText}>{exercise.category}</Text>
          </View>
        </View>

        {/* Category tag */}
        <View style={styles.tagContainer}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>
              {exercise.category.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>INSTRUCTIONS</Text>
          <View style={styles.instructionCard}>
            <Text style={styles.description}>{exercise.description}</Text>
          </View>
        </View>

        {/* Complete button */}
        {!!errorMsg && (
          <Text style={styles.errorMsg}>{errorMsg}</Text>
        )}
        <TouchableOpacity
          style={styles.completeBtn}
          activeOpacity={0.8}
          onPress={handleComplete}
          disabled={completed || saving}
        >
          <LinearGradient
            colors={
              completed
                ? [COLORS.success, COLORS.success]
                : [COLORS.primary, COLORS.primaryDim]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.completeBtnGradient}
          >
            {saving ? (
              <ActivityIndicator color={COLORS.background} />
            ) : (
              <>
                <CheckCircle color={COLORS.background} size={20} />
                <Text style={styles.completeBtnText}>
                  {completed ? 'Completed!' : 'Mark as Complete'}
                </Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: SPACING.xl }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  videoContainer: {
    width: '100%',
    height: 260,
    backgroundColor: '#000',
  },
  video: {
    alignSelf: 'center',
    width: '100%',
    height: '100%',
  },
  backButton: {
    position: 'absolute',
    top: 48,
    left: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: RADIUS.full,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: SPACING.m,
  },
  headerRow: {
    flexDirection: 'row',
    marginBottom: SPACING.s,
  },
  targetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.accentGlow,
    paddingHorizontal: SPACING.s,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.s,
  },
  targetText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.accent,
    letterSpacing: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: SPACING.m,
    letterSpacing: -0.5,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.m,
    gap: SPACING.s,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: COLORS.textTertiary,
  },
  metaText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  tagContainer: {
    flexDirection: 'row',
    marginBottom: SPACING.l,
  },
  tag: {
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.s,
    borderRadius: RADIUS.s,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tagText: {
    color: COLORS.textSecondary,
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 1,
  },
  section: {
    marginBottom: SPACING.l,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textTertiary,
    letterSpacing: 1.5,
    marginBottom: SPACING.s,
  },
  instructionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.m,
    padding: SPACING.m,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  description: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 24,
  },
  completeBtn: {
    borderRadius: RADIUS.m,
    overflow: 'hidden',
    marginBottom: SPACING.l,
  },
  completeBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: SPACING.s,
  },
  completeBtnText: {
    color: COLORS.background,
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  errorMsg: {
    color: COLORS.danger,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: SPACING.s,
  },
});

export default ExerciseDetailScreen;
