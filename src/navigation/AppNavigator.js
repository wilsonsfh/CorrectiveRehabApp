import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Home, Library, Activity, User } from 'lucide-react-native';
import HomeScreen from '../screens/HomeScreen';
import LibraryScreen from '../screens/LibraryScreen';
import ExerciseDetailScreen from '../screens/ExerciseDetailScreen';
import LogScreen from '../screens/LogScreen';
import PlaceholderScreen from '../screens/PlaceholderScreen';
import { COLORS } from '../constants/theme';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const LibraryStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="LibraryList" component={LibraryScreen} />
    <Stack.Screen name="ExerciseDetail" component={ExerciseDetailScreen} />
  </Stack.Navigator>
);

const ProfileScreen = () => <PlaceholderScreen name="Profile" />;

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.gray,
          tabBarStyle: {
            borderTopWidth: 0,
            elevation: 0,
            backgroundColor: COLORS.white,
            height: 60,
            paddingBottom: 8,
          },
        }}
      >
        <Tab.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{
            tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
          }}
        />
        <Tab.Screen 
          name="Library" 
          component={LibraryStack} 
          options={{
            tabBarIcon: ({ color, size }) => <Library color={color} size={size} />,
          }}
        />
        <Tab.Screen 
          name="Log" 
          component={LogScreen} 
          options={{
            tabBarIcon: ({ color, size }) => <Activity color={color} size={size} />,
          }}
        />
        <Tab.Screen 
          name="Profile" 
          component={ProfileScreen} 
          options={{
            tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
