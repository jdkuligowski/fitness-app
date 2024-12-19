import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import {
    View, Text, StyleSheet, Alert, SafeAreaView, TouchableOpacity, TextInput,
    KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard, Platform, ScrollView
} from 'react-native';
import axios from 'axios';
import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';
import ENV from '../../../../env'

export default function RegisterPage() {
    const navigation = useNavigation();
    const { setIsAuthenticated } = useAuth(); // Access context here

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });
    const [isLoading, setIsLoading] = useState(false);

    const handleRegister = async () => {
        const { first_name, last_name, email, password, password_confirmation } = formData;

        // Frontend validation
        if (!first_name || !last_name || !email || !password || !password_confirmation) {
            Alert.alert('Error', 'Please fill out all fields.');
            return;
        }

        if (password !== password_confirmation) {
            Alert.alert('Error', 'Passwords do not match!');
            return;
        }

        setIsLoading(true);
        try {
            // Register the user
            const registerResponse = await axios.post(`${ENV.API_URL}/api/auth/register/`, formData);
            console.log('Registration successful:', registerResponse.data);

            // Automatically log the user in
            const loginResponse = await axios.post(`${ENV.API_URL}/api/auth/login/`, {
                email,
                password,
            });
            const { token, user_id } = loginResponse.data; // Ensure the backend sends `user_id`

            // Save token and update state
            await AsyncStorage.setItem('token', token);
            await AsyncStorage.setItem('userId', String(user_id));

            setIsAuthenticated(true);

            Alert.alert('Login Successful', 'You have logged in successfully!');
            // navigation.reset({
            //     index: 0,
            //     routes: [{ name: 'Home' }],
            // });
        } catch (error) {
            console.error('Error during registration or login:', error.message);
            if (error.response) {
                Alert.alert('Error', error.response.data.message || 'An error occurred.');
            } else {
                Alert.alert('Error', 'An unexpected error occurred. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <SafeAreaView style={styles.landingSafeArea}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <ScrollView
                        contentContainerStyle={styles.scrollViewContainer}
                        keyboardShouldPersistTaps="handled"
                    >
                        <View style={styles.registerContainer}>
                            <Text style={styles.signUpText}>Sign up</Text>
                            <View style={styles.googleSignup}>
                                <Text style={styles.googleSignupText}>Sign up with Google</Text>
                            </View>
                            <View style={styles.divider}>
                                <View style={styles.line} />
                                <Text style={styles.orText}>OR</Text>
                                <View style={styles.line} />
                            </View>
                            <View style={styles.inputContainer}>
                                {['First name', 'Last name', 'Email', 'Password', 'Password confirmation'].map(
                                    (label, idx) => (
                                        <View key={idx} style={styles.inputBlock}>
                                            <Text style={styles.title}>{label}</Text>
                                            <TextInput
                                                style={styles.inputBox}
                                                placeholder={label}
                                                secureTextEntry={label.toLowerCase().includes('password')}
                                                keyboardType={label === 'Email' ? 'email-address' : 'default'}
                                                onChangeText={(text) =>
                                                    setFormData({
                                                        ...formData,
                                                        [label.toLowerCase().replace(' ', '_')]:
                                                            label === 'Email' ? text.toLowerCase() : text,
                                                    })
                                                }
                                            />
                                        </View>
                                    )
                                )}
                            </View>
                            <View style={styles.line} />
                            <Text style={styles.loginText}>
                                Already have an account?{' '}
                                <Text
                                    style={styles.loginButton}
                                    onPress={() => navigation.navigate('Login')}
                                >
                                    Login
                                </Text>
                            </Text>
                            <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
                                <Text style={styles.registerText}>Create account</Text>
                                <View style={styles.registerArrow}>
                                    <Ionicons name="arrow-forward" size={24} color="black" />
                                </View>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}


const styles = StyleSheet.create({
    landingSafeArea: {
        fontFamily: 'sora',
        flex: 1,
        backgroundColor: '#F3F3FF', // Background color for the entire screen
    },
    registerContainer: {
        padding: 20,
    },
    scrollViewContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingBottom: 20,
    },
    signUpText: {
        fontSize: 30,
        fontWeight: 700,
        marginTop: 20,
        marginBottom: 20,
    },
    googleSignup: {
        width: '100%',
        backgroundColor: 'white',
        borderColor: '#A9A9C7',
        borderWidth: 1,
        padding: 15,
        borderRadius: 16,
    },
    googleSignupText: {
        textAlign: 'center',
        color: 'grey',
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 20,
    },
    line: {
        flex: 1,
        height: 1,
        backgroundColor: '#ddd',
    },
    orText: {
        marginHorizontal: 10,
        color: '#aaa',
    },
    inputBlock: {
        width: '100%',
        marginTop: 0,
        marginBottom: 20,
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
        padding: 12,
        borderRadius: 16,
    },
    registerButton: {
        backgroundColor: 'black',
        flexDirection: 'row',
        width: '100%',
        padding: 5,
        borderRadius: 20,
        alignItems: 'center',
        borderWidth: 1,
        marginTop: 20,

    },
    registerArrow: {
        backgroundColor: 'white',
        padding: 5,
        borderRadius: 20,
        marginLeft: -32,
    },
    registerText: {
        color: 'white',
        width: '100%',
        textAlign: 'center',
        fontSize: 16,
        fontWeight: 600,
    },
    loginText: {
        textAlign: 'center',
        color: '#7B7C8C',
        marginTop: 10,
        marginBottom: 10,
    },
    loginButton: {
        color: '#9BB0E2',
    },
})