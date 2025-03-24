// src/navigation/HomeStackNavigator.js
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/homeScreens/Home';
import WorkoutCategories from '../screens/homeScreens/findWorkoutScreens/WorkoutCategories'
import GymSession from '../screens/homeScreens/findWorkoutScreens/GymSession'
import GymSessionDetails from '../screens/homeScreens/findWorkoutScreens/GymSessionDetails'
import SaveWorkoutModal from '../screens/modalScreens/SaveWorkoutModal'
import SingleWorkoutSummary from '../screens/homeScreens/trainingScreens/SingleWorkoutSummary'
import RunningSession from '../screens/homeScreens/findWorkoutScreens/RunningSession'
import RunningSessionDetails from '../screens/homeScreens/findWorkoutScreens/RunningSessionDetails'
import MobilitySession from '../screens/homeScreens/findWorkoutScreens/MobilitySession'
import MobilitySessionDetails from '../screens/homeScreens/findWorkoutScreens/MobilitySessionDetails'
import HiitSession from '../screens/homeScreens/findWorkoutScreens/HiitSession'
import HiitSessionDetails from '../screens/homeScreens/findWorkoutScreens/HiitSessionDetails'
import SuggestedGymDetails from '../screens/homeScreens/findWorkoutScreens/SuggestedGymDetails'
import HyroxSession from '../screens/homeScreens/findWorkoutScreens/HyroxSession'
import HyroxSessionDetails from '../screens/homeScreens/findWorkoutScreens/HyroxSessionDetails'

const Stack = createStackNavigator();

export default function HomeStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Workout categories" component={WorkoutCategories} options={{ headerShown: false }} />
      <Stack.Screen name="Running" component={RunningSession} options={{ headerShown: false }} />
      <Stack.Screen name="Gym" component={GymSession} options={{ headerShown: false }} />
      <Stack.Screen name="Mobility" component={MobilitySession} options={{ headerShown: false }} />
      <Stack.Screen name="MobilitySessionDetails" component={MobilitySessionDetails} options={{ headerShown: false }} />
      <Stack.Screen name="WorkoutDetails" component={GymSessionDetails} options={{ headerShown: false }} />
      <Stack.Screen name="RunningSessionDetails" component={RunningSessionDetails} options={{ headerShown: false }} />
      <Stack.Screen name="Hiit" component={HiitSession} options={{ headerShown: false }} />
      <Stack.Screen name="HiitSessionDetails" component={HiitSessionDetails} options={{ headerShown: false }} />
      <Stack.Screen name="SuggestedGymDetails" component={SuggestedGymDetails} options={{ headerShown: false }} />
      <Stack.Screen name="Hyrox" component={HyroxSession} options={{ headerShown: false }} />
      <Stack.Screen name="HyroxSessionDetails" component={HyroxSessionDetails} options={{ headerShown: false }} />
      <Stack.Screen 
                name="SaveWorkoutModal" 
                component={SaveWorkoutModal} 
                options={{ presentation: 'modal', headerShown: false }} 
            />
      {/* <Stack.Screen name="TrainingDetails" component={SingleWorkoutSummary} options={{ headerShown: false }} /> */}
    </Stack.Navigator>
  );
}
