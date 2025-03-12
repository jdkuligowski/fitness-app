import React, { useState, useEffect, useRef } from 'react';
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


export default function StatsOverview() {
    const navigation = useNavigation();
    const { setIsBouncerLoading, isBouncerLoading } = useLoader(); // Access loader functions
    const [stats, setStats] = useState(null);
    const [refreshing, setRefreshing] = useState(false); // For pull-to-refresh
    const [userData, setUserData] = useState('')

    // fetch user data function
    const getUser = async () => {
        try {
            const userId = await AsyncStorage.getItem("userId"); // Retrieve the user ID from local storage
            console.log("user_id ->", userId);
            if (!userId) {
                console.error('User ID not found in AsyncStorage.');
                // setIsLoading(false);
                return;
            }
            const { data } = await axios.get(`${ENV.API_URL}/api/auth/profile/${userId}/`);
            console.log('User data ->', data); // Debug log
            setUserData(data);
        } catch (error) {
            console.error('Error fetching user data:', error?.response?.data || error.message);
        }

    };

    useEffect(() => {
        getUser();
    }, []);

    // Get initials from the user's name
    const getUserInitials = () => {
        if (!userData) return '';
        const firstInitial = userData.first_name?.charAt(0) || '';
        const lastInitial = userData.last_name?.charAt(0) || '';
        return `${firstInitial}${lastInitial}`;
    };

    // 🔥 Function to Load Cached Stats from AsyncStorage
    const loadCachedStats = async () => {
        try {
            const cachedStats = await AsyncStorage.getItem('cachedStats');
            if (cachedStats) {
                setStats(JSON.parse(cachedStats));
                console.log('Loaded Cached Stats:', JSON.parse(cachedStats));
            }
        } catch (error) {
            console.error('Error loading cached stats:', error);
        }
    };

    // 🔥 Function to Fetch Fresh Stats from API
    const fetchStats = async (isRefreshing = false) => {
        try {
            if (!isRefreshing) setIsBouncerLoading(true);
            setRefreshing(true);
            const userId = await AsyncStorage.getItem('userId');
            const response = await axios.get(`${ENV.API_URL}/api/auth/full-profile/${userId}/`);
            const freshStats = response.data.stats;
            setStats(freshStats);

            // Save the fresh stats to AsyncStorage for caching
            await AsyncStorage.setItem('cachedStats', JSON.stringify(freshStats));
            console.log('Fetched Fresh Stats:', freshStats);
            setIsBouncerLoading(false);
            setRefreshing(false);
        } catch (error) {
            console.error('Error fetching stats:', error);
            setIsBouncerLoading(false);
            setRefreshing(false);
        }
    };

    // 🔥 Load cached stats on component mount and then fetch fresh stats
    useEffect(() => {
        const initializeStats = async () => {
            await loadCachedStats(); // Show cached data first
            await fetchStats(); // Fetch fresh data
        };
        initializeStats();
    }, []);

    // 🔥 Function to Handle Pull-to-Refresh
    const onRefresh = () => {
        fetchStats(true);
    };

    if (isBouncerLoading && !stats) {
        // Show loader if no cache exists
        return (
            <SafeAreaView style={styles.safeArea}>
                <ActivityIndicator size="large" color="#000" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor="#F6F3DC" />
            <ScrollView
                contentContainerStyle={styles.statsPageContainer}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                <View style={styles.header}>
                    <View style={styles.appIntro}>
                        <View style={styles.introContainer}>
                            <TouchableOpacity>
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
                        <TouchableOpacity style={styles.profileButton}>
                            <Ionicons name="notifications-outline" color={'black'} size={20} />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.completedWorkoutsContainer}>
                    <Text style={styles.workoutsCompletedTitle}>Workouts Completed</Text>
                    <View style={styles.workoutsResults}>
                        <View style={styles.workoutsBox}>
                            <Text style={styles.workoutsMonth}>THIS MONTH</Text>
                            <Text style={styles.workoutsValue}>{stats ? stats.workouts_this_month : '...'}</Text>
                        </View>
                        <View style={styles.workoutsBox}>
                            <Text style={styles.workoutsMonth}>ALL TIME</Text>
                            <Text style={styles.workoutsValue}>{stats ? stats.workouts_all_time : '...'}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.recentWorkoutsContainer}>
                    <Text style={styles.workoutsCompletedTitle}>Recent workouts</Text>
                    {stats?.recent_workouts.map((workout) => (
                        <View key={workout.id} style={styles.workout}>
                            <View style={styles.workoutLeft}>
                                <Text style={styles.workoutTitle}>{workout.name}</Text>
                                <Text style={styles.workoutTitle}>{workout.completed_date}</Text>
                            </View>
                            <View style={styles.scoreContainer}>
                                <RPEGauge score={8} />
                            </View>
                        </View>
                    ))}
                </View>

                {/* <TouchableOpacity style={styles.leaderboardOverviewContainer}>
                    <Text style={styles.leaderboardTitle}>Leaderboard rank</Text>
                    <View style={styles.leaderboardResults}>
                        <View style={styles.profileBox}>
                            <View style={styles.leaderboardInitials}>
                                <Text style={styles.leaderboardInitialsText}>JK</Text>
                            </View>
                            <Text style={styles.nameText}>James</Text>
                        </View>
                        <View style={styles.pointsBox}>
                            <Text style={styles.leaderboardSubTitle}>ALL TIME</Text>
                            <Text style={styles.leaderboardScore}>
                                {stats ? stats.leaderboard.total_score : '...'}
                            </Text>
                        </View>
                        <View style={styles.pointsBox}>
                            <Text style={styles.leaderboardSubTitle}>WEEKLY</Text>
                            <Text style={styles.leaderboardScore}>
                                {stats ? stats.leaderboard.weekly_score : '...'}
                            </Text>
                        </View>
                        <View style={styles.pointsBox}>
                            <Text style={styles.leaderboardSubTitle}>RANK</Text>
                            <Text style={styles.leaderboardScore}>{stats ? stats.leaderboard_rank : '...'}</Text>
                        </View>
                        <Ionicons name="chevron-forward-outline" color={'black'} size={20} />
                    </View>
                </TouchableOpacity> */}
            </ScrollView>
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
        marginRight: 15,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFE0E1',
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
        backgroundColor: '#FFE0E1',
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
    leaderboardOverviewContainer: {
        margin: 20,
        padding: 20,
        borderRadius: 20,
        borderTopWidth: 1,
        borderLeftWidth: 1,
        borderRightWidth: 4,
        borderBottomWidth: 4,
        backgroundColor: '#D6F7F4',
    },
    leaderboardTitle: {
        fontSize: 16,
        fontWeight: 700,
    },
    leaderboardResults: {
        flexDirection: 'row',
        marginTop: 10,
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    profileBox: {
        alignItems: 'center',
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
        marginBottom: 5,
    },
    leaderboardScore: {
        fontSize: 16,
        fontWeight: 600,
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
    }
})