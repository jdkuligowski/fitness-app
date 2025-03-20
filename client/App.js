import React, { useState, useEffect } from 'react';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import MainTabNavigator from './app/src/navigation/MainTabNavigator';
import AuthStackNavigator from './app/src/navigation/AuthStackNavigator';
import { useColorScheme } from './hooks/useColorScheme';
import { WorkoutProvider } from './app/src/context/WorkoutContext';
import { AuthProvider, useAuth } from './app/src/context/AuthContext';
import { LoaderProvider } from './app/src/context/LoaderContext';
import RootNavigator from './app/src/navigation/RootNavigator';
import BouncingLoader from './app/src/components/BouncingLoader';
import { View } from 'react-native';
import OnboardingModal from '../client/app/src/screens/modalScreens/RegistrationModal';
import * as Device from 'expo-device';
import ENV from './env';
import axios from 'axios';



// Prevent the splash screen from auto-hiding before assets load
SplashScreen.preventAutoHideAsync();

async function registerForPushNotificationsAsync() {
  let token;
  console.log('isDevice?', Constants.isDevice);
  console.log('Are we on a real device?', Device.isDevice);

  if (Device.isDevice) {
    // Check existing permission
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // If no permission yet, ask for it
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    // If still not granted, bail out
    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return;
    }

    // Get the token
    token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log('Expo Push Token:', token);
  } else {
    alert('Must use physical device for Push Notifications');
  }

  return token;
}


function InnerApp() {
  // const [isAuthenticated, setIsAuthenticated] = useState(false);
  // const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated, isLoading } = useAuth();  // from AuthContext

  const colorScheme = useColorScheme();
  const [fontsLoaded] = useFonts({
    SpaceMono: require('./assets/fonts/SpaceMono-Regular.ttf'),
  });

  // // Check authentication on mount
  // useEffect(() => {
  //   const checkAuth = async () => {
  //     const token = await AsyncStorage.getItem('token');
  //     setIsAuthenticated(!!token); // Set true if token exists
  //     setIsLoading(false);
  //   };
  //   checkAuth();
  // }, []);

  // Manage splash screen
  // useEffect(() => {
  //   if (fontsLoaded && !isLoading) {
  //     SplashScreen.hideAsync();
  //   }
  // }, [fontsLoaded, isLoading]);

  // Manage splash screen
  useEffect(() => {
    if (fontsLoaded && !isLoading) {
      SplashScreen.hideAsync();

      // If user is authenticated, register for push notifications
      if (isAuthenticated) {
        (async () => {
          const expoToken = await registerForPushNotificationsAsync();
          if (expoToken) {
            // Send expoToken + user_id to your backend
            const storedUserId = await AsyncStorage.getItem('userId');
            try {
              const response = await axios.post(
                `${ENV.API_URL}/api/notifications/set_token/`,
                { user_id: storedUserId, token: expoToken },
                { headers: { 'Content-Type': 'application/json' } }
              );
              console.log('Successfully saved push token:', response.data);
            } catch (err) {
              console.error('Error saving push token:', err);
            }
          }
        })();
      }
    }
  }, [fontsLoaded, isLoading, isAuthenticated]);

  // Avoid rendering until everything is ready
  if (isLoading || !fontsLoaded) {
    return null; // Add a splash screen or loader component if necessary
  }



  return (
    // <AuthProvider>
    <LoaderProvider> {/* Wrap everything in LoaderProvider */}
      <WorkoutProvider>
        <NavigationContainer theme={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <RootNavigator />
          <BouncingLoader /> {/* The global loader is on top of everything */}
        </NavigationContainer>
      </WorkoutProvider>
    </LoaderProvider>
    // </AuthProvider>
  );
}


export default function App() {
  return (
    <AuthProvider>
      <InnerApp />
    </AuthProvider>
  );
}