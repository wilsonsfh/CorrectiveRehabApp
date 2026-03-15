import React, { useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import { GYM_HABITS } from '../data/mockData';
import {
  CheckCircle,
  Zap,
  AlertTriangle,
  ChevronDown,
} from 'lucide-react-native';

const LIFTS = ['Back Squat', 'Front Squat', 'Deadlift', 'Bench Press', 'OHP', 'Barbell Row', 'Lunge'];

const LogScreen = ({ navigation }) => {
  const [selectedHabit, setSelectedHabit] = useState(null);
  const [selectedLift, setSelectedLift] = useState(null);
  const [sets, setSets] = useState('');
  const [notes, setNotes] = useState('');
  const [showLifts, setShowLifts] = useState(false);

  const selectedHabitData = GYM_HABITS.find((h) => h.id === selectedHabit);

  const handleSave = () => {
    if (!selectedHabit || !sets) {
      Alert.alert('Missing Info', 'Select an asymmetry and enter the number of sets affected.');
      return;
    }

    Alert.alert(
      'Logged',
      `${selectedHabitData.label} detected during ${selectedLift || 'workout'} (${sets} sets). Keep auditing.`,
      [
        {
          text: 'OK',
          onPress: () => {
            setSelectedHabit(null);
            setSelectedLift(null);
            setSets('');
            setNotes('');
            navigation.navigate('Home');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.headerTitle}>LOG ASYMMETRY</Text>
            <Text style={styles.subtitle}>
              What did you notice during your session?
            </Text>

            {/* ─── HABIT SELECTION ─── */}
            <View style={styles.section}>
              <Text style={styles.label}>DETECTED ISSUE</Text>
              <View style={styles.chipContainer}>
                {GYM_HABITS.map((habit) => (
                  <TouchableOpacity
                    key={habit.id}
                    style={[
                      styles.chip,
                      selectedHabit === habit.id && styles.chipSelected,
                    ]}
                    onPress={() => setSelectedHabit(habit.id)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        selectedHabit === habit.id && styles.chipTextSelected,
                      ]}
                    >
                      {habit.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* ─── GYM IMPACT (contextual) ─── */}
            {selectedHabitData && (
              <View style={styles.impactCard}>
                <View style={styles.impactHeader}>
                  <Zap color={COLORS.accent} size={16} />
                  <Text style={styles.impactLabel}>GYM IMPACT</Text>
                </View>
                <Text style={styles.impactText}>
                  {selectedHabitData.gymImpact}
                </Text>
                <View style={styles.impactFix}>
                  <Text style={styles.impactFixLabel}>Suggested Fix:</Text>
                  <Text style={styles.impactFixValue}>
                    {selectedHabitData.suggestedFix}
                  </Text>
                </View>
              </View>
            )}

            {/* ─── LIFT SELECTOR ─── */}
            <View style={styles.section}>
              <Text style={styles.label}>DURING WHICH LIFT?</Text>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => setShowLifts(!showLifts)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.dropdownText,
                    !selectedLift && styles.dropdownPlaceholder,
                  ]}
                >
                  {selectedLift || 'Select a lift...'}
                </Text>
                <ChevronDown color={COLORS.textTertiary} size={18} />
              </TouchableOpacity>

              {showLifts && (
                <View style={styles.dropdownList}>
                  {LIFTS.map((lift) => (
                    <TouchableOpacity
                      key={lift}
                      style={[
                        styles.dropdownItem,
                        selectedLift === lift && styles.dropdownItemSelected,
                      ]}
                      onPress={() => {
                        setSelectedLift(lift);
                        setShowLifts(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownItemText,
                          selectedLift === lift &&
                            styles.dropdownItemTextSelected,
                        ]}
                      >
                        {lift}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* ─── SETS ─── */}
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

            {/* ─── NOTES ─── */}
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

            {/* ─── WARNING ─── */}
            <View style={styles.warningBox}>
              <AlertTriangle color={COLORS.accent} size={20} />
              <Text style={styles.warningText}>
                Consistent logging reveals patterns your body hides from you.
                Track every session.
              </Text>
            </View>

            {/* ─── SAVE ─── */}
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSave}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[COLORS.primary, COLORS.primaryDim]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.saveBtnGradient}
              >
                <CheckCircle color={COLORS.background} size={20} />
                <Text style={styles.saveBtnText}>Save Log</Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.m,
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
    marginBottom: SPACING.xl,
  },
  section: {
    marginBottom: SPACING.l,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textTertiary,
    letterSpacing: 1.5,
    marginBottom: SPACING.s,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.s,
  },
  chip: {
    paddingHorizontal: SPACING.m,
    paddingVertical: 10,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipSelected: {
    backgroundColor: COLORS.primaryGlow,
    borderColor: COLORS.primary,
  },
  chipText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
    fontSize: 13,
  },
  chipTextSelected: {
    color: COLORS.primary,
  },

  // ─── IMPACT CARD ───
  impactCard: {
    backgroundColor: COLORS.accentGlow,
    borderRadius: RADIUS.m,
    padding: SPACING.m,
    marginBottom: SPACING.l,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.15)',
  },
  impactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
    marginBottom: SPACING.s,
  },
  impactLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.accent,
    letterSpacing: 1.5,
  },
  impactText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
    marginBottom: SPACING.m,
  },
  impactFix: {
    flexDirection: 'row',
    gap: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 107, 53, 0.1)',
    paddingTop: SPACING.s,
  },
  impactFixLabel: {
    fontSize: 12,
    color: COLORS.textTertiary,
    fontWeight: '500',
  },
  impactFixValue: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '700',
  },

  // ─── DROPDOWN ───
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.m,
    borderRadius: RADIUS.m,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dropdownText: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '500',
  },
  dropdownPlaceholder: {
    color: COLORS.textTertiary,
  },
  dropdownList: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: RADIUS.m,
    marginTop: SPACING.s,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  dropdownItem: {
    padding: SPACING.m,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  dropdownItemSelected: {
    backgroundColor: COLORS.primaryGlow,
  },
  dropdownItemText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  dropdownItemTextSelected: {
    color: COLORS.primary,
    fontWeight: '700',
  },

  // ─── INPUTS ───
  input: {
    backgroundColor: COLORS.surface,
    padding: SPACING.m,
    borderRadius: RADIUS.m,
    fontSize: 15,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },

  // ─── WARNING ───
  warningBox: {
    flexDirection: 'row',
    backgroundColor: COLORS.accentGlow,
    padding: SPACING.m,
    borderRadius: RADIUS.m,
    alignItems: 'flex-start',
    gap: SPACING.m,
    marginBottom: SPACING.l,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.12)',
  },
  warningText: {
    color: COLORS.accent,
    flex: 1,
    lineHeight: 20,
    fontSize: 13,
    fontWeight: '500',
  },

  // ─── SAVE ───
  saveBtn: {
    borderRadius: RADIUS.m,
    overflow: 'hidden',
    marginBottom: SPACING.xl,
  },
  saveBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: SPACING.s,
  },
  saveBtnText: {
    color: COLORS.background,
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 0.5,
  },
});

export default LogScreen;
