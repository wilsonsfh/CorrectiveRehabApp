import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/theme';

const PlaceholderScreen = ({ name }) => (
  <View style={styles.container}>
    <Text style={styles.text}>{name} Screen</Text>
    <Text style={styles.subtext}>Coming soon...</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  subtext: {
    marginTop: 8,
    color: COLORS.gray,
  },
});

export default PlaceholderScreen;
