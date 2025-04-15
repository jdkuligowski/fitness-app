import { createNativeStackNavigator } from '@react-navigation/native-stack';
import StatsOverview from '../screens/statsScreens/StatsOverview';
import LeaderboardOverview from '../screens/statsScreens/LeaderboardOverview';
import MovementStats from '../screens/statsScreens/MovementStats'

const SupportStack = createNativeStackNavigator();

export default function StatsStackNavigator() {
    return (
        <SupportStack.Navigator screenOptions={{ headerShown: false }}>
            <SupportStack.Screen name="StatsOverview" component={StatsOverview} />
            <SupportStack.Screen name="LeaderboardOverview" component={LeaderboardOverview} />
            <SupportStack.Screen name="MovementStats" component={MovementStats} />
        </SupportStack.Navigator>
    );
}
