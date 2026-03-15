import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { User, LogOut, Activity, CheckCircle, Calendar } from 'lucide-react-native';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [stats, setStats] = useState({ logs: 0, sessions: 0 });
  const [loadingStats, setLoadingStats] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchStats();
    }, [])
  );

  async function fetchStats() {
    setLoadingStats(true);
    const [logsRes, sessionsRes] = await Promise.all([
      supabase
        .from('habit_logs')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id),
      supabase
        .from('workout_sessions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id),
    ]);
    setStats({
      logs: logsRes.count ?? 0,
      sessions: sessionsRes.count ?? 0,
    });
    setLoadingStats(false);
  }

  async function handleSignOut() {
    setLoggingOut(true);
    const { error } = await signOut();
    if (error) {
      Alert.alert('Error', error.message);
      setLoggingOut(false);
    }
  }

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    : '';

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.content}>
          <Text style={styles.headerTitle}>PROFILE</Text>

          {/* User Card */}
          <View style={styles.userCard}>
            <View style={styles.avatarWrap}>
              <User color={COLORS.primary} size={28} />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userEmail}>{user?.email}</Text>
              {memberSince ? (
                <View style={styles.memberRow}>
                  <Calendar color={COLORS.textTertiary} size={12} />
                  <Text style={styles.memberText}>
                    Member since {memberSince}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              {loadingStats ? (
                <ActivityIndicator color={COLORS.primary} size="small" />
              ) : (
                <Text style={styles.statValue}>{stats.logs}</Text>
              )}
              <View style={styles.statLabelRow}>
                <Activity color={COLORS.accent} size={14} />
                <Text style={styles.statLabel}>Habits Logged</Text>
              </View>
            </View>
            <View style={styles.statCard}>
              {loadingStats ? (
                <ActivityIndicator color={COLORS.primary} size="small" />
              ) : (
                <Text style={[styles.statValue, { color: COLORS.success }]}>
                  {stats.sessions}
                </Text>
              )}
              <View style={styles.statLabelRow}>
                <CheckCircle color={COLORS.success} size={14} />
                <Text style={styles.statLabel}>Exercises Done</Text>
              </View>
            </View>
          </View>

          {/* Logout */}
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={handleSignOut}
            activeOpacity={0.7}
            disabled={loggingOut}
          >
            {loggingOut ? (
              <ActivityIndicator color={COLORS.danger} size="small" />
            ) : (
              <>
                <LogOut color={COLORS.danger} size={18} />
                <Text style={styles.logoutText}>Log Out</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: SPACING.m,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: -0.5,
    marginBottom: SPACING.l,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.l,
    padding: SPACING.m,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.l,
    gap: SPACING.m,
  },
  avatarWrap: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userEmail: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  memberText: {
    fontSize: 12,
    color: COLORS.textTertiary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.m,
    marginBottom: SPACING.l,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.m,
    padding: SPACING.m,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.s,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.primary,
  },
  statLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textTertiary,
    fontWeight: '500',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.s,
    paddingVertical: 16,
    borderRadius: RADIUS.m,
    borderWidth: 1,
    borderColor: COLORS.danger,
    backgroundColor: COLORS.dangerGlow,
  },
  logoutText: {
    color: COLORS.danger,
    fontWeight: '700',
    fontSize: 16,
  },
});
