import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import { GYM_HABITS, DAILY_HABITS, getRelatedDailyHabits } from '../data/mockData';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  CheckCircle,
  Zap,
  AlertTriangle,
  ChevronDown,
  Dumbbell,
  Sun,
} from 'lucide-react-native';

const LIFTS = ['Back Squat', 'Front Squat', 'Deadlift', 'Bench Press', 'OHP', 'Barbell Row', 'Lunge'];
const SEVERITY_OPTIONS = ['mild', 'moderate', 'severe'];
const CONTEXTS = ['At desk', 'Commuting', 'At home', 'Other'];

// ─── GYM SESSION FORM ─────────────────────────────────────────────────────────

const GymForm = ({ navigation, user }) => {
  const [selectedHabit, setSelectedHabit] = useState(null);
  const [selectedLift, setSelectedLift] = useState(null);
  const [sets, setSets] = useState('');
  const [notes, setNotes] = useState('');
  const [severity, setSeverity] = useState('moderate');
  const [showLifts, setShowLifts] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectedHabitData = GYM_HABITS.find(h => h.id === selectedHabit);

  const handleSave = async () => {
    if (!selectedHabit || !sets) {
      Alert.alert('Missing Info', 'Select an asymmetry and enter the number of sets affected.');
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('habit_logs').insert({
      user_id: user.id,
      date: new Date().toISOString().split('T')[0],
      habit_id: selectedHabit,
      habit_label: selectedHabitData.label,
      sets: parseInt(sets, 10),
      feeling: notes || null,
      exercise: selectedLift || null,
      severity,
      context: 'gym',
    });
    setSaving(false);

    if (error) { Alert.alert('Error', error.message); return; }

    Alert.alert(
      'Logged',
      `${selectedHabitData.label} detected during ${selectedLift || 'workout'} (${sets} sets). Keep auditing.`,
      [{ text: 'OK', onPress: () => {
        setSelectedHabit(null); setSelectedLift(null);
        setSets(''); setNotes(''); setSeverity('moderate');
        navigation.navigate('Home');
      }}]
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* HABIT SELECTION */}
      <View style={styles.section}>
        <Text style={styles.label}>DETECTED ISSUE</Text>
        <View style={styles.chipContainer}>
          {GYM_HABITS.map(habit => (
            <TouchableOpacity
              key={habit.id}
              style={[styles.chip, selectedHabit === habit.id && styles.chipSelected]}
              onPress={() => setSelectedHabit(habit.id)}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, selectedHabit === habit.id && styles.chipTextSelected]}>
                {habit.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* GYM IMPACT */}
      {selectedHabitData && (
        <View style={styles.impactCard}>
          <View style={styles.impactHeader}>
            <Zap color={COLORS.accent} size={16} />
            <Text style={styles.impactLabel}>GYM IMPACT</Text>
          </View>
          <Text style={styles.impactText}>{selectedHabitData.gymImpact}</Text>
          <View style={styles.impactFix}>
            <Text style={styles.impactFixLabel}>Suggested Fix:</Text>
            <Text style={styles.impactFixValue}>{selectedHabitData.suggestedFix}</Text>
          </View>
        </View>
      )}

      {/* LIFT SELECTOR */}
      <View style={styles.section}>
        <Text style={styles.label}>DURING WHICH LIFT?</Text>
        <TouchableOpacity style={styles.dropdown} onPress={() => setShowLifts(!showLifts)} activeOpacity={0.7}>
          <Text style={[styles.dropdownText, !selectedLift && styles.dropdownPlaceholder]}>
            {selectedLift || 'Select a lift...'}
          </Text>
          <ChevronDown color={COLORS.textTertiary} size={18} />
        </TouchableOpacity>
        {showLifts && (
          <View style={styles.dropdownList}>
            {LIFTS.map(lift => (
              <TouchableOpacity
                key={lift}
                style={[styles.dropdownItem, selectedLift === lift && styles.dropdownItemSelected]}
                onPress={() => { setSelectedLift(lift); setShowLifts(false); }}
              >
                <Text style={[styles.dropdownItemText, selectedLift === lift && styles.dropdownItemTextSelected]}>
                  {lift}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* SETS */}
      <View style={styles.section}>
        <Text style={styles.label}>SETS AFFECTED</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 3"
          placeholderTextColor={COLORS.textTertiary}
          keyboardType="numeric"
          value={sets}
          onChangeText={setSets}
        />
      </View>

      {/* SEVERITY */}
      <View style={styles.section}>
        <Text style={styles.label}>SEVERITY</Text>
        <View style={styles.chipContainer}>
          {SEVERITY_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt}
              style={[styles.chip, severity === opt && styles.severityChipSelected]}
              onPress={() => setSeverity(opt)}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, severity === opt && styles.severityChipTextSelected]}>
                {opt.charAt(0).toUpperCase() + opt.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* NOTES */}
      <View style={styles.section}>
        <Text style={styles.label}>NOTES (OPTIONAL)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="e.g. Right knee caving on heavy doubles..."
          placeholderTextColor={COLORS.textTertiary}
          multiline
          numberOfLines={4}
          value={notes}
          onChangeText={setNotes}
        />
      </View>

      <View style={styles.warningBox}>
        <AlertTriangle color={COLORS.accent} size={20} />
        <Text style={styles.warningText}>
          Consistent logging reveals patterns your body hides from you. Track every session.
        </Text>
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8} disabled={saving}>
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryDim]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.saveBtnGradient}
        >
          {saving ? <ActivityIndicator color={COLORS.background} /> : (
            <>
              <CheckCircle color={COLORS.background} size={20} />
              <Text style={styles.saveBtnText}>Save Log</Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </ScrollView>
  );
};

// ─── DAILY HABITS FORM ────────────────────────────────────────────────────────

const DailyForm = ({ navigation, user, preselectedHabitIds }) => {
  const [selectedHabits, setSelectedHabits] = useState(preselectedHabitIds ?? []);
  const [selectedContext, setSelectedContext] = useState(null);
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');
  const [showContexts, setShowContexts] = useState(false);
  const [saving, setSaving] = useState(false);

  // Update preselection if it changes (e.g. notification deep-link)
  useEffect(() => {
    if (preselectedHabitIds?.length) setSelectedHabits(preselectedHabitIds);
  }, [preselectedHabitIds]);

  const toggleHabit = (id) => {
    setSelectedHabits(prev =>
      prev.includes(id) ? prev.filter(h => h !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (selectedHabits.length === 0) {
      Alert.alert('Missing Info', 'Select at least one daily habit.');
      return;
    }

    setSaving(true);
    const rows = selectedHabits.map(habitId => {
      const habit = DAILY_HABITS.find(h => h.id === habitId);
      return {
        user_id: user.id,
        date: new Date().toISOString().split('T')[0],
        habit_id: habitId,
        habit_label: habit?.label ?? habitId,
        sets: null,
        feeling: notes || null,
        exercise: selectedContext || null,
        severity: 'mild',
        context: 'daily',
        duration_minutes: duration ? parseInt(duration, 10) : null,
      };
    });

    const { error } = await supabase.from('habit_logs').insert(rows);
    setSaving(false);

    if (error) { Alert.alert('Error', error.message); return; }

    Alert.alert(
      'Logged',
      `${selectedHabits.length} daily habit${selectedHabits.length > 1 ? 's' : ''} logged. Stay aware.`,
      [{ text: 'OK', onPress: () => {
        setSelectedHabits([]); setSelectedContext(null);
        setDuration(''); setNotes('');
        navigation.navigate('Home');
      }}]
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.infoCard}>
        <Sun color={COLORS.primary} size={16} />
        <Text style={styles.infoText}>
          These habits reinforce the asymmetries you've logged in your gym sessions.
          Tracking them helps identify root causes.
        </Text>
      </View>

      {/* HABIT CHIPS — multi-select */}
      <View style={styles.section}>
        <Text style={styles.label}>WHAT DID YOU DO TODAY?</Text>
        <View style={styles.chipContainer}>
          {DAILY_HABITS.map(habit => (
            <TouchableOpacity
              key={habit.id}
              style={[styles.chip, selectedHabits.includes(habit.id) && styles.chipSelected]}
              onPress={() => toggleHabit(habit.id)}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, selectedHabits.includes(habit.id) && styles.chipTextSelected]}>
                {habit.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* CONTEXT */}
      <View style={styles.section}>
        <Text style={styles.label}>WHERE WERE YOU?</Text>
        <TouchableOpacity style={styles.dropdown} onPress={() => setShowContexts(!showContexts)} activeOpacity={0.7}>
          <Text style={[styles.dropdownText, !selectedContext && styles.dropdownPlaceholder]}>
            {selectedContext || 'Select context...'}
          </Text>
          <ChevronDown color={COLORS.textTertiary} size={18} />
        </TouchableOpacity>
        {showContexts && (
          <View style={styles.dropdownList}>
            {CONTEXTS.map(ctx => (
              <TouchableOpacity
                key={ctx}
                style={[styles.dropdownItem, selectedContext === ctx && styles.dropdownItemSelected]}
                onPress={() => { setSelectedContext(ctx); setShowContexts(false); }}
              >
                <Text style={[styles.dropdownItemText, selectedContext === ctx && styles.dropdownItemTextSelected]}>
                  {ctx}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* DURATION */}
      <View style={styles.section}>
        <Text style={styles.label}>DURATION (MINUTES, OPTIONAL)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 90"
          placeholderTextColor={COLORS.textTertiary}
          keyboardType="numeric"
          value={duration}
          onChangeText={setDuration}
        />
      </View>

      {/* NOTES */}
      <View style={styles.section}>
        <Text style={styles.label}>NOTES (OPTIONAL)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="e.g. Noticed hip tension after long drive..."
          placeholderTextColor={COLORS.textTertiary}
          multiline
          numberOfLines={4}
          value={notes}
          onChangeText={setNotes}
        />
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8} disabled={saving}>
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryDim]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.saveBtnGradient}
        >
          {saving ? <ActivityIndicator color={COLORS.background} /> : (
            <>
              <CheckCircle color={COLORS.background} size={20} />
              <Text style={styles.saveBtnText}>Save Daily Log</Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </ScrollView>
  );
};

// ─── LOG SCREEN (PARENT) ──────────────────────────────────────────────────────

const LogScreen = ({ navigation, route }) => {
  const { user } = useAuth();

  // Support deep-link: ?tab=daily&habits=ankle_cave,hip_shift
  const initialTab = route?.params?.tab === 'daily' ? 'daily' : 'gym';
  const rawHabits = route?.params?.habits;
  const preselectedGymHabitIds = rawHabits ? rawHabits.split(',') : [];

  // Map gym habit IDs → related daily habit IDs
  const preselectedDailyHabitIds = preselectedGymHabitIds.flatMap(gymId =>
    getRelatedDailyHabits(gymId).map(d => d.id)
  );

  const [activeTab, setActiveTab] = useState(initialTab);

  // Update tab if route params change (notification tap while app is open)
  useEffect(() => {
    if (route?.params?.tab === 'daily') setActiveTab('daily');
  }, [route?.params?.tab]);

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>

          {/* HEADER */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>LOG</Text>
            <Text style={styles.subtitle}>Track what your body tells you</Text>

            {/* PILL SWITCHER */}
            <View style={styles.pillSwitcher}>
              <TouchableOpacity
                style={[styles.pill, activeTab === 'gym' && styles.pillActive]}
                onPress={() => setActiveTab('gym')}
                activeOpacity={0.7}
              >
                <Dumbbell color={activeTab === 'gym' ? COLORS.background : COLORS.textTertiary} size={14} />
                <Text style={[styles.pillText, activeTab === 'gym' && styles.pillTextActive]}>
                  GYM SESSION
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.pill, activeTab === 'daily' && styles.pillActive]}
                onPress={() => setActiveTab('daily')}
                activeOpacity={0.7}
              >
                <Sun color={activeTab === 'daily' ? COLORS.background : COLORS.textTertiary} size={14} />
                <Text style={[styles.pillText, activeTab === 'daily' && styles.pillTextActive]}>
                  DAILY HABITS
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {activeTab === 'gym' ? (
            <GymForm navigation={navigation} user={user} />
          ) : (
            <DailyForm
              navigation={navigation}
              user={user}
              preselectedHabitIds={preselectedDailyHabitIds}
            />
          )}

        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  header: {
    paddingHorizontal: SPACING.m,
    paddingTop: SPACING.m,
    paddingBottom: SPACING.s,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: -0.5,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.m,
  },

  // ─── PILL SWITCHER ───
  pillSwitcher: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.full,
    padding: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: 10,
    borderRadius: RADIUS.full,
  },
  pillActive: {
    backgroundColor: COLORS.primary,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textTertiary,
    letterSpacing: 1,
  },
  pillTextActive: {
    color: COLORS.background,
  },

  scrollContent: { padding: SPACING.m, paddingTop: SPACING.s },

  // ─── INFO CARD ───
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.s,
    backgroundColor: COLORS.primaryGlow,
    borderRadius: RADIUS.m,
    padding: SPACING.m,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 204, 0.15)',
    marginBottom: SPACING.l,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.primary,
    lineHeight: 18,
    fontWeight: '500',
  },

  section: { marginBottom: SPACING.l },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textTertiary,
    letterSpacing: 1.5,
    marginBottom: SPACING.s,
  },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.s },
  chip: {
    paddingHorizontal: SPACING.m,
    paddingVertical: 10,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipSelected: { backgroundColor: COLORS.primaryGlow, borderColor: COLORS.primary },
  chipText: { color: COLORS.textSecondary, fontWeight: '600', fontSize: 13 },
  chipTextSelected: { color: COLORS.primary },
  severityChipSelected: { backgroundColor: COLORS.accentGlow, borderColor: COLORS.accent },
  severityChipTextSelected: { color: COLORS.accent },

  impactCard: {
    backgroundColor: COLORS.accentGlow,
    borderRadius: RADIUS.m,
    padding: SPACING.m,
    marginBottom: SPACING.l,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.15)',
  },
  impactHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.s, marginBottom: SPACING.s },
  impactLabel: { fontSize: 11, fontWeight: '700', color: COLORS.accent, letterSpacing: 1.5 },
  impactText: { fontSize: 14, color: COLORS.text, lineHeight: 20, marginBottom: SPACING.m },
  impactFix: {
    flexDirection: 'row', gap: SPACING.xs,
    borderTopWidth: 1, borderTopColor: 'rgba(255, 107, 53, 0.1)', paddingTop: SPACING.s,
  },
  impactFixLabel: { fontSize: 12, color: COLORS.textTertiary, fontWeight: '500' },
  impactFixValue: { fontSize: 12, color: COLORS.primary, fontWeight: '700' },

  dropdown: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: COLORS.surface, padding: SPACING.m,
    borderRadius: RADIUS.m, borderWidth: 1, borderColor: COLORS.border,
  },
  dropdownText: { fontSize: 15, color: COLORS.text, fontWeight: '500' },
  dropdownPlaceholder: { color: COLORS.textTertiary },
  dropdownList: {
    backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.m,
    marginTop: SPACING.s, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden',
  },
  dropdownItem: { padding: SPACING.m, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  dropdownItemSelected: { backgroundColor: COLORS.primaryGlow },
  dropdownItemText: { fontSize: 15, color: COLORS.textSecondary, fontWeight: '500' },
  dropdownItemTextSelected: { color: COLORS.primary, fontWeight: '700' },

  input: {
    backgroundColor: COLORS.surface, padding: SPACING.m, borderRadius: RADIUS.m,
    fontSize: 15, color: COLORS.text, borderWidth: 1, borderColor: COLORS.border,
  },
  textArea: { height: 100, textAlignVertical: 'top' },

  warningBox: {
    flexDirection: 'row', backgroundColor: COLORS.accentGlow, padding: SPACING.m,
    borderRadius: RADIUS.m, alignItems: 'flex-start', gap: SPACING.m, marginBottom: SPACING.l,
    borderWidth: 1, borderColor: 'rgba(255, 107, 53, 0.12)',
  },
  warningText: { color: COLORS.accent, flex: 1, lineHeight: 20, fontSize: 13, fontWeight: '500' },

  saveBtn: { borderRadius: RADIUS.m, overflow: 'hidden', marginBottom: SPACING.xl },
  saveBtnGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, gap: SPACING.s,
  },
  saveBtnText: { color: COLORS.background, fontWeight: '800', fontSize: 16, letterSpacing: 0.5 },
});

export default LogScreen;
