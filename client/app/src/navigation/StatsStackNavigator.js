import { createNativeStackNavigator } from '@react-navigation/native-stack';
import StatsOverview from '../screens/statsScreens/StatsOverview';
import LeaderboardOverview from '../screens/statsScreens/LeaderboardOverview';

const SupportStack = createNativeStackNavigator();

export default function StatsStackNavigator() {
    return (
        <SupportStack.Navigator screenOptions={{ headerShown: false }}>
            <SupportStack.Screen name="StatsOverview" component={StatsOverview} />
            <SupportStack.Screen name="LeaderboardOverview" component={LeaderboardOverview} />
        </SupportStack.Navigator>
    );
}
