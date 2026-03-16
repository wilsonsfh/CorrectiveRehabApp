import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { RotateCcw, CheckCircle, ChevronRight } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';

export default function VideoPreviewScreen({ navigation, route }) {
  const { videoUri, category, angleIndex, currentAngle, sessionId, recordedAngles } = route.params;
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);

  const player = useVideoPlayer(videoUri, p => { p.loop = true; p.play(); });

  const hasMoreAngles = angleIndex + 1 < category.angles.length;

  const handleAccept = async () => {
    setSaving(true);

    // Create a draft gym_session row if none exists yet
    let currentSessionId = sessionId;
    if (!currentSessionId) {
      const { data: session, error: sessionError } = await supabase
        .from('gym_sessions')
        .insert({
          user_id: user.id,
          category_id: category.id,
          category_label: category.label,
          status: 'draft',
        })
        .select()
        .single();

      if (sessionError) {
        setSaving(false);
        Alert.alert('Error', 'Failed to create session. Please try again.');
        return;
      }
      currentSessionId = session.id;
    }

    // Upload video to Supabase Storage
    const storagePath = `${user.id}/${currentSessionId}/${currentAngle.toLowerCase()}.mp4`;
    const response = await fetch(videoUri);
    const arrayBuffer = await response.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from('session-videos')
      .upload(storagePath, arrayBuffer, { contentType: 'video/mp4', upsert: true });

    if (uploadError) {
      setSaving(false);
      Alert.alert('Upload Failed', 'Could not upload video. Please try again.');
      return;
    }

    // Save session_videos row
    const { error: insertError } = await supabase.from('session_videos').insert({
      user_id: user.id,
      session_id: currentSessionId,
      category_id: category.id,
      angle: currentAngle.toLowerCase(),
      storage_path: storagePath,
    });

    if (insertError) {
      setSaving(false);
      Alert.alert('Save Failed', 'Video uploaded but could not be saved. Please try again.');
      return;
    }

    setSaving(false);

    const updatedRecordedAngles = [...recordedAngles, currentAngle.toLowerCase()];

    if (hasMoreAngles) {
      // Record next angle
      navigation.navigate('RecordVideo', {
        category,
        angleIndex: angleIndex + 1,
        sessionId: currentSessionId,
        recordedAngles: updatedRecordedAngles,
      });
    } else {
      // All angles done → link to session
      navigation.navigate('LinkSession', {
        category,
        sessionId: currentSessionId,
        recordedAngles: updatedRecordedAngles,
      });
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
      />

      <SafeAreaView style={styles.overlay}>
        {/* TOP */}
        <View style={styles.topBar}>
          <View style={styles.anglePill}>
            <Text style={styles.anglePillText}>{currentAngle.toUpperCase()} ANGLE</Text>
          </View>
        </View>

        {/* BOTTOM */}
        <View style={styles.bottomBar}>
          <Text style={styles.previewLabel}>PREVIEW</Text>
          {hasMoreAngles && (
            <Text style={styles.nextAngleHint}>
              Next: {category.angles[angleIndex + 1]} angle
            </Text>
          )}

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.retakeBtn}
              onPress={() => navigation.goBack()}
              activeOpacity={0.8}
              disabled={saving}
            >
              <RotateCcw color={COLORS.text} size={18} />
              <Text style={styles.retakeBtnText}>Retake</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.acceptBtn, saving && { opacity: 0.7 }]}
              onPress={handleAccept}
              activeOpacity={0.8}
              disabled={saving}
            >
              <LinearGradient
                colors={[COLORS.primary, COLORS.primaryDim]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.acceptBtnGradient}
              >
                {saving ? (
                  <ActivityIndicator color={COLORS.background} />
                ) : (
                  <>
                    {hasMoreAngles ? (
                      <>
                        <Text style={styles.acceptBtnText}>Next Angle</Text>
                        <ChevronRight color={COLORS.background} size={18} />
                      </>
                    ) : (
                      <>
                        <CheckCircle color={COLORS.background} size={18} />
                        <Text style={styles.acceptBtnText}>Looks Good</Text>
                      </>
                    )}
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  overlay: { flex: 1, justifyContent: 'space-between' },

  topBar: {
    paddingHorizontal: SPACING.m, paddingTop: SPACING.s, alignItems: 'center',
  },
  anglePill: {
    backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.xs, borderRadius: RADIUS.full,
    borderWidth: 1, borderColor: COLORS.primary,
  },
  anglePillText: { color: COLORS.primary, fontWeight: '700', fontSize: 12, letterSpacing: 1.5 },

  bottomBar: {
    backgroundColor: 'rgba(0,0,0,0.75)', padding: SPACING.l,
    paddingBottom: SPACING.xl, gap: SPACING.s,
  },
  previewLabel: {
    fontSize: 11, fontWeight: '700', color: COLORS.textTertiary, letterSpacing: 1.5,
  },
  nextAngleHint: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: SPACING.m, marginTop: SPACING.s },

  retakeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.s, paddingVertical: 14, borderRadius: RADIUS.m,
    borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: 'rgba(255,255,255,0.05)',
  },
  retakeBtnText: { color: COLORS.text, fontWeight: '700', fontSize: 15 },

  acceptBtn: { flex: 2, borderRadius: RADIUS.m, overflow: 'hidden' },
  acceptBtnGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, gap: SPACING.s,
  },
  acceptBtnText: { color: COLORS.background, fontWeight: '800', fontSize: 15 },
});
