import React, { useState, useEffect } from 'react';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MainTabNavigator from './app/src/navigation/MainTabNavigator';
import AuthStackNavigator from './app/src/navigation/AuthStackNavigator';
import { useColorScheme } from './hooks/useColorScheme';
import { WorkoutProvider } from './app/src/context/WorkoutContext';
import { AuthProvider } from './app/src/context/AuthContext';
import { LoaderProvider } from './app/src/context/LoaderContext';
import RootNavigator from './app/src/navigation/RootNavigator';
import BouncingLoader from './app/src/components/BouncingLoader';

// Prevent the splash screen from auto-hiding before assets load
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const colorScheme = useColorScheme();
  const [fontsLoaded] = useFonts({
    SpaceMono: require('./assets/fonts/SpaceMono-Regular.ttf'),
  });

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem('token');
      setIsAuthenticated(!!token); // Set true if token exists
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  // Manage splash screen
  useEffect(() => {
    if (fontsLoaded && !isLoading) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, isLoading]);

  // Avoid rendering until everything is ready
  if (isLoading || !fontsLoaded) {
    return null; // Add a splash screen or loader component if necessary
  }

  return (
    <AuthProvider>
      <LoaderProvider> {/* Wrap everything in LoaderProvider */}
        <WorkoutProvider>
          <NavigationContainer theme={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <RootNavigator />
            <BouncingLoader /> {/* The global loader is on top of everything */}
          </NavigationContainer>
        </WorkoutProvider>
      </LoaderProvider>
    </AuthProvider>
  );
}