import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING } from '../constants/theme';
import { EXERCISES, HABIT_LOGS } from '../data/mockData';
import { PlayCircle, AlertCircle } from 'lucide-react-native';

const HomeScreen = ({ navigation }) => {
  const featuredExercise = EXERCISES[0];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Good Morning,</Text>
          <Text style={styles.title}>Ready to align?</Text>
        </View>

        {/* Featured Card */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daily Correction</Text>
          <TouchableOpacity 
            style={styles.featuredCard}
            onPress={() => navigation.navigate('Library')} // Simple nav for now
          >
            <Image source={{ uri: featuredExercise.thumbnail }} style={styles.cardImage} />
            <View style={styles.cardOverlay}>
              <View style={styles.tag}>
                <Text style={styles.tagText}>RECOMMENDED</Text>
              </View>
              <Text style={styles.cardTitle}>{featuredExercise.title}</Text>
              <Text style={styles.cardSubtitle}>{featuredExercise.duration} • {featuredExercise.difficulty}</Text>
            </View>
            <View style={styles.playIcon}>
              <PlayCircle color={COLORS.white} size={32} fill="rgba(0,0,0,0.5)" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Recent Habits Warning */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Insights</Text>
          <View style={styles.insightCard}>
            <AlertCircle color={COLORS.danger} size={24} />
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>Watch your posture!</Text>
              <Text style={styles.insightText}>
                You logged "{HABIT_LOGS[0].habit}" yesterday. Try the Hip Flexor Stretch today.
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: COLORS.secondary }]}>
            <Text style={styles.actionBtnText}>Log Habit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: COLORS.primary }]}>
            <Text style={styles.actionBtnText}>Start Workout</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
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
  header: {
    marginBottom: SPACING.l,
  },
  greeting: {
    fontSize: 16,
    color: COLORS.gray,
    marginBottom: SPACING.xs,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  section: {
    marginBottom: SPACING.l,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.m,
  },
  featuredCard: {
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: COLORS.white,
    elevation: 4, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.m,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  cardTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: 'bold',
  },
  cardSubtitle: {
    color: COLORS.lightGray,
    fontSize: 14,
    marginTop: SPACING.xs,
  },
  tag: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: SPACING.s,
    paddingVertical: SPACING.xs,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: SPACING.s,
  },
  tagText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  playIcon: {
    position: 'absolute',
    top: SPACING.m,
    right: SPACING.m,
  },
  insightCard: {
    flexDirection: 'row',
    backgroundColor: '#FFE5E0', // Light red bg
    padding: SPACING.m,
    borderRadius: 12,
    alignItems: 'center',
  },
  insightContent: {
    marginLeft: SPACING.m,
    flex: 1,
  },
  insightTitle: {
    color: COLORS.danger,
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  insightText: {
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 20,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.m,
  },
  actionBtn: {
    flex: 1,
    padding: SPACING.m,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default HomeScreen;
