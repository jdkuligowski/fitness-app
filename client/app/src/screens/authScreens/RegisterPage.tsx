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
import { useLoader } from '../../context/LoaderContext';
import ENV from '../../../../env'
import { Colours } from '../../components/styles';
import * as Google from "expo-auth-session/providers/google";
import { GOOGLE_CLIENT_ID, IOS_GOOGLE_CLIENT_ID } from "../../../../constants/constants"; // Import your Client ID
import { AntDesign } from '@expo/vector-icons'; // Google icon
import * as AuthSession from "expo-auth-session";
import { makeRedirectUri } from "expo-auth-session";
import * as Crypto from "expo-crypto"; // ✅ Import Crypto for secure random nonce
import OnboardingModal from '../modalScreens/RegistrationModal';
import * as WebBrowser from 'expo-web-browser';

// export default function RegisterPage() {
//     console.log('google id: ', GOOGLE_CLIENT_ID)
//     const navigation = useNavigation();
//     const { setIsAuthenticated, setIsOnboardingComplete } = useAuth(); // Access context here
//     const { setIsBouncerLoading, isBouncerLoading } = useLoader(); // Access context here
//     const [isPasswordVisible, setIsPasswordVisible] = useState(false);
//     const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

//     const [formData, setFormData] = useState({
//         first_name: '',
//         last_name: '',
//         email: '',
//         password: '',
//         password_confirmation: '',
//     });
//     const [isLoading, setIsLoading] = useState(false);

//     const [isOnboardingVisible, setIsOnboardingVisible] = useState(false);


//     console.log('redirect uri: ', makeRedirectUri({ useProxy: false }));


//     const handleRegister = async () => {
//         const { first_name, last_name, email, password, password_confirmation } = formData;

//         // Frontend validation
//         if (!first_name || !last_name || !email || !password || !password_confirmation) {
//             Alert.alert('Error', 'Please fill out all fields.');
//             return;
//         }

//         if (password !== password_confirmation) {
//             Alert.alert('Error', 'Passwords do not match!');
//             return;
//         }

//         setIsBouncerLoading(true);

//         try {
//             setIsOnboardingComplete(false)
//             const registerResponse = await axios.post(`${ENV.API_URL}/api/auth/register/`, formData);
//             console.log('Registration successful:', registerResponse.data);

//             // Automatically log the user in after registration
//             const loginResponse = await axios.post(`${ENV.API_URL}/api/auth/login/`, { email, password });
//             const { token, user_id } = loginResponse.data;

//             // Save token and update authentication state
//             await AsyncStorage.setItem('token', token);
//             await AsyncStorage.setItem('userId', String(user_id));
//             setIsAuthenticated(true);

//             // Trigger onboarding modal
//             setIsOnboardingVisible(true);
//         } catch (error) {
//             console.error('Registration error:', error.message);

//             if (error.response) {
//                 const { detail } = error.response.data;

//                 if (detail === "Invalid email format.") {
//                     Alert.alert('Error', 'Please enter a valid email address.');
//                 } else if (detail === "An account with this email already exists.") {
//                     Alert.alert('Error', 'An account with this email already exists. Please log in or reset your password.');
//                 } else if (detail === "Passwords do not match.") {
//                     Alert.alert('Error', 'Passwords do not match! Please re-enter.');
//                 } else {
//                     Alert.alert('Error', detail || 'An unexpected error occurred. Please try again.');
//                 }
//             } else {
//                 Alert.alert('Error', 'A network issue occurred. Please check your connection and try again.');
//             }
//         } finally {
//             setIsLoading(false);
//             setIsBouncerLoading(false)
//         }
//     };

//     const handleOnboardingComplete = () => {
//         setIsOnboardingVisible(false); // Close the modal
//         navigation.navigate('Home'); // Navigate to the home screen
//     };



//     // 1. Create the Google auth request
//     const [request, response, promptAsync] = Google.useAuthRequest({
//         clientId: GOOGLE_CLIENT_ID,  // Must be the Web client ID
//         scopes: ['profile', 'email'],
//         responseType: 'id_token',
//         // The redirect URI must match the one added in Google Cloud Console
//         redirectUri: 'https://auth.expo.io/@jdkuligowski/burst-slug',
//     });

//     // 2. Generate and attach the nonce to the request once it's available
//     useEffect(() => {
//         const attachNonce = async () => {
//             if (request) {
//                 const nonce = await generateNonce();
//                 console.log('🔑 Generated Nonce:', nonce);
//                 // Attach the nonce to the request's extraParams
//                 request.extraParams = { ...request.extraParams, nonce };
//             }
//         };
//         attachNonce();
//     }, [request]);

//     // 3. Handle the Google response in a single place
//     useEffect(() => {
//         if (!response) return;  // No response yet

//         if (response.type === 'success') {
//             console.log('✅ Google Sign-In Success:', response);
//             const idToken = response.params?.id_token;
//             if (idToken) {
//                 // Pass token to your backend
//                 registerWithGoogle(idToken);
//             } else {
//                 console.error('❌ No ID Token found in response.');
//                 Alert.alert('Google Sign-In Failed', 'No ID Token received.');
//             }
//         } else if (response.type === 'error') {
//             console.error('❌ Google Sign-In Error:', response);
//             Alert.alert('Google Sign-In Failed', 'Please try again.');
//         } else if (response.type === 'cancel') {
//             console.log('❌ Google Sign-In Cancelled by user');
//         }
//     }, [response]);

//     // 4. Function to handle the Sign-In button press
//     const handleGoogleSignIn = async () => {
//         console.log('🚀 Google Sign-In Button Pressed');
//         if (!request) {
//             console.error('❌ Google Auth Request is null');
//             Alert.alert('Google Sign-In Failed', 'Request is null. Try restarting Expo.');
//             return;
//         }
//         // Open the Google Sign-In flow
//         console.log('🚀 Opening Google Sign-In in Browser...');
//         await promptAsync();
//     };

//     // 5. When we get the token, hit the backend
//     const registerWithGoogle = async (googleToken) => {
//         console.log('🚀 registerWithGoogle called, token:', googleToken);
//         try {
//             const res = await axios.post(
//                 `${ENV.API_URL}/api/auth/register/google/`,
//                 { token: googleToken },
//                 { headers: { 'Content-Type': 'application/json' } }
//             );
//             console.log('✅ Google Sign-Up Response:', res.data);

//             if (res.status === 200) {
//                 await AsyncStorage.setItem('token', res.data.token);
//                 setIsAuthenticated(true);
//                 navigation.navigate('Home');
//             } else {
//                 Alert.alert('Google Sign-Up Failed', 'Unexpected status code.');
//             }
//         } catch (error) {
//             console.error('❌ Google Sign-Up Error:', error);
//             Alert.alert('Google Sign-Up Failed', error.response?.data?.error || 'Something went wrong.');
//         }
//     };

//     // Utility function to generate a random nonce
//     const generateNonce = async () => {
//         return await Crypto.digestStringAsync(
//             Crypto.CryptoDigestAlgorithm.SHA256,
//             Math.random().toString()
//         );
//     };

export default function RegisterPage() {
    const navigation = useNavigation();
    const { setIsAuthenticated, setIsOnboardingComplete } = useAuth();
    const { setIsBouncerLoading } = useLoader();
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [isOnboardingVisible, setIsOnboardingVisible] = useState(false);

    console.log('redirect uri: ', makeRedirectUri({ useProxy: true }));

    // For dev: your Web client ID
    // For production iOS: your iOS client ID (from Google Cloud Console)
    const WEB_CLIENT_ID = GOOGLE_CLIENT_ID; // e.g. "1234-abc.apps.googleusercontent.com"
    const IOS_CLIENT_ID = IOS_GOOGLE_CLIENT_ID ; // Replace with the real iOS client ID
    // (Optional) If you want to support standalone Android:
    // const ANDROID_CLIENT_ID = "<YOUR_ANDROID_CLIENT_ID>.apps.googleusercontent.com";

    // --------------------------------------------------------------------------------
    // Registration Flow (email/password)
    // --------------------------------------------------------------------------------
    const handleRegister = async () => {
        const { first_name, last_name, email, password, password_confirmation } = formData;

        // Basic validation
        if (!first_name || !last_name || !email || !password || !password_confirmation) {
            Alert.alert('Error', 'Please fill out all fields.');
            return;
        }
        if (password !== password_confirmation) {
            Alert.alert('Error', 'Passwords do not match!');
            return;
        }

        setIsBouncerLoading(true);

        try {
            setIsOnboardingComplete(false);
            const registerResponse = await axios.post(`${ENV.API_URL}/api/auth/register/`, formData);
            console.log('Registration successful:', registerResponse.data);

            // Auto-login after registration
            const loginResponse = await axios.post(`${ENV.API_URL}/api/auth/login/`, { email, password });
            const { token, user_id } = loginResponse.data;

            // Save token/user ID locally
            await AsyncStorage.setItem('token', token);
            await AsyncStorage.setItem('userId', String(user_id));
            setIsAuthenticated(true);

            // Trigger onboarding modal
            setIsOnboardingVisible(true);

        } catch (error) {
            console.error('Registration error:', error.message);
            if (error.response) {
                const { detail } = error.response.data;
                if (detail === "Invalid email format.") {
                    Alert.alert('Error', 'Please enter a valid email address.');
                } else if (detail === "An account with this email already exists.") {
                    Alert.alert('Error', 'An account with this email already exists. Please log in or reset your password.');
                } else if (detail === "Passwords do not match.") {
                    Alert.alert('Error', 'Passwords do not match! Please re-enter.');
                } else {
                    Alert.alert('Error', detail || 'An unexpected error occurred. Please try again.');
                }
            } else {
                Alert.alert('Error', 'A network issue occurred. Please check your connection and try again.');
            }
        } finally {
            setIsLoading(false);
            setIsBouncerLoading(false);
        }
    };

    const handleOnboardingComplete = () => {
        setIsOnboardingVisible(false);
        navigation.navigate('Home');
    };

    // --------------------------------------------------------------------------------
    // Google OAuth Flow
    // --------------------------------------------------------------------------------

    // 1. Create a Google Auth request that auto-handles dev vs. production
    const [request, response, promptAsync] = Google.useAuthRequest({
        // clientId: WEB_CLIENT_ID,      // Your Web client ID (used in dev or web fallback)
        iosClientId: IOS_CLIENT_ID,   // iOS client ID for TestFlight/App Store
        // androidClientId: ANDROID_CLIENT_ID, // if you want Android support
        scopes: ['profile', 'email'],
        responseType: 'id_token',
        redirectUri: "https://auth.expo.io/@jdkuligowski/burst-slug",  // <-- Force the Expo proxy
        // redirectUri: makeRedirectUri({ useProxy: true }),  // <-- Force the Expo proxy

        // We omit redirectUri so expo-auth-session auto-detects the correct environment
        // If you prefer to see the final redirect URIs, you can console.log(makeRedirectUri(...))
    });

    // 2. Generate and attach the nonce after the request is available
    useEffect(() => {
        const attachNonce = async () => {
            if (request) {
                const nonce = await generateNonce();
                console.log('🔑 Generated Nonce:', nonce);
                // Merge it into extraParams
                request.extraParams = { ...request.extraParams, nonce };
            }
        };
        attachNonce();
    }, [request]);

    // 3. Monitor the Google response
    useEffect(() => {
        if (!response) return;  // No response yet

        if (response.type === 'success') {
            console.log('✅ Google Sign-In Success:', response);
            const idToken = response.params?.id_token;
            if (idToken) {
                registerWithGoogle(idToken);
            } else {
                console.error('❌ No ID Token found in response.');
                Alert.alert('Google Sign-In Failed', 'No ID Token received.');
            }
        } else if (response.type === 'error') {
            console.error('❌ Google Sign-In Error:', response);
            Alert.alert('Google Sign-In Failed', 'Please try again.');
        } else if (response.type === 'cancel') {
            console.log('❌ Google Sign-In Cancelled by user');
        }
    }, [response]);

    // 4. Button press => open Google Sign-In
    const handleGoogleSignIn = async () => {
        console.log('🚀 Google Sign-In Button Pressed');
        if (!request) {
            console.error('❌ Google Auth Request is null');
            Alert.alert('Google Sign-In Failed', 'Request is null. Try restarting Expo.');
            return;
        }
        await promptAsync(); // Launch Google OAuth flow
    };

    // 5. If the sign-in is successful, send the ID token to your backend
    const registerWithGoogle = async (googleToken) => {
        console.log('🚀 registerWithGoogle called, token:', googleToken);
        try {
            const res = await axios.post(
                `${ENV.API_URL}/api/auth/register/google/`,
                { token: googleToken },
                { headers: { 'Content-Type': 'application/json' } }
            );
            console.log('✅ Google Sign-Up Response:', res.data);

            if (res.status === 200) {
                await AsyncStorage.setItem('token', res.data.token);
                setIsAuthenticated(true);
                navigation.navigate('Home');
            } else {
                Alert.alert('Google Sign-Up Failed', 'Unexpected status code.');
            }
        } catch (error) {
            console.error('❌ Google Sign-Up Error:', error);
            Alert.alert('Google Sign-Up Failed', error.response?.data?.error || 'Something went wrong.');
        }
    };

    // Utility function to generate a random nonce
    const generateNonce = async () => {
        return await Crypto.digestStringAsync(
            Crypto.CryptoDigestAlgorithm.SHA256,
            Math.random().toString()
        );
    };

    return (
        <SafeAreaView style={styles.landingSafeArea}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <ScrollView contentContainerStyle={styles.scrollViewContainer} keyboardShouldPersistTaps="handled">
                        <View style={styles.registerContainer}>
                            <Text style={styles.signUpText}>Sign up</Text>
                            <TouchableOpacity
                                style={styles.googleButton}
                                onPress={() => {
                                    console.log("Google Sign-In Button Pressed ✅");
                                    if (!request) {
                                        console.error("Google Auth Request is null ❌");
                                        Alert.alert("Google Sign-In Failed", "Request is null. Try restarting Expo.");
                                        return;
                                    }
                                    promptAsync();
                                }}
                            >

                                <AntDesign name="google" size={24} color="black" />
                                <Text style={styles.googleButtonText}>Sign up with Google</Text>
                            </TouchableOpacity>

                            <View style={styles.inputContainer}>
                                {/* First Name */}
                                <View style={styles.inputBlock}>
                                    <Text style={styles.title}>First Name</Text>
                                    <TextInput
                                        style={styles.inputBox}
                                        placeholder="First Name"
                                        onChangeText={(text) => setFormData({ ...formData, first_name: text })}
                                    />
                                </View>

                                {/* Last Name */}
                                <View style={styles.inputBlock}>
                                    <Text style={styles.title}>Last Name</Text>
                                    <TextInput
                                        style={styles.inputBox}
                                        placeholder="Last Name"
                                        onChangeText={(text) => setFormData({ ...formData, last_name: text })}
                                    />
                                </View>

                                {/* Email */}
                                <View style={styles.inputBlock}>
                                    <Text style={styles.title}>Email</Text>
                                    <TextInput
                                        style={styles.inputBox}
                                        placeholder="Email"
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        onChangeText={(text) => setFormData({ ...formData, email: text.toLowerCase() })}
                                    />
                                </View>

                                {/* Password with Toggle */}
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

                                {/* Confirm Password with Toggle */}
                                <View style={styles.inputBlock}>
                                    <Text style={styles.title}>Confirm Password</Text>
                                    <View style={styles.passwordWrapper}>
                                        <TextInput
                                            style={styles.inputBoxPassword}
                                            placeholder="Confirm Password"
                                            secureTextEntry={!isConfirmPasswordVisible}
                                            autoCapitalize="none"
                                            onChangeText={(text) => setFormData({ ...formData, password_confirmation: text })}
                                        />
                                        <TouchableOpacity onPress={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}>
                                            <Ionicons
                                                name={isConfirmPasswordVisible ? "eye-off" : "eye"}
                                                size={24}
                                                color="black"
                                            />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.line} />
                            <Text style={styles.loginText}>
                                Already have an account?{' '}
                                <Text style={styles.loginButton} onPress={() => navigation.navigate('Login')}>
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
                        {isOnboardingVisible && (
                            <OnboardingModal
                                isVisible={isOnboardingVisible}
                                onClose={handleOnboardingComplete}
                                navigation={navigation}
                            />
                        )}
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
        marginBottom: 20,
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
})

