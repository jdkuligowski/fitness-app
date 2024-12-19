import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import MainTabNavigator from './MainTabNavigator';
import ProfileStackNavigator from './ProfileStackNavigator';

const Stack = createStackNavigator();

export default function RootStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false, // No header for both MainTabNavigator and ProfileStackNavigator
      }}
    >
      <Stack.Screen name="MainTabs" component={MainTabNavigator} />
      <Stack.Screen name="ProfileStack" component={ProfileStackNavigator} />
    </Stack.Navigator>
  );
}
