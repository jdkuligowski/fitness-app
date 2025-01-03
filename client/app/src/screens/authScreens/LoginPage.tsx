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
import ENV from '../../../../env'
import { Colours } from '../../components/styles';


export default function LoginPage() {
    const navigation = useNavigation();
    const { setIsAuthenticated } = useAuth(); // Access context here

    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async () => {
        const { email, password } = formData;
    
        if (!email || !password) {
            Alert.alert('Error', 'Please fill out all fields.');
            return;
        }
    
        try {
            const response = await axios.post(`${ENV.API_URL}/api/auth/login/`, { email, password });
            const { token, user_id } = response.data; // Ensure the backend sends `user_id`
    
            // Save token and user_id
            await AsyncStorage.setItem('token', token);
            await AsyncStorage.setItem('userId', String(user_id));
            console.log('user id logged in ->', user_id)
    
            Alert.alert('Login Successful', 'You have logged in successfully!');
            setIsAuthenticated(true);
        } catch (error) {
            console.error('Login error:', error.message);
            if (error.response) {
                Alert.alert('Login Failed', error.response.data.detail || 'Invalid credentials');
            } else {
                Alert.alert('Error', 'An unexpected error occurred. Please try again.');
            }
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
                            <View style={styles.imageContainer}>
                                <Image
                                    style={styles.brandImage}
                                    source={require('../../../../assets/images/burst_logo.png')} // Replace with your actual image path
                                />
                            </View>
                            <View style={styles.inputContainer}>
                                {['Email', 'Password'].map(
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
                                                        [label.toLowerCase().replace(' ', '_')]: text,
                                                    })
                                                }
                                            />
                                        </View>
                                    )
                                )}
                            </View>
                            <View style={styles.line} />
                            <Text style={styles.loginText}>
                                Don't have an account?{' '}
                                <Text
                                    style={styles.loginButton}
                                    onPress={() => navigation.navigate('Register')}
                                >
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
        backgroundColor: Colours.primaryBackground, // Background color for the entire screen
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