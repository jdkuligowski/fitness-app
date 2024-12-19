import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, Image, TouchableOpacity, StatusBar, SafeAreaView, Modal,
    TextInput, Keyboard, TouchableWithoutFeedback, ScrollView, Alert, FlatList, Dimensions, RefreshControl
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



export default function SupportOverview() {
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

    return (

        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor="#F6F3DC" />
            <View style={styles.supportPageContainer}>
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
                                <Text style={styles.subHeadingText}>Support</Text>
                            </View>
                        </View>
                        <TouchableOpacity style={styles.profileButton}>
                            <Ionicons name="notifications-outline" color={'black'} size={20} />
                        </TouchableOpacity>
                    </View>
                </View>
                <View style={styles.supportContent}>
                    <TouchableOpacity style={styles.supportRow}>

                        <View style={styles.supportLeft}>
                            <View
                                style={[
                                    styles.supportIconContainer,
                                    { backgroundColor: '#E0DCF6' }
                                ]}>
                                <Ionicons name="chatbox-ellipses-outline" color={'black'} size={20} />
                            </View>
                            <Text style={styles.supportText}>Chat with us</Text>
                        </View>
                        <Ionicons name="chevron-forward-outline" color={'black'} size={20} />

                    </TouchableOpacity>
                    <View style={styles.divider}></View>
                    <TouchableOpacity style={styles.supportRow}>

                        <View style={styles.supportLeft}>
                            <View
                                style={[
                                    styles.supportIconContainer,
                                    { backgroundColor: '#D6F7F4' }
                                ]}>
                                <Ionicons name="videocam-outline" color={'black'} size={20} />
                            </View>
                            <Text style={styles.supportText}>Videos</Text>
                        </View>
                        <Ionicons name="chevron-forward-outline" color={'black'} size={20} />

                    </TouchableOpacity>
                    <View style={styles.divider}></View>

                    <TouchableOpacity style={styles.supportRow}>

                        <View style={styles.supportLeft}>
                            <View
                                style={[
                                    styles.supportIconContainer,
                                    { backgroundColor: '#FFE0E1' }
                                ]}>
                                <Ionicons name="help-circle-outline" color={'black'} size={20} />
                            </View>
                            <Text style={styles.supportText}>FAQs</Text>
                        </View>
                        <Ionicons name="chevron-forward-outline" color={'black'} size={20} />

                    </TouchableOpacity>
                    <View style={styles.divider}></View>

                    <TouchableOpacity style={styles.supportRow}>

                        <View style={styles.supportLeft}>
                            <View
                                style={[
                                    styles.supportIconContainer,
                                    { backgroundColor: '#F8FAE4' }
                                ]}>
                                <Ionicons name="cog-outline" color={'black'} size={20} />
                            </View>
                            <Text style={styles.supportText}>Account settings</Text>
                        </View>
                        <Ionicons name="chevron-forward-outline" color={'black'} size={20} />

                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>

    )
}



const styles = StyleSheet.create({

    safeArea: {
        flex: 1,
        backgroundColor: '#FFF4F4', // Match the header background color
    },
    supportPageContainer: {
        flexGrow: 1,
        backgroundColor: '#F3F3FF',
    },
    header: {
        padding: 20,
        backgroundColor: '#FFF4F4',
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
    },
    subHeadingText: {
        fontSize: 16,
        width: '100%',
        fontWeight: 'bold',
        marginTop: 2,
        marginBottom: 2,
        marginLeft: 10,
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
    supportContent: {
        backgroundColor: 'white',
        marginHorizontal: 20,
        marginTop: 20,
        paddingHorizontal: 20,
        paddingVertical: 30,
        height: 500,
        borderRadius: 20,
        borderTopWidth: 1,
        borderLeftWidth: 1,
        borderRightWidth: 4,
        borderBottomWidth: 4,
    },
    supportRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 15,
        marginTop: 15,
    },
    supportLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    supportIconContainer: {
        padding: 15,
        marginRight: 10,
        borderRadius: 10,
        borderWidth: 1,
    },
    supportText: {
        fontSize: 16,
        fontWeight: 700,
    },
    divider: {
        height: 1,
        backgroundColor: '#ddd',
        width: 230,
        marginLeft: 60,
    },
})