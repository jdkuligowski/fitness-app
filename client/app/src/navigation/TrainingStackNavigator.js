import { createStackNavigator } from '@react-navigation/stack';
import TrainingOverview from '../screens/homeScreens/trainingScreens/trainingOverview';
import SingleWorkoutSummary from '../screens/homeScreens/trainingScreens/SingleWorkoutSummary';
import CompleteWorkout from '../screens/homeScreens/trainingScreens/CompleteWorkout'
import CompleteRunningWorkout from '../screens/homeScreens/trainingScreens/CompleteRunningWorkout'
import CompleteMobilityWorkout from '../screens/homeScreens/trainingScreens/CompleteMobilityWorkout'

const TrainingStack = createStackNavigator();

export default function TrainingStackNavigator() {
  return (
    <TrainingStack.Navigator>
      <TrainingStack.Screen name="TrainingOverview" component={TrainingOverview} options={{ headerShown: false }} />
      <TrainingStack.Screen name="TrainingDetails" component={SingleWorkoutSummary} options={{ headerShown: false }} />
      <TrainingStack.Screen name="CompleteWorkout" component={CompleteWorkout} options={{ headerShown: false }} />
      <TrainingStack.Screen name="CompleteRunningWorkout" component={CompleteRunningWorkout} options={{ headerShown: false }} />
      <TrainingStack.Screen name="CompleteMobilityWorkout" component={CompleteMobilityWorkout} options={{ headerShown: false }} />
    </TrainingStack.Navigator>
  );
}
