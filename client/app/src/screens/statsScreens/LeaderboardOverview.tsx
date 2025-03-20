import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    Image,
    StyleSheet,
    FlatList,
    SafeAreaView,
    ActivityIndicator,
    TouchableOpacity,
    Dimensions,
    ScrollView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import ENV from '../../../../env';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

export default function LeaderboardScreen() {
    const navigation = useNavigation();
    const [leaderboardData, setLeaderboardData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null); // for the user at the top box

    useEffect(() => {
        fetchLeaderboard();
        fetchCurrentUser();
    }, []);

    // 1) Fetch the leaderboard array (paginated) from DRF
    const fetchLeaderboard = async () => {
        try {
            const response = await axios.get(`${ENV.API_URL}/api/leaderboard/`);
            // "response.data" is the paginated object => { count, next, previous, results: [...] }
            // We'll store just the array in state
            setLeaderboardData(response.data.results);
            console.log('leaderboard: ', response.data.results)
            setIsLoading(false);
        } catch (err) {
            console.error('Error fetching leaderboard:', err);
            setIsLoading(false);
        }
    };

    // 2) Fetch current user’s data (profile + scoreboard)
    const fetchCurrentUser = async () => {
        try {
            const userId = await AsyncStorage.getItem('userId');
            if (!userId) return;
            const response = await axios.get(`${ENV.API_URL}/api/auth/full-profile/${userId}/`);
            setCurrentUser(response.data);
            console.log('current user: ', response.data)

        } catch (err) {
            console.error('Error fetching current user:', err);
        }
    };

    // Separate the top 3 into a "podium", the rest into "rest"
    const podium = leaderboardData.slice(0, 3);
    const rest = leaderboardData.slice(3);

    if (isLoading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#000" />
            </SafeAreaView>
        );
    }

    // Helper to show either a profile image or initials
    const renderProfileImage = (profileImage, name) => {
        if (profileImage) {
            return <Image source={{ uri: profileImage }} style={styles.profileImage} />;
        } else {
            const initials = name ? name.charAt(0) : '?';
            return (
                <View style={styles.profilePlaceholder}>
                    <Text style={styles.profilePlaceholderText}>{initials.toUpperCase()}</Text>
                </View>
            );
        }
    };

    // For ranks 4th onward in the FlatList
    const renderListItem = ({ item, index }) => {
        const displayRank = index + 4; // e.g. 04,05,06...
        const name = item.user.first_name;

        return (
            <View style={styles.leaderboardRow}>
                <Text style={styles.rankText}>
                    {displayRank < 10 ? `0${displayRank}` : displayRank}
                </Text>
                {renderProfileImage(item.user.profile_image, name)}
                <View style={{ marginLeft: 12 }}>
                    <Text style={styles.userNameText}>{name}</Text>
                    <Text style={styles.userScoreText}>{item.weekly_score} Points</Text>
                </View>
            </View>
        );
    };

    // Because you asked for the "exact same box" from the previous screen:
    const getUserInitials = () => {
        if (!currentUser) return '';
        const first = currentUser?.first_name?.charAt(0) || '';
        const last = currentUser?.last_name?.charAt(0) || '';
        return (first + last).toUpperCase();
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
                {/* Top header: back button + title */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" size={24} color="black" />
                    </TouchableOpacity>
                    <Text style={styles.headingText}>Weekly leaderboard</Text>
                </View>

                {/* Leaderboard box from previous page */}
                <View style={styles.leaderboardOverviewContainer}>
                    {/* <Text style={styles.leaderboardTitle}>Weekly Leaderboard</Text> */}
                    <View style={styles.leaderboardResults}>
                        <View style={styles.profileBox}>
                            {currentUser?.user?.profile_image ? (
                                <Image
                                    style={[styles.profileImage, { marginRight: 0 }]}
                                    source={{ uri: currentUser?.user?.profile_image }}
                                />
                            ) : (
                                <View style={styles.initialsContainer}>
                                    <Text style={styles.initialsText}>{getUserInitials()}</Text>
                                </View>
                            )}
                            <Text style={styles.nameText}>
                                {currentUser?.user?.first_name ?? 'User'}
                            </Text>
                        </View>
                        {/* Weekly Score */}
                        <View style={styles.pointsBox}>
                            <Text style={styles.leaderboardSubTitle}>WEEKLY</Text>
                            <Text style={styles.leaderboardScore}>
                                {currentUser?.stats?.leaderboard?.weekly_score ?? '...'}
                            </Text>
                        </View>
                        {/* Weekly Rank */}
                        <View style={styles.pointsBox}>
                            <Text style={styles.leaderboardSubTitle}>RANK</Text>
                            <Text style={styles.leaderboardScore}>
                                {currentUser?.stats?.ranks?.weekly_rank ?? '...'}
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward-outline" color={'black'} size={0} />
                    </View>
                </View>

                {/* 2. Podium: top 3 users */}

                <View style={styles.mainTableContainer}>
                    <View style={styles.podiumContainer}>
                        {podium.map((item, idx) => {
                            const rankPosition = idx + 1;
                            const name = item.user.first_name;
                            return (
                                <View key={item.user.id} style={styles.podiumSlot}>
                                    {renderProfileImage(item.user.profile_image, name)}
                                    <Text style={styles.podiumName}>{name}</Text>
                                    <Text style={styles.podiumPoints}>{item.weekly_score} Points</Text>
                                    <View style={[
                                        styles.rankBadge,
                                        rankPosition === 1 && styles.firstPlace,
                                        rankPosition === 2 && styles.secondPlace,
                                        rankPosition === 3 && styles.thirdPlace
                                    ]}>
                                        <Text style={styles.rankBadgeText}>{rankPosition}</Text>
                                    </View>
                                </View>
                            );
                        })}
                    </View>

                    {/* 3. The rest of the leaderboard (4th place onward) */}
                    <FlatList
                        data={rest}
                        keyExtractor={(item) => String(item.user.id)}
                        renderItem={renderListItem}
                        scrollEnabled={false}
                    />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    // general container
    container: {
        flex: 1,
        backgroundColor: '#F8F5FE',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    // top header
    header: {
        paddingLeft: 20,
        paddingRight: 20,
        paddingTop: 20,
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'black',
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    headingText: {
        fontSize: 20,
        fontWeight: '600',
        color: 'black',
        marginLeft: 10,
    },
    // the "exact same box"
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
    profileImage: {
        width: 50,
        height: 50,
        borderRadius: 10,
    },
    initialsContainer: {
        width: 50,
        height: 50,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFE0E1',
        borderWidth: 1,
    },
    profilePlaceholder: {
        width: 50,
        height: 50,
        borderRadius: 10,
        // marginRight: 15,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#EFE8FF',
        borderWidth: 1,
    },
    initialsText: {
        fontSize: 18,
        fontWeight: 600,
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
        marginBottom: 5,
    },
    leaderboardScore: {
        fontSize: 16,
        fontWeight: 600,
    },
    // podium
    podiumContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginHorizontal: 16,
        marginBottom: 16,
    },
    podiumSlot: {
        alignItems: 'center',
        width: 80,
    },
    podiumName: {
        marginTop: 6,
        fontSize: 14,
        fontWeight: '600',
    },
    podiumPoints: {
        fontSize: 12,
        color: '#777',
    },
    rankBadge: {
        marginTop: 4,
        paddingVertical: 2,
        paddingHorizontal: 6,
        borderRadius: 12,
        backgroundColor: '#ccc',
    },
    rankBadgeText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#fff',
    },
    firstPlace: {
        backgroundColor: 'gold',
    },
    secondPlace: {
        backgroundColor: 'silver',
    },
    thirdPlace: {
        backgroundColor: '#D4A373',
    },
    // listing ranks 4 onward
    leaderboardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 16,
        marginBottom: 12,
        borderBottomWidth: 0.5,
        borderBottomColor: '#ddd',
        paddingBottom: 8,
    },
    rankText: {
        width: 30,
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'right',
        marginRight: 10,
    },
    userNameText: {
        fontSize: 14,
        fontWeight: '500',
    },
    userScoreText: {
        fontSize: 12,
        color: '#777',
    },
    mainTableContainer: {
        marginLeft: 20,
        marginRight: 20,
        paddingTop: 20,
        borderRadius: 20,
        borderTopWidth: 1,
        borderLeftWidth: 1,
        borderRightWidth: 4,
        borderBottomWidth: 4,
        // backgroundColor: '#D6F7F4',
    },
});
