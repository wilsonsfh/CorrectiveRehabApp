import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import { ChevronLeft, RotateCcw } from 'lucide-react-native';

const ANGLE_GUIDANCE = {
  Side:  { prompt: 'FILM FROM THE SIDE', tip: 'Capture bar path and depth from 90°' },
  Front: { prompt: 'FILM FROM THE FRONT', tip: 'Capture knee tracking and symmetry' },
  Above: { prompt: 'FILM FROM ABOVE',     tip: 'Capture bar path and wrist position' },
};

export default function RecordVideoScreen({ navigation, route }) {
  const { category, angleIndex, sessionId, recordedAngles } = route.params;
  const currentAngle = category.angles[angleIndex];
  const guidance = ANGLE_GUIDANCE[currentAngle] ?? { prompt: `FILM FROM ${currentAngle.toUpperCase()}`, tip: '' };

  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [facingMode, setFacingMode] = useState('environment');

  const containerRef = useRef(null);
  const videoElRef = useRef(null);
  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async (mode) => {
    stopStream();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode },
        audio: true,
      });
      streamRef.current = stream;
      if (videoElRef.current) {
        videoElRef.current.srcObject = stream;
      }
    } catch (_e) {
      setErrorMsg('Camera access denied. Allow camera permission in your browser settings.');
    }
  }, [stopStream]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Append a native <video> element — React Native Web's View becomes a <div>
    const videoEl = document.createElement('video');
    videoEl.autoplay = true;
    videoEl.muted = true;
    videoEl.playsInline = true;
    videoEl.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;';
    container.appendChild(videoEl);
    videoElRef.current = videoEl;

    startCamera('environment');

    return () => {
      stopStream();
      videoEl.remove();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleFacing = () => {
    if (recording) return;
    const newMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newMode);
    startCamera(newMode);
  };

  const startRecording = () => {
    if (!streamRef.current || recording) return;
    setErrorMsg('');
    chunksRef.current = [];

    const recorder = new MediaRecorder(streamRef.current);
    recorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
      const uri = URL.createObjectURL(blob);
      navigation.navigate('VideoPreview', {
        videoUri: uri,
        videoMimeType: recorder.mimeType,
        category,
        angleIndex,
        currentAngle,
        sessionId,
        recordedAngles,
      });
    };

    recorder.start();
    setRecording(true);
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
  };

  const stopRecording = () => {
    if (!recorderRef.current || !recording) return;
    recorderRef.current.stop();
    clearInterval(timerRef.current);
    setRecording(false);
  };

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      {/* Native video element appended here by useEffect */}
      <View ref={containerRef} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={styles.overlay} edges={['bottom']}>
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
            onPress={toggleFacing}
            disabled={recording}
          >
            <RotateCcw
              color={recording ? 'rgba(255,255,255,0.3)' : COLORS.white}
              size={22}
            />
          </TouchableOpacity>
        </View>

        {!recording && (
          <View style={styles.promptCard}>
            <Text style={styles.promptTitle}>{guidance.prompt}</Text>
            <Text style={styles.promptTip}>{guidance.tip}</Text>
          </View>
        )}

        {!!errorMsg && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        )}

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

  errorBanner: {
    marginHorizontal: SPACING.l, padding: SPACING.m, borderRadius: RADIUS.m,
    backgroundColor: 'rgba(255,71,87,0.85)',
  },
  errorText: { color: COLORS.white, fontSize: 13, fontWeight: '600', textAlign: 'center' },

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
});
