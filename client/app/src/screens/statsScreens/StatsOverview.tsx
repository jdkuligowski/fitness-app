import React, { useState, useEffect, useContext } from 'react';
import {
    View, Text, StyleSheet, Image, TouchableOpacity, StatusBar, SafeAreaView, Modal,
    TextInput, Keyboard, TouchableWithoutFeedback, ScrollView, Alert, FlatList, Dimensions, RefreshControl,
    ActivityIndicator
} from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
// import { format, toZonedTime } from 'date-fns-tz'; // Import date-fns and date-fns-tz
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../../context/AuthContext'
import { format, addWeeks, startOfWeek, endOfWeek } from 'date-fns';
import { useLoader } from '@/app/src/context/LoaderContext';
import ENV from '../../../../env'
import RPEGauge from '../../components/RPEGauge';
import { Colours } from '../../components/styles';
import ActivityTypePieChart from './Charts/ActivityPieChart';
import BodyPartBarChart from './Charts/BodyPartChart';
import NotificationsModal from '../modalScreens/NotificationsModal';
import { NotificationsContext } from '../../context/NotificationsContext'


export default function StatsOverview() {
    const navigation = useNavigation();
    const { setIsBouncerLoading, isBouncerLoading } = useLoader(); // Access loader functions
    const [stats, setStats] = useState(null);
    const [refreshing, setRefreshing] = useState(false); // For pull-to-refresh
    const [userData, setUserData] = useState('')
    const [activeAggregatePeriod, setActiveAggregatePeriod] = useState('monthly');
    const [notificationsVisible, setNotificationsVisible] = useState(false);
    const { notifications } = useContext(NotificationsContext);

    const notificationCount = notifications.length; // or filter if needed

    const PERIOD_TABS = [
        { id: 'weekly', label: 'last 7 days' },
        { id: 'monthly', label: 'last 30 days' },
        { id: 'yearly', label: 'this year' },
    ];


    // Helper to safely get scoreboard data

    const getActivityTypeData = () => {
        if (!stats?.aggregates) return null;
        switch (activeAggregatePeriod) {
            case 'weekly':
                return stats.aggregates.weekly_activity_type;
            case 'yearly':
                return stats.aggregates.yearly_activity_type;
            case 'monthly':
            default:
                return stats.aggregates.monthly_activity_type;
        }
    };

    const dataObj = getActivityTypeData();
    const hasActivityData = dataObj
        && Object.keys(dataObj).length > 0
        && Object.values(dataObj).some(val => val > 0);


    const getBodyPartData = () => {
        if (!stats?.aggregates) return null;
        switch (activeAggregatePeriod) {
            case 'weekly':
                return stats.aggregates.weekly_body_part;
            case 'yearly':
                return stats.aggregates.yearly_body_part;
            case 'monthly':
            default:
                return stats.aggregates.monthly_body_part;
        }
    };

    const getWorkoutsCompleted = () => {
        if (!stats) return null;
        switch (activeAggregatePeriod) {
            case 'weekly':
                return stats.workouts_this_week;
            case 'yearly':
                return stats.workouts_all_time;
            case 'monthly':
            default:
                return stats.workouts_this_month;
        }
    };

    const getActiveLabel = () => {
        // e.g. find it in PERIOD_TABS
        const activeTabObj = PERIOD_TABS.find((t) => t.id === activeAggregatePeriod);
        return activeTabObj ? activeTabObj.label : '';
    };

    // 1. Fetch basic user profile (for name, image, etc.)
    const getUser = async () => {
        try {
            const userId = await AsyncStorage.getItem('userId');
            if (!userId) {
                console.error('User ID not found in AsyncStorage.');
                return;
            }
            const { data } = await axios.get(`${ENV.API_URL}/api/auth/profile/${userId}/`);
            setUserData(data);
        } catch (error) {
            console.error('Error fetching user data:', error?.response?.data || error.message);
        }
    };

    // 2. Load any cached stats from AsyncStorage (so the screen is never blank)
    const loadCachedStats = async () => {
        try {
            const cachedStats = await AsyncStorage.getItem('cachedStats');
            if (cachedStats) {
                setStats(JSON.parse(cachedStats));
            }
        } catch (error) {
            console.error('Error loading cached stats:', error);
        }
    };

    // 3. Fetch fresh stats from server, then cache them
    const fetchStats = async (isRefreshing = false) => {
        try {
            if (!isRefreshing) setIsBouncerLoading(true); // show loader if not a pull-to-refresh
            setRefreshing(true);

            const userId = await AsyncStorage.getItem('userId');
            const response = await axios.get(`${ENV.API_URL}/api/auth/full-profile/${userId}/`);
            const freshStats = response.data.stats;
            setStats(freshStats);
            console.log('Stats: ', JSON.stringify(response.data.stats, null, 2))


            // Cache the fresh stats
            await AsyncStorage.setItem('cachedStats', JSON.stringify(freshStats));

            setIsBouncerLoading(false);
            setRefreshing(false);
        } catch (error) {
            console.error('Error fetching stats:', error);
            setIsBouncerLoading(false);
            setRefreshing(false);
        }
    };

    // 4. On component mount: load cached stats, then fetch fresh stats
    useEffect(() => {
        const initializeStats = async () => {
            await loadCachedStats();
            await fetchStats();
        };
        initializeStats();
        getUser();
    }, []);

    // 5. Pull-to-refresh
    const onRefresh = () => {
        fetchStats(true);
    };

    const getCurrentMonthName = () => {
        // “long” gives the full month name, e.g. “April”
        return new Date().toLocaleString("en-GB", { month: "long" });
    }


    // 6. If still loading and have no cached stats, show a spinner
    if (isBouncerLoading && !stats) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <ActivityIndicator size="large" color="#000" />
            </SafeAreaView>
        );
    }

    // Helper to get user initials if no profile image
    const getUserInitials = () => {
        if (!userData) return '';
        const firstInitial = userData.first_name?.charAt(0) || '';
        const lastInitial = userData.last_name?.charAt(0) || '';
        return `${firstInitial}${lastInitial}`.toUpperCase();
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor="#F6F3DC" />
            <ScrollView
                contentContainerStyle={styles.statsPageContainer}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Header Area */}
                <View style={styles.header}>
                    <View style={styles.appIntro}>
                        <View style={styles.introContainer}>
                            <TouchableOpacity
                                onPress={() => navigation.navigate('ProfileStack', {
                                    screen: 'ProfilePage'
                                })}>
                                {userData?.profile_image ? (
                                    <Image
                                        style={styles.profileImage}
                                        source={{ uri: userData.profile_image }}
                                    />
                                ) : (
                                    <View style={styles.initialsContainer}>
                                        <Text style={styles.initialsText}>{getUserInitials()}</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                            <View style={styles.textIntro}>
                                <Text style={styles.subHeadingText}>Stats</Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            style={styles.profileButton}
                            onPress={() => setNotificationsVisible(true)}
                        >
                            <Ionicons name="notifications-outline" color={'black'} size={20} />
                            {notificationCount > 0 && (
                                <View style={styles.badgeContainer}>
                                    <Text style={styles.badgeText}>{notificationCount}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>


                {/* Leaderboard Scores + Ranks */}
                <View style={styles.topSection}>

                    <TouchableOpacity
                        style={styles.leaderboardOverviewContainer}
                        onPress={() => {
                            navigation.navigate('LeaderboardOverview');

                        }}
                    >
                        <Text style={styles.leaderboardTitle}>Leaderboard</Text>
                        {/* <Text style={styles.leaderboardTitle}>{getCurrentMonthName()} leaderboard</Text> */}
                        <View style={styles.leaderboardResults}>
                            {/* Example user info row */}
                            {/* <View style={styles.profileBox}>
                            {userData?.profile_image ? (
                                <Image
                                    style={[styles.profileImage, { marginRight: 0 }]}
                                    source={{ uri: userData.profile_image }}
                                />
                            ) : (
                                <View style={styles.initialsContainer}>
                                    <Text style={styles.initialsText}>{getUserInitials()}</Text>
                                </View>
                            )}
                            <Text style={styles.nameText}>
                                {userData?.first_name ?? 'User'}
                            </Text>
                        </View> */}


                            {/* Weekly Score */}
                            <View style={styles.scoreBox}>

                                <View style={styles.pointsBox}>
                                    <Text style={styles.leaderboardSubTitle}>MONTHLY</Text>
                                    <Text style={styles.leaderboardScore}>
                                        {stats?.leaderboard?.monthly_score ?? '...'}
                                    </Text>
                                </View>
                                {/* Weekly Rank */}
                                <View style={styles.pointsBox}>
                                    <Text style={styles.leaderboardSubTitle}>RANK</Text>
                                    <Text style={styles.leaderboardScore}>
                                        {stats?.ranks?.monthly_rank ?? '...'}
                                    </Text>
                                </View>
                            </View>

                            <Ionicons name="chevron-forward-outline" color={'black'} size={20} />
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.leaderboardOverviewContainer}
                        onPress={() => {
                            navigation.navigate('MovementStats');

                        }}
                    >
                        <Text style={styles.leaderboardTitle}>Movement stats</Text>
                        <View style={styles.movementStatsDetail}>

                        <Ionicons name="barbell-outline" color={Colours.gymColour} size={40} />
                        <Ionicons name="chevron-forward-outline" color={'black'} size={20} />
                        </View>


                    </TouchableOpacity>

                </View>


                <View style={styles.tabs}>
                    {PERIOD_TABS.map((tab) => {
                        const isActive = (activeAggregatePeriod === tab.id);
                        // You can define a map of background colors keyed by ID:
                        const tabColors = {
                            weekly: Colours.buttonColour,
                            monthly: Colours.buttonColour,
                            yearly: Colours.buttonColour,
                        };

                        return (
                            <TouchableOpacity
                                key={tab.id}
                                style={[
                                    styles.tab,
                                    { backgroundColor: isActive ? tabColors[tab.id] : '#FFFFFF' },
                                ]}
                                onPress={() => setActiveAggregatePeriod(tab.id)}
                            >
                                <Text style={[styles.tabText, isActive && styles.activeTabText]}>
                                    {tab.label === "this year" ? "Year" :
                                        tab.label === "last 30 days" ? "Month" :
                                            "Week"}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>


                {/* Donut Chart for Weekly Activity */}

                {/* Activity Chart */}
                <View style={[styles.completedWorkoutsContainer, { backgroundColor: Colours.secondaryColour }]}>
                    <View style={styles.sectionTitle}>

                        <Text style={styles.workoutsCompletedTitle}>
                            Workouts {getActiveLabel().toLowerCase()}
                        </Text>
                        <Text style={styles.workoutsCompletedNumber}>{getWorkoutsCompleted()}</Text>

                    </View>
                    <View style={{ marginVertical: 10 }}>
                        {hasActivityData ? (
                            <ActivityTypePieChart dataObject={dataObj} />
                        ) : (
                            <Text style={styles.noDataMessage}>
                                Do some workouts to see your activity
                            </Text>
                        )}
                    </View>
                </View>

                {/* Body Part Chart */}
                <View style={[styles.completedWorkoutsContainer, { backgroundColor: Colours.secondaryColour }]}>
                    <Text style={styles.workoutsCompletedTitle}>
                        Body parts targeted {getActiveLabel().toLowerCase()}
                    </Text>
                    <View style={{ marginVertical: 10 }}>
                        {getBodyPartData() ? (
                            <BodyPartBarChart dataObject={getBodyPartData()} />
                        ) : (
                            <Text style={styles.noDataMessage}>Save some gym workouts to track your gains</Text>
                        )}
                    </View>
                </View>

                {/* <TouchableOpacity
                    style={styles.leaderboardOverviewContainer}
                    onPress={() => {
                        navigation.navigate('MovementStats');

                    }}
                >
                    <Text>Movement stats</Text>

                </TouchableOpacity> */}



            </ScrollView>
            <NotificationsModal
                visible={notificationsVisible}
                onClose={() => setNotificationsVisible(false)}
            />
        </SafeAreaView>
    );
}



const styles = StyleSheet.create({

    safeArea: {
        flex: 1,
        backgroundColor: Colours.primaryHeader,
    },
    statsPageContainer: {
        flexGrow: 1,
        backgroundColor: Colours.primaryBackground,
        paddingBottom: 100,
    },
    header: {
        padding: 20,
        backgroundColor: Colours.primaryHeader,
        height: 100,
        borderBottomLeftRadius: 50,
        borderBottomRightRadius: 50,
    },
    dateBox: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    dateText: {
        marginLeft: 5,
        color: 'white',
    },
    appIntro: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',

    },
    introContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        // width: '100%',
    },
    profileImage: {
        width: 50,
        height: 50,
        borderRadius: 10,
        marginRight: 15,
    },
    initialsContainer: {
        width: 50,
        height: 50,
        borderRadius: 10,
        // marginRight: 15,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colours.secondaryColour,
        borderWidth: 1,
    },
    initialsText: {
        fontSize: 18,
        fontWeight: 600,
    },
    headingText: {
        fontSize: 16,
        width: '100%',
        marginTop: 2,
        marginBottom: 2,
        color: 'white',
    },
    subHeadingText: {
        fontSize: 16,
        width: '100%',
        fontWeight: 'bold',
        marginTop: 2,
        marginBottom: 2,
        marginLeft: 10,
        color: 'white',
    },
    profileButton: {
        backgroundColor: Colours.secondaryColour,
        width: 50,
        height: 50,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderRightWidth: 3,
        borderBottomWidth: 3,
        borderTopWidth: 1,
        borderLeftWidth: 1,
    },
    completedWorkoutsContainer: {
        marginHorizontal: 20,
        marginTop: 20,
        padding: 20,
        borderRadius: 20,
        borderTopWidth: 1,
        borderLeftWidth: 1,
        borderRightWidth: 4,
        borderBottomWidth: 4,
        backgroundColor: 'white'
    },
    workoutsCompletedTitle: {
        fontSize: 16,
        fontWeight: 700,
    },
    workoutsResults: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    workoutsBox: {
        flexDirection: 'column',
        width: '45%',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F5FFF4',
        minHeight: 90,
        borderRadius: 20,
        padding: 10,
    },
    workoutsMonth: {
        fontSize: 12,
        color: '#A6A6A6',
    },
    workoutsValue: {
        fontSize: 24,
        fontWeight: 700,
        marginVertical: 5,
    },
    workoutsChange: {
        backgroundColor: '#D6F7F4',
        fontSize: 10,
        borderWidth: 1,
        borderRadius: 5,
        paddingHorizontal: 5,
        paddingVertical: 2,
    },
    topSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginHorizontal: 20,
    },
    leaderboardOverviewContainer: {
        // marginLeft: 20,
        // marginRight: 20,
        marginTop: 20,
        padding: 20,
        borderRadius: 20,
        borderTopWidth: 1,
        borderLeftWidth: 1,
        borderRightWidth: 4,
        borderBottomWidth: 4,
        backgroundColor: Colours.secondaryColour,
        width: '48%',
    },
    leaderboardTitle: {
        fontSize: 16,
        fontWeight: 700,
    },
    movementStatsDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginLeft: 40,  
    marginTop: 10,
    },
    leaderboardResults: {
        flexDirection: 'row',
        marginTop: 10,
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    profileBox: {
        alignItems: 'center',
        justifyContent: 'center',
    },

    leaderboardInitials: {
        padding: 10,
        borderWidth: 1,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    leaderboardInitialsText: {
        fontSize: 16,
    },
    nameText: {
        fontSize: 12,
    },
    leaderboardSubTitle: {
        fontSize: 12,
        color: '#A6A6A6',
        // marginBottom: 5,
        width: '60%',
    },
    leaderboardScore: {
        fontSize: 16,
        fontWeight: 600,
    },
    pointsBox: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    recentWorkoutsContainer: {
        marginHorizontal: 20,
        marginTop: 20,
        padding: 20,
        borderRadius: 20,
        borderTopWidth: 1,
        borderLeftWidth: 1,
        borderRightWidth: 4,
        borderBottomWidth: 4,
        backgroundColor: 'white'
    },
    recentWorkouts: {
        // marginTop: 10,
    },
    workout: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    workoutLeft: {

    },
    workoutTitle: {
        fontSize: 14,
        fontWeight: 500,
        marginVertical: 2,
    },
    tabs: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 20,
        marginHorizontal: 20,
        borderWidth: 1,
        borderColor: 'black',
        paddingVertical: 5,
        borderRadius: 10,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderLeftWidth: 1,
        borderRightWidth: 4,
        borderBottomWidth: 4,
    },
    tab: {
        paddingVertical: 8,
        paddingHorizontal: 0,
        borderRadius: 10,
        backgroundColor: 'white',
        width: '30%',
    },
    activeTab: {
        backgroundColor: Colours.buttonColour,
    },
    tabText: {
        fontSize: 14,
        color: 'black',
        textAlign: 'center',

    },
    activeTabText: {
        fontWeight: 'bold',
        color: Colours.secondaryColour
    },
    sectionTitle: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    workoutsCompletedNumber: {
        fontSize: 26,
        fontWeight: '700',
        marginRight: 20,
    },
    badgeContainer: {
        position: 'absolute',
        bottom: -7,
        left: -7,
        backgroundColor: Colours.buttonColour,
        width: 25,
        height: 25,
        borderRadius: 15,    // full circle
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FFF',
    },
    badgeText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: 'bold',

    },
})