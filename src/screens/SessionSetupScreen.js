import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import { LIFT_CATEGORIES, GYM_HABITS } from '../data/mockData';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ChevronLeft, Video, Clock, Zap } from 'lucide-react-native';

export default function SessionSetupScreen({ navigation, route }) {
  const { user } = useAuth();
  const draftSession = route?.params?.draftSession ?? null;

  const [selectedCategory, setSelectedCategory] = useState(
    draftSession ? (LIFT_CATEGORIES.find(c => c.id === draftSession.category_id) ?? null) : null
  );
  const [lastSession, setLastSession] = useState(null);
  const [loadingTemplate, setLoadingTemplate] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (selectedCategory) fetchLastSession(selectedCategory.id);
    }, [selectedCategory])
  );

  async function fetchLastSession(categoryId) {
    setLoadingTemplate(true);
    const { data } = await supabase
      .from('gym_sessions')
      .select('*, session_videos(angle)')
      .eq('user_id', user.id)
      .eq('category_id', categoryId)
      .eq('status', 'complete')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    setLastSession(data);
    setLoadingTemplate(false);
  }

  const handleStart = () => {
    if (!selectedCategory) return;
    navigation.navigate('RecordVideo', {
      category: selectedCategory,
      angleIndex: 0,
      sessionId: draftSession?.id ?? null,
      recordedAngles: draftSession?.session_videos?.map(v => v.angle) ?? [],
    });
  };

  const pendingAngles = selectedCategory
    ? selectedCategory.angles.filter(
        a => !(draftSession?.session_videos ?? []).map(v => v.angle).includes(a.toLowerCase())
      )
    : [];

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <ChevronLeft color={COLORS.text} size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>RECORD SET</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionLabel}>SELECT LIFT</Text>
          <View style={styles.categoryGrid}>
            {LIFT_CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryCard, selectedCategory?.id === cat.id && styles.categoryCardSelected]}
                onPress={() => setSelectedCategory(cat)}
                activeOpacity={0.7}
              >
                <Text style={[styles.categoryLabel, selectedCategory?.id === cat.id && styles.categoryLabelSelected]}>
                  {cat.label}
                </Text>
                <Text style={styles.categoryAngles}>
                  {cat.angles.join(' + ')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {selectedCategory && (
            <>
              {/* Angles to record */}
              <View style={styles.anglesCard}>
                <Text style={styles.sectionLabel}>ANGLES TO RECORD</Text>
                {selectedCategory.angles.map(angle => {
                  const done = (draftSession?.session_videos ?? [])
                    .map(v => v.angle)
                    .includes(angle.toLowerCase());
                  return (
                    <View key={angle} style={styles.angleRow}>
                      <View style={[styles.angleDot, done && styles.angleDotDone]} />
                      <Text style={[styles.angleText, done && styles.angleTextDone]}>
                        {angle} {done ? '✓' : ''}
                      </Text>
                    </View>
                  );
                })}
              </View>

              {/* Smart template */}
              {loadingTemplate ? (
                <ActivityIndicator color={COLORS.primary} style={{ marginVertical: SPACING.m }} />
              ) : lastSession ? (
                <View style={styles.templateCard}>
                  <View style={styles.templateHeader}>
                    <Clock color={COLORS.primary} size={14} />
                    <Text style={styles.templateLabel}>LAST SESSION TEMPLATE</Text>
                  </View>
                  <Text style={styles.templateDate}>
                    {new Date(lastSession.created_at).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                    })}
                  </Text>
                  {lastSession.session_videos?.length > 0 && (
                    <View style={styles.templateAngles}>
                      <Zap color={COLORS.textTertiary} size={12} />
                      <Text style={styles.templateAnglesText}>
                        Recorded: {lastSession.session_videos.map(v => v.angle).join(', ')}
                      </Text>
                    </View>
                  )}
                </View>
              ) : (
                <View style={styles.firstTimeCard}>
                  <Text style={styles.firstTimeText}>
                    First time recording {selectedCategory.label}. We&apos;ll record {selectedCategory.angles.join(' and ')} angles.
                  </Text>
                </View>
              )}
            </>
          )}
        </ScrollView>

        {selectedCategory && pendingAngles.length > 0 && (
          <View style={styles.footer}>
            <TouchableOpacity style={styles.startBtn} onPress={handleStart} activeOpacity={0.8}>
              <LinearGradient
                colors={[COLORS.primary, COLORS.primaryDim]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.startBtnGradient}
              >
                <Video color={COLORS.background} size={20} />
                <Text style={styles.startBtnText}>
                  {draftSession ? `Record ${pendingAngles[0]} Angle` : 'Start Recording'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.m, paddingVertical: SPACING.m,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16, fontWeight: '800', color: COLORS.text, letterSpacing: 1.5,
  },
  content: { padding: SPACING.m },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: COLORS.textTertiary,
    letterSpacing: 1.5, marginBottom: SPACING.m,
  },
  categoryGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.s, marginBottom: SPACING.l,
  },
  categoryCard: {
    paddingHorizontal: SPACING.m, paddingVertical: SPACING.m,
    borderRadius: RADIUS.m, backgroundColor: COLORS.surface,
    borderWidth: 1, borderColor: COLORS.border, minWidth: '47%',
  },
  categoryCardSelected: {
    backgroundColor: COLORS.primaryGlow, borderColor: COLORS.primary,
  },
  categoryLabel: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  categoryLabelSelected: { color: COLORS.primary },
  categoryAngles: { fontSize: 11, color: COLORS.textTertiary, fontWeight: '500' },
  anglesCard: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.m, padding: SPACING.m,
    borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.m,
  },
  angleRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.s, marginBottom: SPACING.s },
  angleDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: COLORS.border,
  },
  angleDotDone: { backgroundColor: COLORS.success },
  angleText: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '600' },
  angleTextDone: { color: COLORS.success },
  templateCard: {
    backgroundColor: COLORS.primaryGlow, borderRadius: RADIUS.m, padding: SPACING.m,
    borderWidth: 1, borderColor: 'rgba(0,229,204,0.15)', marginBottom: SPACING.m,
  },
  templateHeader: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginBottom: SPACING.s,
  },
  templateLabel: { fontSize: 11, fontWeight: '700', color: COLORS.primary, letterSpacing: 1.5 },
  templateDate: { fontSize: 14, color: COLORS.text, fontWeight: '600', marginBottom: SPACING.xs },
  templateAngles: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  templateAnglesText: { fontSize: 12, color: COLORS.textTertiary },
  firstTimeCard: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.m, padding: SPACING.m,
    borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.m,
  },
  firstTimeText: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20 },
  footer: { padding: SPACING.m, paddingBottom: SPACING.l },
  startBtn: { borderRadius: RADIUS.m, overflow: 'hidden' },
  startBtnGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, gap: SPACING.s,
  },
  startBtnText: { color: COLORS.background, fontWeight: '800', fontSize: 16, letterSpacing: 0.5 },
});
