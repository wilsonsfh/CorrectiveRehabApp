import React from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING } from '../constants/theme';
import { EXERCISES } from '../data/mockData';

const LibraryScreen = ({ navigation }) => {
  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => navigation.navigate('ExerciseDetail', { exercise: item })}
    >
      <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
      <View style={styles.cardContent}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.subtitle}>{item.category} • {item.duration}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.headerTitle}>Corrective Library</Text>
      <FlatList
        data={EXERCISES}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    margin: SPACING.m,
  },
  list: {
    padding: SPACING.m,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginBottom: SPACING.m,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  thumbnail: {
    width: 100,
    height: 100,
    backgroundColor: COLORS.lightGray,
  },
  cardContent: {
    flex: 1,
    padding: SPACING.m,
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.gray,
  },
});

export default LibraryScreen;
