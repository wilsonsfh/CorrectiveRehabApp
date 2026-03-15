import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import { User, Lock } from 'lucide-react-native';

const PlaceholderScreen = ({ name }) => (
  <View style={styles.container}>
    <View style={styles.iconWrap}>
      <LinearGradient
        colors={[COLORS.primaryGlow, 'transparent']}
        style={styles.iconGradient}
      >
        <View style={styles.iconCircle}>
          {name === 'Profile' ? (
            <User color={COLORS.primary} size={32} />
          ) : (
            <Lock color={COLORS.primary} size={32} />
          )}
        </View>
      </LinearGradient>
    </View>

    <Text style={styles.title}>{name}</Text>
    <Text style={styles.subtitle}>Coming in Phase 1</Text>

    <View style={styles.featureList}>
      {name === 'Profile' && (
        <>
          <FeatureItem label="Supabase Auth" />
          <FeatureItem label="Workout History" />
          <FeatureItem label="Symmetry Score Timeline" />
          <FeatureItem label="Video Library" />
        </>
      )}
    </View>
  </View>
);

const FeatureItem = ({ label }) => (
  <View style={styles.featureItem}>
    <View style={styles.featureDot} />
    <Text style={styles.featureText}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  iconWrap: {
    marginBottom: SPACING.l,
  },
  iconGradient: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: SPACING.xs,
    color: COLORS.textTertiary,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: SPACING.xl,
  },
  featureList: {
    alignSelf: 'stretch',
    gap: SPACING.m,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.m,
    backgroundColor: COLORS.surface,
    padding: SPACING.m,
    borderRadius: RADIUS.m,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  featureDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  featureText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
});

export default PlaceholderScreen;
