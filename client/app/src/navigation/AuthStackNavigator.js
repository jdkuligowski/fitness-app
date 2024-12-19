import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import LandingPage from '../screens/authScreens/LandingPage';
import LoginPage from '../screens/authScreens/LoginPage';
import RegisterPage from '../screens/authScreens/RegisterPage';

const AuthStack = createStackNavigator();

export default function AuthStackNavigator() {
  return (
    <AuthStack.Navigator>
      <AuthStack.Screen
        name="Landing"
        component={LandingPage}
        options={{ headerShown: false }}
      />
      <AuthStack.Screen
        name="Login"
        component={LoginPage}
        options={{ headerShown: false }}
      />
      <AuthStack.Screen
        name="Register"
        component={RegisterPage}
        options={{ headerShown: false }}
      />
    </AuthStack.Navigator>
  );
}
