import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import HomeStackNavigator from './HomeStackNavigator';
import ExploreScreen from '../screens/homeScreens/Explore';
import StatsScreen from '../screens/homeScreens/Stats';
import SupportOverview from '../screens/supportScreens/SupportOverview';
import StatsOverview from '../screens/statsScreens/StatsOverview'
import { View, Text, StyleSheet } from 'react-native';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native'; // Import helper
import TrainingOverview from '../screens/homeScreens/trainingScreens/trainingOverview';
import TrainingStackNavigator from './TrainingStackNavigator'; // Import the new stack navigator
import SupportStackNavigator from './SupportStackNavigator';


const Tab = createBottomTabNavigator();

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => {
        const routeName = getFocusedRouteNameFromRoute(route) ?? '';

        // Hide tab bar if on WorkoutDetails screen
        const isTabBarHidden = ['WorkoutDetails', 'TrainingDetails', 'CompleteWorkout', 'ChatOverview'].includes(routeName);

        return {
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === 'Home') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Training') {
              iconName = focused ? 'barbell' : 'barbell-outline';
            } else if (route.name === 'Explore') {
              iconName = focused ? 'search' : 'search-outline';
            } else if (route.name === 'Stats') {
              iconName = focused ? 'stats-chart' : 'stats-chart-outline';
            } else if (route.name === 'Support') {
              iconName = focused
                ? 'information-circle'
                : 'information-circle-outline';
            }

            return (
              <View
                style={[
                  styles.iconContainer,
                  focused && styles.iconBackground,
                ]}
              >
                <Ionicons name={iconName} size={20} color={focused ? '#5B37B7' : 'black'} />
              </View>
            );
          },
          tabBarStyle: isTabBarHidden
            ? { display: 'none' } // Hide tab bar when on WorkoutDetails
            : styles.tabBar, // Show default style otherwise
          tabBarLabel: ({ focused }) => (
            <Text style={[styles.tabLabel, focused && styles.focusedLabel]}>
              {route.name}
            </Text>
          ),
          headerShown: false,
        };
      }}
    >
      <Tab.Screen name="Home" component={HomeStackNavigator} />
      <Tab.Screen name="Training" component={TrainingStackNavigator} />
      <Tab.Screen name="Stats" component={StatsOverview} />
      <Tab.Screen name="Support" component={SupportStackNavigator} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 120,
    backgroundColor: 'white',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    position: 'absolute',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: -2 },
    shadowRadius: 10,
    elevation: 5, // For Android shadow
    paddingTop: 35,
    paddingLeft: 10,
    paddingRight: 10,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 50,
    height: 50,
    borderRadius: 15,
    marginBottom: 20,
  },
  iconBackground: {
    backgroundColor: '#DFD7F3', // Background color for selected icon
  },
  tabLabel: {
    fontSize: 12,
    color: 'black', // Default text color
    marginTop: 5,
  },
  focusedLabel: {
    color: '#5B37B7', // Text color for the active tab
    fontWeight: 'bold',
  },
});
