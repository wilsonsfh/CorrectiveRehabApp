import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { EXERCISES, GYM_HABITS } from '../data/mockData';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  Scan,
  Activity,
  Library,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
  Zap,
  Target,
  Video,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');
const CARD_GAP = SPACING.m;
const CARD_WIDTH = (width - SPACING.m * 2 - CARD_GAP) / 2;

const HomeScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [recentLog, setRecentLog] = useState(null);
  const [stats, setStats] = useState({ logs: 0, activeIssues: 0, sessions: 0 });
  const [loadingData, setLoadingData] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  async function fetchData() {
    setLoadingData(true);

    const [recentRes, logsCountRes, issuesRes, sessionsCountRes] = await Promise.all([
      supabase
        .from('habit_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('habit_logs')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id),
      supabase
        .from('habit_logs')
        .select('habit_id')
        .eq('user_id', user.id),
      supabase
        .from('workout_sessions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id),
    ]);

    setRecentLog(recentRes.data ?? null);

    const uniqueIssues = new Set((issuesRes.data ?? []).map(r => r.habit_id));
    setStats({
      logs: logsCountRes.count ?? 0,
      activeIssues: uniqueIssues.size,
      sessions: sessionsCountRes.count ?? 0,
    });

    setLoadingData(false);
  }

  const matchedHabit = recentLog
    ? GYM_HABITS.find(h => h.id === recentLog.habit_id)
    : null;
  const suggestedExercise = matchedHabit
    ? EXERCISES.find(e => e.title === matchedHabit.suggestedFix)
    : null;

  const FEATURES = [
    {
      icon: Scan,
      title: 'Symmetry\nScanner',
      color: COLORS.primary,
      glow: COLORS.primaryGlow,
      subtitle: 'AI Form Audit',
    },
    {
      icon: Activity,
      title: 'Habit\nTracker',
      color: COLORS.accent,
      glow: COLORS.accentGlow,
      subtitle: 'Log Patterns',
      onPress: () => navigation.navigate('Log'),
    },
    {
      icon: Library,
      title: 'Form\nLibrary',
      color: COLORS.success,
      glow: COLORS.successGlow,
      subtitle: 'Corrective Drills',
      onPress: () => navigation.navigate('Library'),
    },
    {
      icon: TrendingUp,
      title: 'Progress\nDashboard',
      color: '#A78BFA',
      glow: 'rgba(167, 139, 250, 0.12)',
      subtitle: 'Track Gains',
    },
  ];

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* ─── HERO ─── */}
          <View style={styles.hero}>
            <View style={styles.heroTopRow}>
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveBadgeText}>FORM CHECK</Text>
              </View>
            </View>

            <Text style={styles.heroTitle}>
              CRUSH YOUR{'\n'}
              <Text style={styles.heroAccent}>ASYMMETRY.</Text>
            </Text>
            <Text style={styles.heroSubtitle}>
              OPTIMIZE EVERY REP.
            </Text>

            <Text style={styles.heroDescription}>
              AI-powered biomechanical auditing for lifters who refuse to train
              around their weaknesses.
            </Text>

            <View style={styles.heroActions}>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => navigation.navigate('Log')}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[COLORS.primary, COLORS.primaryDim]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.primaryBtnGradient}
                >
                  <Video color={COLORS.background} size={18} />
                  <Text style={styles.primaryBtnText}>Record Set</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => navigation.navigate('Log')}
                activeOpacity={0.8}
              >
                <Target color={COLORS.primary} size={18} />
                <Text style={styles.secondaryBtnText}>Log Habit</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ─── SYMMETRY SCORE (placeholder) ─── */}
          <View style={styles.scoreCard}>
            <LinearGradient
              colors={['rgba(0, 229, 204, 0.08)', 'rgba(0, 229, 204, 0.02)']}
              style={styles.scoreCardGradient}
            >
              <View style={styles.scoreHeader}>
                <Text style={styles.scoreLabel}>SYMMETRY SCORE</Text>
                <View style={styles.scoreTrend}>
                  <TrendingUp color={COLORS.success} size={14} />
                  <Text style={styles.scoreTrendText}>+3%</Text>
                </View>
              </View>
              <View style={styles.scoreRow}>
                <Text style={styles.scoreValue}>74</Text>
                <Text style={styles.scoreUnit}>/100</Text>
                <View style={styles.scoreBarContainer}>
                  <View style={styles.scoreBarBg}>
                    <LinearGradient
                      colors={[COLORS.accent, COLORS.primary]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[styles.scoreBarFill, { width: '74%' }]}
                    />
                  </View>
                  <Text style={styles.scoreBarLabel}>
                    Target: 85+
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* ─── FEATURE GRID ─── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>TOOLS</Text>
            <View style={styles.sectionLine} />
          </View>

          <View style={styles.featureGrid}>
            {FEATURES.map((feature, index) => (
              <TouchableOpacity
                key={index}
                style={styles.featureCard}
                onPress={feature.onPress}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.featureIconContainer,
                    { backgroundColor: feature.glow },
                  ]}
                >
                  <feature.icon color={feature.color} size={22} />
                </View>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureSubtitle}>{feature.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ─── ASYMMETRY ALERT ─── */}
          {loadingData && (
            <ActivityIndicator
              color={COLORS.primary}
              size="large"
              style={{ marginVertical: SPACING.l }}
            />
          )}

          {!loadingData && recentLog && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>LATEST ALERT</Text>
                <View style={styles.sectionLine} />
              </View>

              <TouchableOpacity
                style={styles.alertCard}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('Library')}
              >
                <LinearGradient
                  colors={[COLORS.accentGlow, 'transparent']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.alertGradient}
                >
                  <View style={styles.alertTop}>
                    <View style={styles.alertIconWrap}>
                      <AlertTriangle color={COLORS.accent} size={20} />
                    </View>
                    <View style={styles.alertContent}>
                      <Text style={styles.alertTitle}>
                        {recentLog.habit_label} Detected
                      </Text>
                      <Text style={styles.alertMeta}>
                        {recentLog.exercise ?? 'Workout'} · {recentLog.date}
                      </Text>
                    </View>
                    <View style={styles.severityBadge}>
                      <Text style={styles.severityText}>
                        {recentLog.severity?.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  {recentLog.feeling ? (
                    <Text style={styles.alertDescription}>
                      {recentLog.feeling}
                    </Text>
                  ) : null}

                  {matchedHabit && (
                    <View style={styles.alertImpact}>
                      <Zap color={COLORS.accent} size={14} />
                      <Text style={styles.alertImpactText}>
                        {matchedHabit.gymImpact}
                      </Text>
                    </View>
                  )}

                  {suggestedExercise && (
                    <View style={styles.alertFix}>
                      <Text style={styles.alertFixLabel}>SUGGESTED FIX</Text>
                      <View style={styles.alertFixRow}>
                        <Text style={styles.alertFixName}>
                          {suggestedExercise.title}
                        </Text>
                        <ChevronRight color={COLORS.primary} size={16} />
                      </View>
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}

          {/* ─── QUICK STATS ─── */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.logs}</Text>
              <Text style={styles.statLabel}>Sessions{'\n'}Logged</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: COLORS.accent }]}>{stats.activeIssues}</Text>
              <Text style={styles.statLabel}>Active{'\n'}Asymmetries</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: COLORS.success }]}>{stats.sessions}</Text>
              <Text style={styles.statLabel}>Exercises{'\n'}Completed</Text>
            </View>
          </View>

          <View style={{ height: SPACING.xl }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.m,
  },

  // ─── HERO ───
  hero: {
    marginBottom: SPACING.l,
    paddingTop: SPACING.s,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.l,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.s,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  liveBadgeText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  heroTitle: {
    fontSize: 38,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: -1,
    lineHeight: 42,
  },
  heroAccent: {
    color: COLORS.primary,
  },
  heroSubtitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 3,
    marginTop: SPACING.s,
  },
  heroDescription: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginTop: SPACING.m,
  },
  heroActions: {
    flexDirection: 'row',
    gap: SPACING.m,
    marginTop: SPACING.l,
  },
  primaryBtn: {
    flex: 1,
    borderRadius: RADIUS.m,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  primaryBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: SPACING.s,
  },
  primaryBtnText: {
    color: COLORS.background,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: RADIUS.m,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    gap: SPACING.s,
  },
  secondaryBtnText: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // ─── SYMMETRY SCORE ───
  scoreCard: {
    marginBottom: SPACING.l,
    borderRadius: RADIUS.l,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  scoreCardGradient: {
    padding: SPACING.m,
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.m,
  },
  scoreLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 1.5,
  },
  scoreTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  scoreTrendText: {
    color: COLORS.success,
    fontSize: 13,
    fontWeight: '700',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SPACING.xs,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: '900',
    color: COLORS.text,
    lineHeight: 48,
  },
  scoreUnit: {
    fontSize: 18,
    color: COLORS.textTertiary,
    fontWeight: '600',
    marginBottom: 6,
    marginRight: SPACING.m,
  },
  scoreBarContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  scoreBarBg: {
    height: 6,
    backgroundColor: COLORS.surface,
    borderRadius: 3,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  scoreBarLabel: {
    fontSize: 11,
    color: COLORS.textTertiary,
    marginTop: 4,
    textAlign: 'right',
  },

  // ─── SECTION HEADERS ───
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.m,
    gap: SPACING.m,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textTertiary,
    letterSpacing: 2,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },

  // ─── FEATURE GRID ───
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
    marginBottom: SPACING.l,
  },
  featureCard: {
    width: CARD_WIDTH,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.l,
    padding: SPACING.m,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 140,
    justifyContent: 'space-between',
  },
  featureIconContainer: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.m,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.m,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
    lineHeight: 20,
    marginBottom: SPACING.xs,
  },
  featureSubtitle: {
    fontSize: 12,
    color: COLORS.textTertiary,
    fontWeight: '500',
  },

  // ─── ALERT CARD ───
  alertCard: {
    borderRadius: RADIUS.l,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.2)',
    marginBottom: SPACING.l,
  },
  alertGradient: {
    padding: SPACING.m,
  },
  alertTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.m,
    marginBottom: SPACING.m,
  },
  alertIconWrap: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.m,
    backgroundColor: COLORS.accentGlow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  alertMeta: {
    fontSize: 12,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  severityBadge: {
    paddingHorizontal: SPACING.s,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.s,
    backgroundColor: COLORS.accentGlow,
  },
  severityText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.accent,
    letterSpacing: 1,
  },
  alertDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.m,
  },
  alertImpact: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.s,
    backgroundColor: 'rgba(255, 107, 53, 0.06)',
    padding: SPACING.m,
    borderRadius: RADIUS.m,
    marginBottom: SPACING.m,
  },
  alertImpactText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.accent,
    lineHeight: 18,
    fontWeight: '500',
  },
  alertFix: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 107, 53, 0.1)',
    paddingTop: SPACING.m,
  },
  alertFixLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textTertiary,
    letterSpacing: 1.5,
    marginBottom: SPACING.xs,
  },
  alertFixRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  alertFixName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
  },

  // ─── STATS ───
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.m,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.m,
    padding: SPACING.m,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textTertiary,
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 14,
  },
});

export default HomeScreen;
