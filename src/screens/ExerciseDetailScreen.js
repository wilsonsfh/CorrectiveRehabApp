import React from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, TouchableOpacity } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { COLORS, SPACING } from '../constants/theme';
import { ChevronLeft, Clock, BarChart } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ExerciseDetailScreen = ({ route, navigation }) => {
  const { exercise } = route.params;
  
  const player = useVideoPlayer(exercise.videoUrl, player => {
    player.loop = true;
  });

  return (
    <View style={styles.container}>
      {/* Video Player */}
      <View style={styles.videoContainer}>
        <VideoView
          player={player}
          style={styles.video}
          contentFit="contain"
          nativeControls={true}
          allowsFullscreen
          allowsPictureInPicture
        />
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ChevronLeft color={COLORS.white} size={32} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.title}>{exercise.title}</Text>
        
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Clock color={COLORS.gray} size={16} />
            <Text style={styles.metaText}>{exercise.duration}</Text>
          </View>
          <View style={styles.metaItem}>
            <BarChart color={COLORS.gray} size={16} />
            <Text style={styles.metaText}>{exercise.difficulty}</Text>
          </View>
        </View>

        <View style={styles.tagContainer}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{exercise.category.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Instructions</Text>
          <Text style={styles.description}>{exercise.description}</Text>
        </View>

        <TouchableOpacity style={styles.completeBtn}>
          <Text style={styles.completeBtnText}>Mark as Complete</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  videoContainer: {
    width: '100%',
    height: 250,
    backgroundColor: 'black',
  },
  video: {
    alignSelf: 'center',
    width: '100%',
    height: '100%',
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    padding: 4,
  },
  content: {
    flex: 1,
    padding: SPACING.m,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.s,
  },
  metaRow: {
    flexDirection: 'row',
    marginBottom: SPACING.m,
    gap: SPACING.l,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  metaText: {
    color: COLORS.gray,
    fontSize: 14,
  },
  tagContainer: {
    flexDirection: 'row',
    marginBottom: SPACING.l,
  },
  tag: {
    backgroundColor: COLORS.lightGray,
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.s,
    borderRadius: 8,
  },
  tagText: {
    color: COLORS.secondary,
    fontWeight: '600',
    fontSize: 12,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.s,
  },
  description: {
    fontSize: 16,
    color: COLORS.text,
    lineHeight: 24,
  },
  completeBtn: {
    backgroundColor: COLORS.primary,
    padding: SPACING.m,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: SPACING.l,
  },
  completeBtnText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default ExerciseDetailScreen;
