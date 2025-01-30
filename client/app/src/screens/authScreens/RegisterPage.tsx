import React, { useState, useEffect } from 'react';
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
import { Colours } from '../../components/styles';
import * as Google from "expo-auth-session/providers/google";
import { GOOGLE_CLIENT_ID } from "../../../../constants/constants"; // Import your Client ID
import { AntDesign } from '@expo/vector-icons'; // Google icon
import * as AuthSession from "expo-auth-session";
import * as Crypto from "expo-crypto"; // ✅ Import Crypto for secure random nonce

export default function RegisterPage() {
    console.log('google id: ', GOOGLE_CLIENT_ID)
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
    const generateNonce = async () => {
        return await Crypto.digestStringAsync(
            Crypto.CryptoDigestAlgorithm.SHA256,
            Math.random().toString()
        );
    };

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


    const initializeAuthUrl = async () => {
        const nonce = await generateNonce();
        console.log("🔑 Generated Nonce:", nonce);

        const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent("https://auth.expo.io/@jdkuligowski/burst-slug")}&response_type=id_token&scope=profile email&nonce=${nonce}`;

        console.log("🔗 Open this OAuth URL in a browser:", oauthUrl);
    };

    useEffect(() => {
        initializeAuthUrl();
    }, []);


    const [request, response, promptAsync] = Google.useAuthRequest({
        clientId: '24607396442-dnmcl2dmkh874bt29d73jdp0khmj1ceb.apps.googleusercontent.com',
        scopes: ["profile", "email"],
        responseType: "id_token",
        redirectUri: "https://auth.expo.io/@jdkuligowski/burst-slug", // ✅ Explicitly set web redirect
    });

    // // ✅ Generate the nonce and attach it to the request
    useEffect(() => {
        const setNonce = async () => {
            const nonce = await generateNonce();
            console.log("🔑 Generated Nonce:", nonce);

            if (request) {
                request.extraParams = { nonce }; // ✅ Attach nonce
            }
        };

        setNonce();
    }, [request]);

    // ✅ Manually trigger Google sign-in only when the button is pressed
    const handleGoogleSignIn = async () => {
        console.log("🚀 Google Sign-In Button Pressed");

        if (!request) {
            console.error("❌ Google Auth Request is null");
            Alert.alert("Google Sign-In Failed", "Request is null. Try restarting Expo.");
            return;
        }

        console.log("🚀 Opening Google Sign-In in Browser...");
        const result = await promptAsync();

        console.log("✅ Google Sign-In Result:", result);
        console.log("🔄 useEffect triggered, response:", response);


        if (!result) {
            console.error("❌ Google Sign-In failed: No result object");
            return;
        }

        if (result.type === "success") {
            console.log("🎉 Google Sign-In Successful! ID Token:", result.params?.id_token);

            // ✅ Manually process the token
            if (result.params?.id_token) {
                registerWithGoogle(result.params.id_token);
            } else {
                console.error("❌ No ID Token found in result.");
                Alert.alert("Google Sign-In Failed", "No ID Token received.");
            }
        } else {
            console.error("❌ Google Sign-In Error Type:", result.type);
        }
    };




    // ✅ Handle Google Sign-In Response when it updates
    useEffect(() => {
        console.log("🔄 useEffect triggered, response:", response);

        if (!response) {
            console.log("⚠ No response received yet");
            return;
        }

        if (response?.type === "success") {
            console.log("✅ Google Sign-In Success:", response);

            // ✅ Manually extract the ID Token
            const idToken = response.params?.id_token;
            console.log("🔑 Extracted Google ID Token:", idToken);

            if (idToken) {
                registerWithGoogle(idToken);
            } else {
                console.error("❌ No ID Token found in response.");
                Alert.alert("Google Sign-In Failed", "No ID Token received.");
            }
        } else if (response?.type === "error") {
            console.error("❌ Google Sign-In Error:", response);
            Alert.alert("Google Sign-In Failed", "Please try again.");
        }
    }, [response]);




    // Send Google token to backend for registration
    const registerWithGoogle = async (googleToken) => {
        console.log("🚀 registerWithGoogle called, token:", googleToken);

        try {
            const res = await axios.post(
                `${ENV.API_URL}/api/auth/register/google/`,
                { token: googleToken },
                { headers: { "Content-Type": "application/json" } }
            );
            console.log("✅ Google Sign-Up Response:", res.data);

            if (res.status === 200) {
                await AsyncStorage.setItem("token", res.data.token);
                setIsAuthenticated(true);
                navigation.navigate("Home");
            } else {
                Alert.alert("Google Sign-Up Failed", "Unexpected status code");
            }
        } catch (error) {
            console.error("❌ Google Sign-Up Error:", error);
            Alert.alert("Google Sign-Up Failed", error.response?.data?.error || "Something went wrong.");
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
                            <TouchableOpacity style={styles.googleButton} onPress={handleGoogleSignIn}>
                                <AntDesign name="google" size={24} color="black" />
                                <Text style={styles.googleButtonText}>Sign up with Google</Text>
                            </TouchableOpacity>
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
        backgroundColor: Colours.primaryBackground, // Background color for the entire screen
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
    // googleSignup: {
    //     width: '100%',
    //     backgroundColor: 'white',
    //     borderColor: '#A9A9C7',
    //     borderWidth: 1,
    //     padding: 15,
    //     borderRadius: 16,
    // },
    // googleSignupText: {
    //     textAlign: 'center',
    //     color: 'grey',
    // },
    googleButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "white",
        borderWidth: 1,
        borderColor: "#A9A9C7",
        padding: 12,
        borderRadius: 16,
        justifyContent: "center",
        marginTop: 10,
    },
    googleButtonText: {
        color: "black",
        fontSize: 16,
        fontWeight: "600",
        marginLeft: 10,
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

