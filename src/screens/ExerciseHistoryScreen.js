import React, { useState, useCallback, memo } from 'react';
import {
  View, Text, StyleSheet, SectionList,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { EXERCISES } from '../data/mockData';
import { Dumbbell, CheckCircle, Library } from 'lucide-react-native';

function formatDateHeader(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (dateStr === today.toISOString().split('T')[0]) return 'Today';
  if (dateStr === yesterday.toISOString().split('T')[0]) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function groupByDate(sessions) {
  const map = {};
  for (const s of sessions) {
    const key = s.completed_at.split('T')[0];
    if (!map[key]) map[key] = [];
    map[key].push(s);
  }
  return Object.entries(map)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, data]) => ({ title: date, data }));
}

const DIFFICULTY_COLOR = {
  Beginner: COLORS.success,
  Intermediate: '#F59E0B',
  Advanced: COLORS.accent,
};

const ExerciseRow = memo(function ExerciseRow({ item }) {
  const exercise = EXERCISES.find(e => e.id === item.exercise_id);
  if (!exercise) return null;

  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <CheckCircle color={COLORS.success} size={18} />
        <View style={styles.rowBody}>
          <Text style={styles.rowTitle}>{exercise.title}</Text>
          <View style={styles.rowMeta}>
            <View style={[styles.categoryChip, { borderColor: DIFFICULTY_COLOR[exercise.difficulty] ?? COLORS.border }]}>
              <Text style={[styles.categoryChipText, { color: DIFFICULTY_COLOR[exercise.difficulty] ?? COLORS.textTertiary }]}>
                {exercise.category}
              </Text>
            </View>
            <Text style={styles.metaDot}>·</Text>
            <Text style={styles.metaText}>{exercise.duration}</Text>
          </View>
          {!!item.notes && (
            <Text style={styles.rowNote}>{item.notes}</Text>
          )}
        </View>
      </View>
    </View>
  );
});

export default function ExerciseHistoryScreen({ navigation }) {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    let active = true;
    async function fetch() {
      setLoading(true);
      const { data } = await supabase
        .from('workout_sessions')
        .select('id, exercise_id, completed_at, notes')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false });
      if (active) {
        setSessions(data ?? []);
        setLoading(false);
      }
    }
    fetch();
    return () => { active = false; };
  }, [user.id]));

  const sections = groupByDate(sessions);

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>EXERCISE HISTORY</Text>
          <Text style={styles.headerSub}>
            {sessions.length} {sessions.length === 1 ? 'session' : 'sessions'} completed
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: SPACING.xl }} />
        ) : sections.length === 0 ? (
          <View style={styles.empty}>
            <Dumbbell color={COLORS.textTertiary} size={40} />
            <Text style={styles.emptyTitle}>No exercises completed yet</Text>
            <Text style={styles.emptySub}>
              Open an exercise from the Library and tap Mark as Complete to track your progress.
            </Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => navigation.navigate('Library')}
              activeOpacity={0.8}
            >
              <Library color={COLORS.background} size={16} />
              <Text style={styles.emptyBtnText}>Open Library</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={item => item.id}
            renderItem={({ item }) => <ExerciseRow item={item} />}
            renderSectionHeader={({ section }) => (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionHeaderText}>
                  {formatDateHeader(section.title)}
                </Text>
                <Text style={styles.sectionCount}>
                  {section.data.length} {section.data.length === 1 ? 'exercise' : 'exercises'}
                </Text>
              </View>
            )}
            contentContainerStyle={styles.listContent}
            stickySectionHeadersEnabled={false}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  header: { paddingHorizontal: SPACING.m, paddingTop: SPACING.m, paddingBottom: SPACING.m },
  headerTitle: { fontSize: 28, fontWeight: '900', color: COLORS.text, letterSpacing: -0.5 },
  headerSub: { fontSize: 13, color: COLORS.textTertiary, marginTop: 2 },

  listContent: { paddingHorizontal: SPACING.m, paddingBottom: SPACING.xl },

  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: SPACING.s, marginTop: SPACING.m,
  },
  sectionHeaderText: {
    fontSize: 12, fontWeight: '700', color: COLORS.primary, letterSpacing: 1.5,
  },
  sectionCount: { fontSize: 11, color: COLORS.textTertiary, fontWeight: '600' },

  row: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: COLORS.surface, borderRadius: RADIUS.m,
    padding: SPACING.m, marginBottom: SPACING.s,
    borderWidth: 1, borderColor: COLORS.border,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.m, flex: 1 },
  rowBody: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  rowMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  categoryChip: {
    paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: RADIUS.full, borderWidth: 1,
  },
  categoryChipText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  metaDot: { color: COLORS.textTertiary, fontSize: 12 },
  metaText: { fontSize: 12, color: COLORS.textTertiary },
  rowNote: {
    fontSize: 12, color: COLORS.textTertiary, marginTop: 4, fontStyle: 'italic', lineHeight: 17,
  },

  empty: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: SPACING.xl, gap: SPACING.m,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, textAlign: 'center' },
  emptySub: {
    fontSize: 14, color: COLORS.textTertiary, textAlign: 'center', lineHeight: 22,
  },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.s,
    backgroundColor: COLORS.primary, paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.m, borderRadius: RADIUS.m, marginTop: SPACING.s,
  },
  emptyBtnText: { color: COLORS.background, fontWeight: '800', fontSize: 15 },
});
