import { createStackNavigator } from '@react-navigation/stack';
import ProfileOverview from '../screens/profileScreens/ProfileOverview';
import AccountPage from '../screens/profileScreens/AccountPage';
import PreferencesPage from '../screens/profileScreens/PreferencesPage'

const Stack = createStackNavigator();

export default function ProfileStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false, // Don't show header (since we will design our own header)
      }}
    >
      <Stack.Screen name="ProfilePage" component={ProfileOverview} />
      <Stack.Screen name="AccountPage" component={AccountPage} />
      <Stack.Screen name="PreferencesPage" component={PreferencesPage} />
    </Stack.Navigator>
  );
}