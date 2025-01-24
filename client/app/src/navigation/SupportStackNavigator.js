import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SupportOverview from '../screens/supportScreens/SupportOverview';
import ChatOverview from '../screens/supportScreens/ChatOverview';
import VideosOverview from '../screens/supportScreens/VideosOverview';

const SupportStack = createNativeStackNavigator();

export default function SupportStackNavigator() {
    return (
        <SupportStack.Navigator screenOptions={{ headerShown: false }}>
            <SupportStack.Screen name="SupportOverview" component={SupportOverview} />
            <SupportStack.Screen name="ChatOverview" component={ChatOverview} />
            <SupportStack.Screen name="VideoOverview" component={VideosOverview} />
        </SupportStack.Navigator>
    );
}
