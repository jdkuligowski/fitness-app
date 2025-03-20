import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import {
    View, Text, StyleSheet, Alert, SafeAreaView, TouchableOpacity, TextInput,
    KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard, Platform, ScrollView, Image
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';
import Ionicons from "@expo/vector-icons/Ionicons";
import ENV from '../../../../env';
import { Colours } from '../../components/styles';

export default function LoginPage() {
    const navigation = useNavigation();
    const { setIsAuthenticated, setIsOnboardingComplete } = useAuth();

    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    const [isPasswordVisible, setIsPasswordVisible] = useState(false); // State for password visibility
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async () => {
        const { email, password } = formData;

        if (!email || !password) {
            Alert.alert('Error', 'Please fill out all fields.');
            return;
        }

        try {
            await AsyncStorage.removeItem('is_onboarding_complete');
            await AsyncStorage.removeItem('activeEquipmentFilter');
            const response = await axios.post(`${ENV.API_URL}/api/auth/login/`, { email, password });
            const { token, user_id, is_onboarding_complete } = response.data;
            await AsyncStorage.setItem('token', token);
            await AsyncStorage.setItem('userId', String(user_id));
            await AsyncStorage.setItem('is_onboarding_complete', is_onboarding_complete ? 'true' : 'false');
            // console.log('Login data: ', response.data)
            // console.log('Login onboarding bit: ', is_onboarding_complete)
            setIsOnboardingComplete(is_onboarding_complete);

            Alert.alert('Login Successful', 'You have logged in successfully!');
            setIsAuthenticated(true);
        } catch (error) {
            console.error('Login error:', error.message);

            if (error.response) {
                const { detail } = error.response.data;

                if (detail === 'No account found with that email') {
                    Alert.alert('Login Failed', 'No account exists with this email.');
                } else if (detail === 'Incorrect password') {
                    Alert.alert('Login Failed', 'The password you entered is incorrect.');
                } else {
                    Alert.alert('Login Failed', detail || 'Invalid credentials. Please check your details and try again.');
                }
            } else {
                Alert.alert('Error', 'An unexpected error occurred.');
            }
        }
    };

    return (
        <SafeAreaView style={styles.landingSafeArea}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <ScrollView contentContainerStyle={styles.scrollViewContainer} keyboardShouldPersistTaps="handled">
                        <View style={styles.registerContainer}>
                            <View style={styles.imageContainer}>
                                <Image
                                    style={styles.brandImage}
                                    source={require('../../../../assets/images/burst_logo.png')}
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                {/* Email Input */}
                                <View style={styles.inputBlock}>
                                    <Text style={styles.title}>Email</Text>
                                    <TextInput
                                        style={styles.inputBox}
                                        placeholder="Email"
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        onChangeText={(text) => setFormData({ ...formData, email: text })}
                                    />
                                </View>

                                {/* Password Input with Visibility Toggle */}
                                <View style={styles.inputBlock}>
                                    <Text style={styles.title}>Password</Text>
                                    <View style={styles.passwordWrapper}>
                                        <TextInput
                                            style={styles.inputBoxPassword}
                                            placeholder="Password"
                                            secureTextEntry={!isPasswordVisible}
                                            autoCapitalize="none"
                                            onChangeText={(text) => setFormData({ ...formData, password: text })}
                                        />
                                        <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
                                            <Ionicons
                                                name={isPasswordVisible ? "eye-off" : "eye"}
                                                size={24}
                                                color="black"
                                            />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.line} />

                            <Text style={styles.loginText}>
                                Don't have an account?{' '}
                                <Text style={styles.loginButton} onPress={() => navigation.navigate('Register')}>
                                    Register now
                                </Text>
                            </Text>

                            <TouchableOpacity style={styles.registerButton} onPress={handleLogin}>
                                <Text style={styles.registerText}>Login</Text>
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
        backgroundColor: Colours.primaryBackground,
    },
    registerContainer: {
        padding: 20,
    },
    imageContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    brandImage: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollViewContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingBottom: 20,
    },
    inputBlock: {
        width: '100%',
        marginTop: 0,
        marginBottom: 20,
    },
    title: {
        fontSize: 14,
        color: '#7B7C8C',
        fontWeight: '600',
        marginBottom: 5,
    },
    inputBox: {
        backgroundColor: 'white',
        borderColor: '#A9A9C7',
        borderWidth: 1,
        padding: 12,
        borderRadius: 16,
    },
    passwordWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderColor: '#A9A9C7',
        borderWidth: 1,
        padding: 12,
        borderRadius: 16,
    },
    inputBoxPassword: {
        flex: 1,
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
        fontWeight: '600',
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
});

