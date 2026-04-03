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
import { Dumbbell, Sun, AlertTriangle } from 'lucide-react-native';

const SEVERITY_COLOR = {
  mild: COLORS.success,
  moderate: '#F59E0B',
  severe: COLORS.accent,
};

function formatDateHeader(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (dateStr === today.toISOString().split('T')[0]) return 'Today';
  if (dateStr === yesterday.toISOString().split('T')[0]) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function groupByDate(logs) {
  const map = {};
  for (const log of logs) {
    const key = log.date;
    if (!map[key]) map[key] = [];
    map[key].push(log);
  }
  return Object.entries(map)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, data]) => ({ title: date, data }));
}

const HabitRow = memo(function HabitRow({ item }) {
  const sevColor = SEVERITY_COLOR[item.severity] ?? COLORS.textTertiary;
  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <View style={[styles.severityDot, { backgroundColor: sevColor }]} />
        <View style={styles.rowBody}>
          <Text style={styles.rowTitle}>{item.habit_label}</Text>
          {!!item.exercise && (
            <Text style={styles.rowSub}>During {item.exercise}</Text>
          )}
          {!!item.feeling && (
            <Text style={styles.rowNote}>{item.feeling}</Text>
          )}
        </View>
      </View>
      <View style={styles.rowRight}>
        <Text style={[styles.severityBadge, { color: sevColor }]}>
          {(item.severity ?? 'moderate').toUpperCase()}
        </Text>
        <Text style={styles.contextBadge}>
          {item.context === 'daily' ? 'DAILY' : 'GYM'}
        </Text>
      </View>
    </View>
  );
});

const FILTERS = [
  { key: 'all', label: 'All', icon: AlertTriangle },
  { key: 'gym', label: 'Gym', icon: Dumbbell },
  { key: 'daily', label: 'Daily', icon: Sun },
];

export default function HabitHistoryScreen() {
  const { user } = useAuth();
  const [allLogs, setAllLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');

  useFocusEffect(useCallback(() => {
    let active = true;
    async function fetch() {
      setLoading(true);
      const { data } = await supabase
        .from('habit_logs')
        .select('id, date, habit_label, severity, exercise, feeling, context')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });
      if (active) {
        setAllLogs(data ?? []);
        setLoading(false);
      }
    }
    fetch();
    return () => { active = false; };
  }, [user.id]));

  const filtered = activeFilter === 'all'
    ? allLogs
    : allLogs.filter(l => (l.context ?? 'gym') === activeFilter);

  const sections = groupByDate(filtered);

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>HABIT HISTORY</Text>
          <Text style={styles.headerSub}>{allLogs.length} asymmetries logged</Text>
        </View>

        {/* Filter pills */}
        <View style={styles.filterRow}>
          {FILTERS.map(f => {
            const Icon = f.icon;
            const active = activeFilter === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                style={[styles.filterPill, active && styles.filterPillActive]}
                onPress={() => setActiveFilter(f.key)}
                activeOpacity={0.7}
              >
                <Icon size={13} color={active ? COLORS.background : COLORS.textTertiary} />
                <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {loading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: SPACING.xl }} />
        ) : sections.length === 0 ? (
          <View style={styles.empty}>
            <AlertTriangle color={COLORS.textTertiary} size={40} />
            <Text style={styles.emptyTitle}>No habits logged yet</Text>
            <Text style={styles.emptySub}>
              Use the Log tab to record asymmetries you notice during training.
            </Text>
          </View>
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={item => item.id}
            renderItem={({ item }) => <HabitRow item={item} />}
            renderSectionHeader={({ section }) => (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionHeaderText}>
                  {formatDateHeader(section.title)}
                </Text>
                <Text style={styles.sectionCount}>
                  {section.data.length} {section.data.length === 1 ? 'entry' : 'entries'}
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

  header: { paddingHorizontal: SPACING.m, paddingTop: SPACING.m, paddingBottom: SPACING.s },
  headerTitle: { fontSize: 28, fontWeight: '900', color: COLORS.text, letterSpacing: -0.5 },
  headerSub: { fontSize: 13, color: COLORS.textTertiary, marginTop: 2 },

  filterRow: {
    flexDirection: 'row', gap: SPACING.s,
    paddingHorizontal: SPACING.m, paddingBottom: SPACING.m,
  },
  filterPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: SPACING.m, paddingVertical: 8,
    borderRadius: RADIUS.full, backgroundColor: COLORS.surface,
    borderWidth: 1, borderColor: COLORS.border,
  },
  filterPillActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterPillText: { fontSize: 12, fontWeight: '700', color: COLORS.textTertiary, letterSpacing: 0.5 },
  filterPillTextActive: { color: COLORS.background },

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
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    backgroundColor: COLORS.surface, borderRadius: RADIUS.m,
    padding: SPACING.m, marginBottom: SPACING.s,
    borderWidth: 1, borderColor: COLORS.border,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.m, flex: 1 },
  severityDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
  rowBody: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  rowSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  rowNote: {
    fontSize: 12, color: COLORS.textTertiary, marginTop: 4,
    fontStyle: 'italic', lineHeight: 17,
  },
  rowRight: { alignItems: 'flex-end', gap: 4, marginLeft: SPACING.s },
  severityBadge: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  contextBadge: {
    fontSize: 10, fontWeight: '600', color: COLORS.textTertiary, letterSpacing: 0.5,
  },

  empty: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: SPACING.xl, gap: SPACING.m,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, textAlign: 'center' },
  emptySub: {
    fontSize: 14, color: COLORS.textTertiary, textAlign: 'center', lineHeight: 22,
  },
});
