import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { EXERCISES } from '../data/mockData';
import { Clock, BarChart, ChevronRight, Crosshair } from 'lucide-react-native';

const DIFFICULTY_COLORS = {
  Beginner: COLORS.success,
  Intermediate: COLORS.accent,
  Advanced: COLORS.danger,
};

const LibraryScreen = ({ navigation }) => {
  const renderItem = ({ item, index }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('ExerciseDetail', { exerciseId: item.id })}
      activeOpacity={0.7}
    >
      <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.7)']}
        style={styles.thumbnailOverlay}
      />

      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <View style={styles.targetBadge}>
            <Crosshair color={COLORS.accent} size={12} />
            <Text style={styles.targetText}>
              {item.targetIssue?.toUpperCase()}
            </Text>
          </View>
          <View
            style={[
              styles.diffBadge,
              {
                backgroundColor:
                  (DIFFICULTY_COLORS[item.difficulty] || COLORS.primary) + '20',
              },
            ]}
          >
            <Text
              style={[
                styles.diffText,
                {
                  color:
                    DIFFICULTY_COLORS[item.difficulty] || COLORS.primary,
                },
              ]}
            >
              {item.difficulty}
            </Text>
          </View>
        </View>

        <Text style={styles.title} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.category}>{item.category}</Text>

        <View style={styles.cardFooter}>
          <View style={styles.metaItem}>
            <Clock color={COLORS.textTertiary} size={13} />
            <Text style={styles.metaText}>{item.duration}</Text>
          </View>
          <ChevronRight color={COLORS.textTertiary} size={16} />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>FORM LIBRARY</Text>
          <Text style={styles.headerSubtitle}>
            Corrective drills mapped to your asymmetries
          </Text>
        </View>

        <FlatList
          data={EXERCISES}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: SPACING.m,
    paddingTop: SPACING.s,
    paddingBottom: SPACING.m,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  list: {
    padding: SPACING.m,
    paddingTop: 0,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.l,
    marginBottom: SPACING.m,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  thumbnail: {
    width: '100%',
    height: 140,
    backgroundColor: COLORS.surfaceLight,
  },
  thumbnailOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 140,
  },
  cardBody: {
    padding: SPACING.m,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.s,
  },
  targetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.accentGlow,
    paddingHorizontal: SPACING.s,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.s,
  },
  targetText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.accent,
    letterSpacing: 1,
  },
  diffBadge: {
    paddingHorizontal: SPACING.s,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.s,
  },
  diffText: {
    fontSize: 11,
    fontWeight: '700',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 2,
  },
  category: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: SPACING.m,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.m,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  metaText: {
    color: COLORS.textTertiary,
    fontSize: 13,
    fontWeight: '500',
  },
});

export default LibraryScreen;
