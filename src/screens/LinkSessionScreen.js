import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import { GYM_HABITS } from '../data/mockData';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircle, Video, Calendar, ChevronRight } from 'lucide-react-native';
import { analyzeSession } from '../lib/analysis';

export default function LinkSessionScreen({ navigation, route }) {
  const { category, sessionId, recordedAngles } = route.params;
  const { user } = useAuth();
  const [todaySessions, setTodaySessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(sessionId);
  const [selectedHabits, setSelectedHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => { fetchTodaySessions(); }, []);

  async function fetchTodaySessions() {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('gym_sessions')
      .select('*, session_videos(angle)')
      .eq('user_id', user.id)
      .eq('date', today)
      .order('created_at', { ascending: false });
    setTodaySessions(data ?? []);
    setLoading(false);
  }

  const toggleHabit = (id) => {
    setSelectedHabits(prev =>
      prev.includes(id) ? prev.filter(h => h !== id) : [...prev, id]
    );
  };

  const handleConfirm = async () => {
    setSaving(true);

    // Mark session as complete
    const { error } = await supabase
      .from('gym_sessions')
      .update({ status: 'complete' })
      .eq('id', selectedSessionId);

    if (error) {
      setSaving(false);
      setErrorMsg(error.message);
      return;
    }

    // Log linked habit asymmetries if any selected
    if (selectedHabits.length > 0) {
      const today = new Date().toISOString().split('T')[0];
      const habitRows = selectedHabits.map(habitId => {
        const habit = GYM_HABITS.find(h => h.id === habitId);
        return {
          user_id: user.id,
          date: today,
          habit_id: habitId,
          habit_label: habit?.label ?? habitId,
          exercise: category.label,
          severity: 'moderate',
          context: 'gym',
        };
      });
      await supabase.from('habit_logs').insert(habitRows);
    }

    // Run AI analysis
    setAnalyzing(true);
    setSaving(false);

    try {
      const { results, hasFailure } = await analyzeSession(selectedSessionId, user.id);

      navigation.navigate('SessionResult', {
        sessionId: selectedSessionId,
        category,
        analysisResults: results,
      });
    } catch (err) {
      setErrorMsg('Session saved — analysis could not complete. Check History to view results later.');
      setTimeout(() => navigation.popToTop(), 3000);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>LINK SESSION</Text>
          <Text style={styles.headerSub}>{category.label}</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Recorded angles summary */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <Video color={COLORS.primary} size={16} />
              <Text style={styles.summaryLabel}>RECORDED</Text>
            </View>
            <View style={styles.angleChips}>
              {recordedAngles.map(angle => (
                <View key={angle} style={styles.angleChip}>
                  <CheckCircle color={COLORS.success} size={12} />
                  <Text style={styles.angleChipText}>{angle.toUpperCase()}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Today's sessions */}
          <Text style={styles.sectionLabel}>LINK TO SESSION</Text>
          {loading ? (
            <ActivityIndicator color={COLORS.primary} />
          ) : (
            <>
              {todaySessions.map(session => (
                <TouchableOpacity
                  key={session.id}
                  style={[styles.sessionCard, selectedSessionId === session.id && styles.sessionCardSelected]}
                  onPress={() => setSelectedSessionId(session.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.sessionInfo}>
                    <Calendar color={selectedSessionId === session.id ? COLORS.primary : COLORS.textTertiary} size={16} />
                    <View>
                      <Text style={[styles.sessionLabel, selectedSessionId === session.id && styles.sessionLabelSelected]}>
                        {session.category_label}
                      </Text>
                      <Text style={styles.sessionAngles}>
                        {session.session_videos?.map(v => v.angle).join(', ') || 'No angles yet'}
                      </Text>
                    </View>
                  </View>
                  {selectedSessionId === session.id && (
                    <CheckCircle color={COLORS.primary} size={18} />
                  )}
                </TouchableOpacity>
              ))}
            </>
          )}

          {/* Optional habit log */}
          <Text style={[styles.sectionLabel, { marginTop: SPACING.l }]}>
            LOG ASYMMETRIES NOTICED (OPTIONAL)
          </Text>
          <View style={styles.habitChips}>
            {GYM_HABITS.map(habit => (
              <TouchableOpacity
                key={habit.id}
                style={[styles.habitChip, selectedHabits.includes(habit.id) && styles.habitChipSelected]}
                onPress={() => toggleHabit(habit.id)}
                activeOpacity={0.7}
              >
                <Text style={[styles.habitChipText, selectedHabits.includes(habit.id) && styles.habitChipTextSelected]}>
                  {habit.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          {!!errorMsg && (
            <Text style={styles.errorMsg}>{errorMsg}</Text>
          )}
          <TouchableOpacity
            style={[styles.confirmBtn, (!selectedSessionId || saving || analyzing) && { opacity: 0.6 }]}
            onPress={handleConfirm}
            activeOpacity={0.8}
            disabled={!selectedSessionId || saving || analyzing}
          >
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryDim]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.confirmBtnGradient}
            >
              {saving || analyzing ? (
                <>
                  <ActivityIndicator color={COLORS.background} />
                  <Text style={styles.confirmBtnText}>
                    {analyzing ? 'Analyzing...' : 'Saving...'}
                  </Text>
                </>
              ) : (
                <>
                  <CheckCircle color={COLORS.background} size={20} />
                  <Text style={styles.confirmBtnText}>Save Session</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { padding: SPACING.m, paddingBottom: SPACING.s },
  headerTitle: {
    fontSize: 28, fontWeight: '900', color: COLORS.text, letterSpacing: -0.5,
  },
  headerSub: { fontSize: 14, color: COLORS.primary, fontWeight: '600', marginTop: 2 },

  content: { padding: SPACING.m, paddingTop: SPACING.s },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: COLORS.textTertiary,
    letterSpacing: 1.5, marginBottom: SPACING.m,
  },

  summaryCard: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.m, padding: SPACING.m,
    borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.l,
  },
  summaryHeader: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginBottom: SPACING.s,
  },
  summaryLabel: { fontSize: 11, fontWeight: '700', color: COLORS.primary, letterSpacing: 1.5 },
  angleChips: { flexDirection: 'row', gap: SPACING.s, flexWrap: 'wrap' },
  angleChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.successGlow, paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.xs, borderRadius: RADIUS.full,
  },
  angleChipText: { fontSize: 12, fontWeight: '700', color: COLORS.success },

  sessionCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.surface, borderRadius: RADIUS.m, padding: SPACING.m,
    borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.s,
  },
  sessionCardSelected: { backgroundColor: COLORS.primaryGlow, borderColor: COLORS.primary },
  sessionInfo: { flexDirection: 'row', alignItems: 'center', gap: SPACING.m },
  sessionLabel: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  sessionLabelSelected: { color: COLORS.primary },
  sessionAngles: { fontSize: 12, color: COLORS.textTertiary, marginTop: 2 },

  habitChips: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.s },
  habitChip: {
    paddingHorizontal: SPACING.m, paddingVertical: 10, borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
  },
  habitChipSelected: { backgroundColor: COLORS.primaryGlow, borderColor: COLORS.primary },
  habitChipText: { color: COLORS.textSecondary, fontWeight: '600', fontSize: 13 },
  habitChipTextSelected: { color: COLORS.primary },

  errorMsg: {
    color: COLORS.danger ?? '#ff4757', fontSize: 13, fontWeight: '600',
    textAlign: 'center', marginBottom: SPACING.s,
  },
  footer: { padding: SPACING.m, paddingBottom: SPACING.l },
  confirmBtn: { borderRadius: RADIUS.m, overflow: 'hidden' },
  confirmBtnGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, gap: SPACING.s,
  },
  confirmBtnText: { color: COLORS.background, fontWeight: '800', fontSize: 16, letterSpacing: 0.5 },
});
