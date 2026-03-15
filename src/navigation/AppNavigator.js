import React from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Home, Library, Activity, User } from 'lucide-react-native';
import HomeScreen from '../screens/HomeScreen';
import LibraryScreen from '../screens/LibraryScreen';
import ExerciseDetailScreen from '../screens/ExerciseDetailScreen';
import LogScreen from '../screens/LogScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SessionSetupScreen from '../screens/SessionSetupScreen';
import RecordVideoScreen from '../screens/RecordVideoScreen';
import VideoPreviewScreen from '../screens/VideoPreviewScreen';
import LinkSessionScreen from '../screens/LinkSessionScreen';
import { COLORS } from '../constants/theme';
import { linking } from '../lib/linking';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const RootStack = createNativeStackNavigator();

const LibraryStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="LibraryList" component={LibraryScreen} />
    <Stack.Screen name="ExerciseDetail" component={ExerciseDetailScreen} />
  </Stack.Navigator>
);

const DARK_THEME = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: COLORS.primary,
    background: COLORS.background,
    card: COLORS.surface,
    text: COLORS.text,
    border: COLORS.border,
    notification: COLORS.accent,
  },
};

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textTertiary,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          height: 64,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarIcon: ({ color, size }) => <Home color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Library"
        component={LibraryStack}
        options={{ tabBarIcon: ({ color, size }) => <Library color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Log"
        component={LogScreen}
        options={{ tabBarIcon: ({ color, size }) => <Activity color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarIcon: ({ color, size }) => <User color={color} size={size} /> }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator({ navigationRef }) {
  return (
    <NavigationContainer ref={navigationRef} theme={DARK_THEME} linking={linking}>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {/* Main tabs */}
        <RootStack.Screen name="Tabs" component={TabNavigator} />
        {/* Record modal stack — slides up over tabs */}
        <RootStack.Screen
          name="SessionSetup"
          component={SessionSetupScreen}
          options={{ presentation: 'modal' }}
        />
        <RootStack.Screen
          name="RecordVideo"
          component={RecordVideoScreen}
          options={{ presentation: 'fullScreenModal', animation: 'fade' }}
        />
        <RootStack.Screen
          name="VideoPreview"
          component={VideoPreviewScreen}
          options={{ presentation: 'fullScreenModal', animation: 'fade' }}
        />
        <RootStack.Screen
          name="LinkSession"
          component={LinkSessionScreen}
          options={{ presentation: 'modal' }}
        />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
