import * as Notifications from 'expo-notifications';
import { supabase } from './supabase';
import { GYM_HABITS, getRelatedDailyHabits } from '../data/mockData';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermission() {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  if (existing === 'denied') return false;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// Returns the 3 most recently logged distinct gym habit_ids for the user
async function getRecentGymHabits(userId) {
  const { data } = await supabase
    .from('habit_logs')
    .select('habit_id, habit_label')
    .eq('user_id', userId)
    .eq('context', 'gym')
    .order('created_at', { ascending: false })
    .limit(20);

  if (!data) return [];

  const seen = new Set();
  const unique = [];
  for (const row of data) {
    if (!seen.has(row.habit_id)) {
      seen.add(row.habit_id);
      unique.push(row);
      if (unique.length === 3) break;
    }
  }
  return unique;
}

// Returns true if the user has logged a workout session today
async function hasGymSessionToday(userId) {
  const today = new Date().toISOString().split('T')[0];
  const { count } = await supabase
    .from('workout_sessions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('completed_at', `${today}T00:00:00`)
    .lte('completed_at', `${today}T23:59:59`);
  return (count ?? 0) > 0;
}

function buildNotificationContent(recentHabits) {
  if (recentHabits.length === 0) return null;

  const primary = recentHabits[0];
  const related = getRelatedDailyHabits(primary.habit_id);
  const examples = related
    .slice(0, 2)
    .map(h => h.label.toLowerCase())
    .join(', ');

  const habitIds = recentHabits.map(h => h.habit_id).join(',');

  return {
    title: 'Posture Check',
    body: examples
      ? `You've been logging ${primary.habit_label} — watch for: ${examples}`
      : `You've been logging ${primary.habit_label} — check your posture today`,
    data: { tab: 'daily', habits: habitIds },
  };
}

export async function scheduleDailyNotifications(userId) {
  await Notifications.cancelAllScheduledNotificationsAsync();

  const gymToday = await hasGymSessionToday(userId);
  if (gymToday) return; // gym day — skip reminders

  const recentHabits = await getRecentGymHabits(userId);
  const content = buildNotificationContent(recentHabits);
  if (!content) return;

  const now = new Date();

  // Morning notification — 10:00am today (skip if past)
  const morning = new Date(now);
  morning.setHours(10, 0, 0, 0);
  if (morning > now) {
    await Notifications.scheduleNotificationAsync({
      content,
      trigger: { type: 'date', date: morning },
    });
  }

  // Afternoon notification — 3:00pm today (skip if past)
  const afternoon = new Date(now);
  afternoon.setHours(15, 0, 0, 0);
  if (afternoon > now) {
    await Notifications.scheduleNotificationAsync({
      content,
      trigger: { type: 'date', date: afternoon },
    });
  }
}
