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
import { useAuth } from '../../context/AuthContext'
import { format, addWeeks, startOfWeek, endOfWeek } from 'date-fns';
import { useLoader } from '@/app/src/context/LoaderContext';
import ENV from '../../../../env'
import * as ImagePicker from 'expo-image-picker';
import { Colours } from '../../components/styles';



export default function ProfileOverview() {
    const navigation = useNavigation();
    const [userData, setUserData] = useState('')
    const { setIsAuthenticated } = useAuth();
    const { setIsBouncerLoading, isBouncerLoading } = useLoader(); // Access loader functions

    const [profileImage, setProfileImage] = useState(null);

    // fetch user data function
    const getUser = async () => {
        try {
            setIsBouncerLoading(true)
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
            setIsBouncerLoading(false)

        } catch (error) {
            console.error('Error fetching user data:', error?.response?.data || error.message);
            setIsBouncerLoading(false)
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


    const handleLogout = async () => {
        try {
            // Clear the authentication token
            await AsyncStorage.removeItem('token');
            setIsAuthenticated(false);

            //   // 🔥 Reset the navigation stack to the login screen
            //   navigation.reset({
            //     index: 0,
            //     routes: [{ name: 'AuthStack' }],
            //   });

        } catch (error) {
            console.error('Error logging out:', error.message);
            Alert.alert('Error', 'An error occurred while logging out. Please try again.');
        }
    };



    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });

        if (!result.canceled) {
            const formData = new FormData();
            formData.append('file', {
                uri: result.assets[0].uri,
                name: 'profile.jpg',
                type: 'image/jpeg'
            });

            try {
                setIsBouncerLoading(true)

                const userId = await AsyncStorage.getItem('userId');
                formData.append('user_id', userId);

                const response = await axios.post(`${ENV.API_URL}/api/auth/profile/upload-image/`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                console.log('Image uploaded successfully', response.data);

                getUser()
                setIsBouncerLoading(false)

                Alert.alert('Success', 'Profile image uploaded successfully!');

            } catch (error) {
                console.error('Error uploading image:', error);
                setIsBouncerLoading(false)

            }
        }
    };



    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor="#F6F3DC" />
            <View style={styles.profilePageContainer}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="black" />
                    </TouchableOpacity>
                    <Text style={styles.headingText}>Profile</Text>
                </View>
                <View style={styles.coreUserDetails}>
                    <TouchableOpacity onPress={pickImage}>
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
                    <View style={styles.userInfo}>
                        <Text style={styles.userName}>{userData.first_name} {userData.last_name}</Text>
                        <Text style={styles.userEmail}>{userData.email}</Text>
                    </View>

                </View>

                <View style={styles.supportContent}>
                    <TouchableOpacity
                        style={styles.supportRow}
                        onPress={() => navigation.navigate('AccountPage', {
                            first_name: userData.first_name,
                            last_name: userData.last_name,
                            email: userData.email
                        })}
                    >
                        <View style={styles.supportLeft}>
                            <View
                                style={[
                                    styles.supportIconContainer,
                                    { backgroundColor: Colours.secondaryColour }
                                ]}>
                                <Ionicons name="person-outline" color={'black'} size={20} />
                            </View>
                            <Text style={styles.supportText}>Account</Text>
                        </View>
                        <Ionicons name="chevron-forward-outline" color={'black'} size={20} />

                    </TouchableOpacity>
                    <View style={styles.divider}></View>
                    <TouchableOpacity style={styles.supportRow} onPress={() => navigation.navigate("PreferencesPage", {
                        userData: userData,
                    })}>
                    <View style={styles.supportLeft}>
                        <View
                            style={[
                                styles.supportIconContainer,
                                { backgroundColor: Colours.secondaryColour }
                            ]}>
                            <Ionicons name="id-card-outline" color={'black'} size={20} />
                        </View>
                        <Text style={styles.supportText}>Personal information</Text>
                    </View>
                    <Ionicons name="chevron-forward-outline" color={'black'} size={20} />

                </TouchableOpacity>
                <View style={styles.divider}></View>


                <TouchableOpacity
                    style={styles.supportRow}
                    onPress={handleLogout}
                    activeOpacity={0.7} // 🔥 Provides feedback on press
                >
                    <View style={styles.supportLeft}>
                        <View style={[styles.supportIconContainer, { backgroundColor: Colours.secondaryColour }]}>
                            <Ionicons name="log-out-outline" color={'black'} size={20} />
                        </View>
                        <Text style={styles.supportText}>Logout</Text>
                    </View>
                    <Ionicons name="chevron-forward-outline" color={'black'} size={20} />
                </TouchableOpacity>
            </View>
        </View>
        </SafeAreaView >

    )
}



const styles = StyleSheet.create({

    safeArea: {
        flex: 1,
        backgroundColor: Colours.primaryBackground,
    },
    profilePageContainer: {
        flexGrow: 1,
        backgroundColor: Colours.primaryBackground,
    },
    header: {
        padding: 20,
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
    coreUserDetails: {
        marginHorizontal: 20,
        marginTop: 10,
        marginBottom: 20,
        flexDirection: 'row',
        alignItems: 'center',
    },
    profileImage: {
        width: 55,
        height: 55,
        borderRadius: 10,
        marginRight: 15,
        borderTopWidth: 1,
        borderLeftWidth: 1,
        borderRightWidth: 4,
        borderBottomWidth: 4,
    },
    initialsContainer: {
        width: 55,
        height: 55,
        borderRadius: 10,
        marginRight: 15,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colours.secondaryColour,
        borderTopWidth: 1,
        borderLeftWidth: 1,
        borderRightWidth: 4,
        borderBottomWidth: 4,
    },
    initialsText: {
        fontSize: 18,
        fontWeight: 600,
    },
    userName: {
        fontSize: 16,
        fontWeight: 600,
        marginBottom: 5,
    },
    supportContent: {
        backgroundColor: 'white',
        marginHorizontal: 20,
        marginTop: 0,
        paddingHorizontal: 20,
        paddingVertical: 30,
        height: 400,
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
});
