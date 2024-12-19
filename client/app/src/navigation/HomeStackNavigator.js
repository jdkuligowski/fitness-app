// src/navigation/HomeStackNavigator.js
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/homeScreens/Home';
import RunningScreen from '../screens/homeScreens/RunningScreen';
import TrainingOverview from '../screens/homeScreens/trainingScreens/trainingOverview'
import GymSession from '../screens/homeScreens/findWorkoutScreens/GymSession'
import GymSessionDetails from '../screens/homeScreens/findWorkoutScreens/GymSessionDetails'
import SaveWorkoutModal from '../screens/modalScreens/SaveWorkoutModal'
import SingleWorkoutSummary from '../screens/homeScreens/trainingScreens/SingleWorkoutSummary'

const Stack = createStackNavigator();

export default function HomeStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      {/* <Stack.Screen name="Training overview" component={TrainingOverview} options={{ headerShown: false }} /> */}
      <Stack.Screen name="Running" component={RunningScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Gym" component={GymSession} options={{ headerShown: false }} />
      <Stack.Screen name="WorkoutDetails" component={GymSessionDetails} options={{ headerShown: false }} />
      <Stack.Screen 
                name="SaveWorkoutModal" 
                component={SaveWorkoutModal} 
                options={{ presentation: 'modal', headerShown: false }} 
            />
      {/* <Stack.Screen name="TrainingDetails" component={SingleWorkoutSummary} options={{ headerShown: false }} /> */}
    </Stack.Navigator>
  );
}
