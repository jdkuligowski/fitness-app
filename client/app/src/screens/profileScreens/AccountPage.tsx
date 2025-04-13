import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, Image, TouchableOpacity, StatusBar, SafeAreaView, Modal, Platform,
    TextInput, Keyboard, TouchableWithoutFeedback, ScrollView, Alert, FlatList, Dimensions, RefreshControl, KeyboardAvoidingView
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



export default function AccountOverview({ route }) {
    const { first_name, last_name, email } = route.params; // 👈 Receive params from ProfileOverview
    const navigation = useNavigation();
    const { setIsBouncerLoading, isBouncerLoading } = useLoader(); // Access loader functions

    // State to hold form values
    const [firstName, setFirstName] = useState(first_name);
    const [lastName, setLastName] = useState(last_name);
    const [userEmail, setUserEmail] = useState(email);

    const handleSave = async () => {
        setIsBouncerLoading(true);
        const userId = await AsyncStorage.getItem('userId'); // Get the user ID

        try {
            const response = await axios.put(`${ENV.API_URL}/api/auth/update-profile/${userId}/`, {
                first_name: firstName,
                last_name: lastName,
                email: userEmail,
            });

            Alert.alert('Success', 'Profile updated successfully!');
            // navigation.goBack(); 
        } catch (error) {
            Alert.alert('Error', 'An error occurred while updating your profile. Please try again.');
            console.error('Error updating profile:', error);
        } finally {
            setIsBouncerLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor="#F6F3DC" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.flex}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <ScrollView contentContainerStyle={styles.scrollContainer}>
                        <View style={styles.profilePageContainer}>
                            <View style={styles.header}>
                                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                                    <Ionicons name="arrow-back" size={24} color="black" />
                                </TouchableOpacity>
                                <Text style={styles.headingText}>Account</Text>
                            </View>

                            <View style={styles.inputContainer}>
                                <View style={styles.inputBlock}>
                                    <Text style={styles.title}>First Name</Text>
                                    <TextInput
                                        style={styles.inputBox}
                                        value={firstName}
                                        onChangeText={(text) => setFirstName(text)}
                                        placeholder="Enter First Name"
                                        placeholderTextColor="#999"
                                    />
                                </View>
                                <View style={styles.inputBlock}>
                                    <Text style={styles.title}>Last Name</Text>
                                    <TextInput
                                        style={styles.inputBox}
                                        value={lastName}
                                        onChangeText={(text) => setLastName(text)}
                                        placeholder="Enter Last Name"
                                        placeholderTextColor="#999"
                                    />
                                </View>
                                <View style={styles.inputBlock}>
                                    <Text style={styles.title}>Email</Text>
                                    <TextInput
                                        style={styles.inputBox}
                                        value={userEmail}
                                        onChangeText={(text) => setUserEmail(text)}
                                        placeholder="Enter Email"
                                        keyboardType="email-address"
                                        placeholderTextColor="#999"
                                    />
                                </View>

                                <View style={styles.buttonContainer}>
                                    <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                                        <Text style={styles.saveButtonText}>Save</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
{/* 
                            <View style={styles.additionalActions}>
                                <TouchableOpacity style={styles.row}>
                                    <View style={styles.rowLeft}>
                                        <View style={[styles.iconContainer, { backgroundColor: Colours.primaryBackground }]}>
                                            <Ionicons name="lock-closed-outline" color={'black'} size={20} />
                                        </View>
                                        <Text style={styles.actionTitle}>Change password</Text>
                                    </View>
                                    <Ionicons name="chevron-forward-outline" color={'black'} size={20} />
                                </TouchableOpacity>
                                <View style={styles.divider}></View>

                                <TouchableOpacity style={styles.row}>
                                    <View style={styles.rowLeft}>
                                        <View style={[styles.iconContainer, { backgroundColor: Colours.primaryBackground }]}>
                                            <Ionicons name="lock-closed-outline" color={'black'} size={20} />
                                        </View>
                                        <Text style={styles.actionTitle}>Delete account</Text>
                                    </View>
                                    <Ionicons name="chevron-forward-outline" color={'black'} size={20} />
                                </TouchableOpacity>
                            </View> */}
                        </View>
                    </ScrollView>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </SafeAreaView>

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
    inputContainer: {
        margin: 20,
    },
    inputBlock: {
        width: '100%',
        marginTop: 0,
        marginBottom: 30,
    },
    title: {
        fontSize: 14,
        color: '#7B7C8C',
        fontWeight: 600,
        marginBottom: 5,
    },
    inputBox: {
        backgroundColor: 'white',
        borderColor: '#A9A9C7',
        borderWidth: 1,
        padding: 15,
        borderRadius: 16,
    },
    buttonContainer: {
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    saveButton: {
        backgroundColor: Colours.buttonColour,
        padding: 15,
        width: '80%',
        borderRadius: 30,
    },
    saveButtonText: {
        color: 'white',
        textAlign: 'center',
        fontWeight: 700,
        fontSize: 16,
    },
    additionalActions: {
        margin: 20,
        // flexDirection: 'row',
        // justifyContent: 'space-between',
        // alignItems: 'center',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    rowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        padding: 15,
        marginRight: 20,
        borderRadius: 10,
        borderWidth: 1,
        backgroundColor: Colours.secondaryColour,
    },
    actionTitle: {
        fontSize: 18,
        fontWeight: 600,
    },
    divider: {
        height: 1,
        backgroundColor: '#ddd',
        width: 230,
        marginLeft: 60,
        marginVertical: 20,
    },
});
