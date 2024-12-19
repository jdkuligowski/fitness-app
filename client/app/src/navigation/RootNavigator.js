// import React from 'react';
// import { useAuth } from '../context/AuthContext'; // Assume you have an AuthContext for global auth state
// import MainTabNavigator from './MainTabNavigator';
// import AuthStackNavigator from './AuthStackNavigator';

// export default function RootNavigator() {
//   const { isAuthenticated } = useAuth(); // Access authentication state

//   return isAuthenticated ? <MainTabNavigator /> : <AuthStackNavigator />;
// }



import React from 'react';
import { useAuth } from '../context/AuthContext'; 
import RootStackNavigator from './RootStackNavigator';
import AuthStackNavigator from './AuthStackNavigator';

export default function RootNavigator() {
  const { isAuthenticated } = useAuth(); 

  return isAuthenticated ? <RootStackNavigator /> : <AuthStackNavigator />;
}
