import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import ScoreTrendChart from '../components/ScoreTrendChart';
import {
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus,
  GitCompare,
  X,
  Calendar,
  BarChart2,
} from 'lucide-react-native';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function scoreColor(score) {
  if (score >= 80) return COLORS.success;
  if (score >= 60) return '#F59E0B';
  return COLORS.accent;
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function DeltaBadge({ delta }) {
  if (delta === null || delta === undefined) return null;
  const abs = Math.abs(delta);
  if (abs < 1) return <Minus color={COLORS.textTertiary} size={14} />;
  if (delta > 0) return (
    <View style={[styles.deltaBadge, { backgroundColor: 'rgba(0, 214, 143, 0.12)' }]}>
      <TrendingUp color={COLORS.success} size={12} />
      <Text style={[styles.deltaText, { color: COLORS.success }]}>+{delta}</Text>
    </View>
  );
  return (
    <View style={[styles.deltaBadge, { backgroundColor: 'rgba(255, 71, 87, 0.12)' }]}>
      <TrendingDown color={COLORS.danger} size={12} />
      <Text style={[styles.deltaText, { color: COLORS.danger }]}>{delta}</Text>
    </View>
  );
}

// ─── Session row ─────────────────────────────────────────────────────────────

function SessionRow({ session, prevScore, onView, onCompare }) {
  const delta = prevScore != null ? session.avgScore - prevScore : null;

  return (
    <TouchableOpacity style={styles.sessionRow} onPress={onView} activeOpacity={0.75}>
      <View style={styles.sessionRowLeft}>
        <Text style={styles.sessionDate}>{formatDate(session.date)}</Text>
        <Text style={styles.sessionAngles}>
          {session.angles.join(' · ').toUpperCase()} · {session.angles.length} angle{session.angles.length !== 1 ? 's' : ''}
        </Text>
      </View>
      <View style={styles.sessionRowRight}>
        <DeltaBadge delta={delta} />
        <Text style={[styles.sessionScore, { color: scoreColor(session.avgScore) }]}>
          {session.avgScore}
        </Text>
        <Text style={styles.sessionScoreUnit}>/100</Text>
        {onCompare && (
          <TouchableOpacity
            style={styles.compareBtn}
            onPress={e => { e.stopPropagation(); onCompare(); }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <GitCompare color={COLORS.textTertiary} size={16} />
          </TouchableOpacity>
        )}
        <ChevronRight color={COLORS.textTertiary} size={16} />
      </View>
    </TouchableOpacity>
  );
}

// ─── Lift group ───────────────────────────────────────────────────────────────

function LiftGroup({ categoryId, categoryLabel, sessions, onViewSession, onCompare }) {
  const [expanded, setExpanded] = useState(true);

  const trendData = sessions.map(s => ({ date: s.date, score: s.avgScore })).reverse();

  return (
    <View style={styles.liftGroup}>
      <TouchableOpacity
        style={styles.liftHeader}
        onPress={() => setExpanded(v => !v)}
        activeOpacity={0.8}
      >
        <View style={styles.liftHeaderLeft}>
          <BarChart2 color={COLORS.primary} size={16} />
          <Text style={styles.liftLabel}>{categoryLabel.toUpperCase()}</Text>
          <View style={styles.sessionCountBadge}>
            <Text style={styles.sessionCountText}>{sessions.length}</Text>
          </View>
        </View>
        <View style={styles.liftHeaderRight}>
          <Text style={[styles.liftAvg, { color: scoreColor(sessions[0].avgScore) }]}>
            {sessions[0].avgScore}
          </Text>
          <ChevronRight
            color={COLORS.textTertiary}
            size={16}
            style={{ transform: [{ rotate: expanded ? '90deg' : '0deg' }] }}
          />
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.liftBody}>
          {trendData.length >= 2 && (
            <View style={styles.chartWrap}>
              <ScoreTrendChart data={trendData} />
            </View>
          )}

          {sessions.map((session, idx) => (
            <SessionRow
              key={session.id}
              session={session}
              prevScore={idx < sessions.length - 1 ? sessions[idx + 1].avgScore : null}
              onView={() => onViewSession(session)}
              onCompare={sessions.length > 1 ? () => onCompare(session, sessions) : null}
            />
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Compare picker modal ─────────────────────────────────────────────────────

function ComparePicker({ visible, baseSession, sessions, onSelect, onClose }) {
  const others = sessions.filter(s => s.id !== baseSession?.id);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Compare against…</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X color={COLORS.textSecondary} size={20} />
            </TouchableOpacity>
          </View>
          <Text style={styles.modalSub}>
            Base: {baseSession ? formatDate(baseSession.date) : ''} · {baseSession?.avgScore}/100
          </Text>
          <FlatList
            data={others}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.pickerRow}
                onPress={() => onSelect(baseSession, item)}
                activeOpacity={0.75}
              >
                <View>
                  <Text style={styles.pickerDate}>{formatDate(item.date)}</Text>
                  <Text style={styles.pickerAngles}>{item.angles.join(' · ').toUpperCase()}</Text>
                </View>
                <View style={styles.pickerScoreWrap}>
                  <Text style={[styles.pickerScore, { color: scoreColor(item.avgScore) }]}>
                    {item.avgScore}
                  </Text>
                  <Text style={styles.pickerUnit}>/100</Text>
                </View>
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={styles.pickerSep} />}
          />
        </View>
      </View>
    </Modal>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function SessionHistoryScreen({ navigation }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState({}); // { categoryId: { label, sessions[] } }
  const [compareBase, setCompareBase] = useState(null);
  const [compareSiblings, setCompareSiblings] = useState([]);
  const [showPicker, setShowPicker] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchHistory();
    }, [])
  );

  async function fetchHistory() {
    setLoading(true);
    try {
      // Fetch all completed, analyzed sessions
      const { data: sessionRows } = await supabase
        .from('gym_sessions')
        .select('id, category_id, category_label, date, created_at')
        .eq('user_id', user.id)
        .eq('status', 'complete')
        .eq('analysis_status', 'complete')
        .order('date', { ascending: false })
        .limit(100);

      if (!sessionRows?.length) {
        setGroups({});
        setLoading(false);
        return;
      }

      const sessionIds = sessionRows.map(s => s.id);

      // Fetch analysis results for all sessions
      const { data: analysisRows } = await supabase
        .from('analysis_results')
        .select('session_id, angle, symmetry_score')
        .in('session_id', sessionIds);

      // Build a score map: sessionId → { avgScore, angles }
      const scoreMap = {};
      for (const row of analysisRows ?? []) {
        if (!scoreMap[row.session_id]) scoreMap[row.session_id] = { scores: [], angles: [] };
        scoreMap[row.session_id].scores.push(row.symmetry_score);
        scoreMap[row.session_id].angles.push(row.angle);
      }

      // Group sessions by category
      const grouped = {};
      for (const s of sessionRows) {
        const sm = scoreMap[s.id];
        if (!sm) continue; // No analysis yet — skip

        const avgScore = Math.round(sm.scores.reduce((a, b) => a + b, 0) / sm.scores.length);
        const session = {
          id: s.id,
          date: s.date || s.created_at,
          avgScore,
          angles: [...new Set(sm.angles)],
          categoryLabel: s.category_label,
          categoryId: s.category_id,
        };

        if (!grouped[s.category_id]) {
          grouped[s.category_id] = { label: s.category_label, sessions: [] };
        }
        grouped[s.category_id].sessions.push(session);
      }

      setGroups(grouped);
    } catch (e) {
      console.warn('SessionHistoryScreen fetch error:', e.message);
    }
    setLoading(false);
  }

  async function handleViewSession(session) {
    // Fetch full analysis results for this session
    const { data: results } = await supabase
      .from('analysis_results')
      .select('angle, symmetry_score, issues, keypoints')
      .eq('session_id', session.id);

    const { data: videos } = await supabase
      .from('session_videos')
      .select('angle, storage_path')
      .eq('session_id', session.id);

    const videoMap = {};
    for (const v of videos ?? []) videoMap[v.angle] = v.storage_path;

    const enriched = (results ?? []).map(r => ({
      ...r,
      storagePath: videoMap[r.angle] ?? null,
    }));

    navigation.navigate('SessionResult', {
      sessionId: session.id,
      category: { id: session.categoryId, label: session.categoryLabel },
      analysisResults: enriched,
    });
  }

  async function handleSelectCompare(baseSession, targetSession) {
    setShowPicker(false);

    const fetchFull = async (session) => {
      const { data: results } = await supabase
        .from('analysis_results')
        .select('angle, symmetry_score, issues, keypoints')
        .eq('session_id', session.id);

      const { data: videos } = await supabase
        .from('session_videos')
        .select('angle, storage_path')
        .eq('session_id', session.id);

      const videoMap = {};
      for (const v of videos ?? []) videoMap[v.angle] = v.storage_path;

      return (results ?? []).map(r => ({ ...r, storagePath: videoMap[r.angle] ?? null }));
    };

    const [baseResults, targetResults] = await Promise.all([
      fetchFull(baseSession),
      fetchFull(targetSession),
    ]);

    navigation.navigate('CompareSession', {
      currentResults: baseResults,
      previousResults: targetResults,
      currentDate: baseSession.date,
      previousDate: targetSession.date,
      categoryLabel: baseSession.categoryLabel,
    });
  }

  const categoryIds = Object.keys(groups);
  const totalSessions = categoryIds.reduce((sum, k) => sum + groups[k].sessions.length, 0);

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>SESSION HISTORY</Text>
          {totalSessions > 0 && (
            <View style={styles.headerBadge}>
              <Calendar color={COLORS.textTertiary} size={12} />
              <Text style={styles.headerBadgeText}>{totalSessions} sessions</Text>
            </View>
          )}
        </View>

        {loading && (
          <View style={styles.centered}>
            <ActivityIndicator color={COLORS.primary} size="large" />
          </View>
        )}

        {!loading && categoryIds.length === 0 && (
          <View style={styles.centered}>
            <TrendingUp color={COLORS.textTertiary} size={40} />
            <Text style={styles.emptyTitle}>No sessions yet</Text>
            <Text style={styles.emptyBody}>
              Record and analyze a set to see your progress here.
            </Text>
            <TouchableOpacity
              style={styles.recordBtn}
              onPress={() => navigation.navigate('SessionSetup')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[COLORS.primary, COLORS.primaryDim]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.recordBtnGradient}
              >
                <Text style={styles.recordBtnText}>Record a Set</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {!loading && categoryIds.length > 0 && (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {categoryIds.map(catId => (
              <LiftGroup
                key={catId}
                categoryId={catId}
                categoryLabel={groups[catId].label}
                sessions={groups[catId].sessions}
                onViewSession={handleViewSession}
                onCompare={(session, allSessions) => {
                  setCompareBase(session);
                  setCompareSiblings(allSessions);
                  setShowPicker(true);
                }}
              />
            ))}
            <View style={{ height: SPACING.xl }} />
          </ScrollView>
        )}
      </SafeAreaView>

      <ComparePicker
        visible={showPicker}
        baseSession={compareBase}
        sessions={compareSiblings}
        onSelect={handleSelectCompare}
        onClose={() => setShowPicker(false)}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
    gap: SPACING.m,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.m,
    paddingTop: SPACING.m,
    paddingBottom: SPACING.s,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: 2,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.s,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerBadgeText: {
    fontSize: 11,
    color: COLORS.textTertiary,
    fontWeight: '600',
  },
  scrollContent: {
    padding: SPACING.m,
    gap: SPACING.m,
  },

  // ─── Empty state ───
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: SPACING.m,
  },
  emptyBody: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  recordBtn: {
    marginTop: SPACING.m,
    borderRadius: RADIUS.m,
    overflow: 'hidden',
  },
  recordBtnGradient: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: 14,
  },
  recordBtnText: {
    color: COLORS.background,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // ─── Lift group ───
  liftGroup: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.l,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  liftHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.m,
  },
  liftHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
  },
  liftLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: 1,
  },
  sessionCountBadge: {
    backgroundColor: COLORS.primaryGlow,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  sessionCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  liftHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
  },
  liftAvg: {
    fontSize: 22,
    fontWeight: '900',
  },
  liftBody: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  chartWrap: {
    padding: SPACING.m,
    paddingBottom: SPACING.s,
  },

  // ─── Session row ───
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.m,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  sessionRowLeft: {
    flex: 1,
  },
  sessionDate: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  sessionAngles: {
    fontSize: 11,
    color: COLORS.textTertiary,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  sessionRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
  },
  sessionScore: {
    fontSize: 22,
    fontWeight: '900',
  },
  sessionScoreUnit: {
    fontSize: 12,
    color: COLORS.textTertiary,
    fontWeight: '500',
    marginRight: SPACING.xs,
  },
  compareBtn: {
    padding: 4,
  },

  // ─── Delta badge ───
  deltaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: RADIUS.s,
  },
  deltaText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // ─── Compare picker modal ───
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingTop: SPACING.m,
    paddingBottom: SPACING.xl,
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.m,
    marginBottom: SPACING.s,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  modalSub: {
    fontSize: 12,
    color: COLORS.textTertiary,
    paddingHorizontal: SPACING.m,
    marginBottom: SPACING.m,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.m,
  },
  pickerDate: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  pickerAngles: {
    fontSize: 11,
    color: COLORS.textTertiary,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  pickerScoreWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  pickerScore: {
    fontSize: 22,
    fontWeight: '900',
  },
  pickerUnit: {
    fontSize: 12,
    color: COLORS.textTertiary,
    fontWeight: '500',
    marginBottom: 3,
  },
  pickerSep: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.m,
  },
});
