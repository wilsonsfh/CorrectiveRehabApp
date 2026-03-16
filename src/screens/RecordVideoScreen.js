import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Dimensions, Alert,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import { ChevronLeft, RotateCcw } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

const ANGLE_GUIDANCE = {
  Side:  { prompt: 'FILM FROM THE SIDE', tip: 'Capture bar path and depth from 90°' },
  Front: { prompt: 'FILM FROM THE FRONT', tip: 'Capture knee tracking and symmetry' },
  Above: { prompt: 'FILM FROM ABOVE',     tip: 'Capture bar path and wrist position' },
};

export default function RecordVideoScreen({ navigation, route }) {
  const { category, angleIndex, sessionId, recordedAngles } = route.params;
  const currentAngle = category.angles[angleIndex];
  const guidance = ANGLE_GUIDANCE[currentAngle] ?? { prompt: `FILM FROM ${currentAngle.toUpperCase()}`, tip: '' };
  const remaining = category.angles.length - angleIndex;

  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState('back');
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const cameraRef = useRef(null);
  const timerRef = useRef(null);

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <SafeAreaView style={styles.permissionInner}>
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionText}>
            CorrectiveRehabApp needs camera access to record your gym sets.
          </Text>
          <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
            <Text style={styles.permissionBtnText}>Grant Permission</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    );
  }

  const startRecording = async () => {
    if (recording) return;
    if (!cameraRef.current) {
      Alert.alert('Camera not ready', 'Please wait a moment and try again.');
      return;
    }
    setRecording(true);
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);

    try {
      const video = await cameraRef.current.recordAsync({ maxDuration: 120 });
      if (video?.uri) {
        handleRecordingDone(video.uri);
      } else {
        throw new Error('No video URI returned');
      }
    } catch (e) {
      // stopRecording() throws a benign error — ignore it
      if (!e.message?.includes('stop') && !e.message?.includes('cancel')) {
        Alert.alert('Recording failed', e.message);
      }
    } finally {
      clearInterval(timerRef.current);
      setRecording(false);
    }
  };

  const stopRecording = () => {
    if (!cameraRef.current || !recording) return;
    cameraRef.current.stopRecording();
    clearInterval(timerRef.current);
    setRecording(false);
  };

  const handleRecordingDone = (uri) => {
    navigation.navigate('VideoPreview', {
      videoUri: uri,
      category,
      angleIndex,
      currentAngle,
      sessionId,
      recordedAngles,
    });
  };

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing={facing}
        mode="video"
      />

      {/* edges={['bottom']} — only bottom safe area, camera goes edge-to-edge */}
      <SafeAreaView style={styles.overlay} edges={['bottom']}>
        {/* TOP BAR — manual padding since status bar is hidden */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => { if (recording) stopRecording(); navigation.goBack(); }}
          >
            <ChevronLeft color={COLORS.white} size={24} />
          </TouchableOpacity>

          {recording ? (
            <View style={styles.recordingBadge}>
              <View style={styles.recordingDot} />
              <Text style={styles.recordingTime}>{formatTime(elapsed)}</Text>
            </View>
          ) : (
            <View style={styles.angleBadge}>
              <Text style={styles.angleBadgeText}>
                {angleIndex + 1} / {category.angles.length}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => setFacing(f => f === 'back' ? 'front' : 'back')}
          >
            <RotateCcw color={COLORS.white} size={22} />
          </TouchableOpacity>
        </View>

        {/* ANGLE PROMPT */}
        {!recording && (
          <View style={styles.promptCard}>
            <Text style={styles.promptTitle}>{guidance.prompt}</Text>
            <Text style={styles.promptTip}>{guidance.tip}</Text>
          </View>
        )}

        {/* RECORD BUTTON */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.recordBtn, recording && styles.recordBtnActive]}
            onPress={recording ? stopRecording : startRecording}
            activeOpacity={0.8}
          >
            <View style={[styles.recordBtnInner, recording && styles.recordBtnInnerStop]} />
          </TouchableOpacity>
          <Text style={styles.recordHint}>
            {recording ? 'Tap to stop' : 'Tap to start recording'}
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  overlay: { flex: 1, justifyContent: 'space-between' },

  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.m, paddingTop: SPACING.xl,
  },
  iconBtn: {
    width: 40, height: 40, borderRadius: RADIUS.full,
    backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center',
  },
  recordingBadge: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.xs,
    backgroundColor: 'rgba(255,71,87,0.9)', paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.xs, borderRadius: RADIUS.full,
  },
  recordingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.white },
  recordingTime: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
  angleBadge: {
    backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.xs, borderRadius: RADIUS.full,
  },
  angleBadgeText: { color: COLORS.white, fontWeight: '600', fontSize: 13 },

  promptCard: {
    alignSelf: 'center', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: RADIUS.l,
    padding: SPACING.l, marginHorizontal: SPACING.l,
    borderWidth: 1, borderColor: COLORS.primary,
  },
  promptTitle: {
    fontSize: 20, fontWeight: '900', color: COLORS.primary,
    letterSpacing: 1, textAlign: 'center', marginBottom: SPACING.s,
  },
  promptTip: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center' },

  bottomBar: { alignItems: 'center', paddingBottom: SPACING.xl, gap: SPACING.m },
  recordBtn: {
    width: 80, height: 80, borderRadius: 40,
    borderWidth: 4, borderColor: COLORS.white,
    alignItems: 'center', justifyContent: 'center',
  },
  recordBtnActive: { borderColor: COLORS.danger },
  recordBtnInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.danger },
  recordBtnInnerStop: { width: 28, height: 28, borderRadius: 6, backgroundColor: COLORS.danger },
  recordHint: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '500' },

  permissionContainer: { flex: 1, backgroundColor: COLORS.background },
  permissionInner: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.l },
  permissionTitle: { fontSize: 22, fontWeight: '800', color: COLORS.text, marginBottom: SPACING.m },
  permissionText: {
    fontSize: 15, color: COLORS.textSecondary, textAlign: 'center',
    lineHeight: 22, marginBottom: SPACING.l,
  },
  permissionBtn: {
    backgroundColor: COLORS.primary, paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.m, borderRadius: RADIUS.m,
  },
  permissionBtnText: { color: COLORS.background, fontWeight: '800', fontSize: 16 },
});
