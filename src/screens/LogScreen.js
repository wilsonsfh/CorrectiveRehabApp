import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING } from '../constants/theme';
import { CheckCircle, AlertTriangle } from 'lucide-react-native';

const HABITS = ['Crossed Legs', 'Slouching', 'Neck Strain', 'Leaning on One Leg'];

const LogScreen = ({ navigation }) => {
  const [selectedHabit, setSelectedHabit] = useState(null);
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');

  const handleSave = () => {
    if (!selectedHabit || !duration) {
      Alert.alert('Missing Info', 'Please select a habit and enter duration.');
      return;
    }
    
    // In a real app, this would save to Supabase
    Alert.alert('Saved', `Logged ${duration} mins of ${selectedHabit}. Keep improving!`, [
      { text: 'OK', onPress: () => {
        setSelectedHabit(null);
        setDuration('');
        setNotes('');
        navigation.navigate('Home');
      }}
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.headerTitle}>Log Bad Habit</Text>
          <Text style={styles.subtitle}>Tracking is the first step to correction.</Text>

          <View style={styles.section}>
            <Text style={styles.label}>What did you notice?</Text>
            <View style={styles.chipContainer}>
              {HABITS.map((habit) => (
                <TouchableOpacity
                  key={habit}
                  style={[
                    styles.chip,
                    selectedHabit === habit && styles.chipSelected
                  ]}
                  onPress={() => setSelectedHabit(habit)}
                >
                  <Text style={[
                    styles.chipText,
                    selectedHabit === habit && styles.chipTextSelected
                  ]}>{habit}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Duration (minutes)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 30"
              keyboardType="numeric"
              value={duration}
              onChangeText={setDuration}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>How do you feel? (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="e.g. Lower back feels tight..."
              multiline
              numberOfLines={4}
              value={notes}
              onChangeText={setNotes}
            />
          </View>

          <View style={styles.warningBox}>
            <AlertTriangle color={COLORS.danger} size={24} />
            <Text style={styles.warningText}>
              Consistent tracking helps identifying triggers.
            </Text>
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <CheckCircle color={COLORS.white} size={24} />
            <Text style={styles.saveBtnText}>Save Log</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.gray,
    marginBottom: SPACING.xl,
  },
  section: {
    marginBottom: SPACING.l,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.s,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.s,
  },
  chip: {
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.s,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  chipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    color: COLORS.text,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: COLORS.white,
  },
  input: {
    backgroundColor: COLORS.white,
    padding: SPACING.m,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#FFF4E5', // Light orange
    padding: SPACING.m,
    borderRadius: 12,
    alignItems: 'center',
    gap: SPACING.m,
    marginBottom: SPACING.xl,
  },
  warningText: {
    color: '#B76E00', // Darker orange
    flex: 1,
    lineHeight: 20,
  },
  saveBtn: {
    backgroundColor: COLORS.secondary,
    padding: SPACING.m,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.s,
  },
  saveBtnText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 18,
  },
});

export default LogScreen;
