import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, SafeAreaView, ScrollView, FlatList, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from "@expo/vector-icons/Ionicons";
import SquigglyLine from '@/components/SquigglyLine';

export default function LandingPage() {
    const navigation = useNavigation();

    return (
        <SafeAreaView style={styles.landingSafeArea}>

            <View style={styles.landingContainer}>
                <View style={styles.landingTextBox}>
                    <Text style={styles.landingText}>
                        Workouts that <Text style={styles.highlightText}>fit your life</Text>
                    </Text>
                    <View style={styles.squigglyLineContainer}>
                        <SquigglyLine color='#65C8BF' />
                    </View>
                </View>
                <View style={styles.landingActionBox}>
                    <Text style={styles.welcomeMessage}>Unlimited workouts at your fingertips</Text>
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={styles.continueButton}
                            onPress={() => navigation.navigate('Register')}>
                            <Text style={styles.continueButtonText}>Sign up</Text>
                            <View style={styles.buttonArrow}>
                                <Ionicons name="arrow-forward" size={24} color="black" />
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.loginButton}
                            onPress={() => navigation.navigate('Login')}>
                            <Text style={styles.registerText}>I already have an account</Text>
                            <View style={styles.registerArrow}>
                                <Ionicons name="arrow-forward" size={24} color="white" />
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>


            </View>
        </SafeAreaView>
    );
}


const styles = StyleSheet.create({
    landingSafeArea: {
        flex: 1,
        backgroundColor: '#F0FFF4', // Background color for the entire screen
    },
    landingContainer: {
        flex: 1,
        backgroundColor: '#F0FFF4',
        justifyContent: 'flex-end',
        paddingBottom: 20,
    },
    landingText: {
        color: 'black',
        fontSize: 40,
        fontWeight: 700,
        width: '50%',
        marginLeft: '5%',
    },
    highlightText: {
        color: '#65C8BF',
    },
    landingTextBox: {
        marginBottom: 20,
    },
    squigglyLineContainer: {
        marginLeft: '5%',
        marginTop: 10,
    },
    landingActionBox: {
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: 300,
        width: '90%',
        marginLeft: '5%',
        backgroundColor: '#D6F7F4',
        borderTopWidth: 1,
        borderLeftWidth: 1,
        borderRightWidth: 4,
        borderBottomWidth: 5,
        borderRadius: 48,
        padding: 20,
        paddingTop: 40,
    },
    welcomeMessage: {
        fontSize: 24,
        textAlign: 'center',
        paddingLeft: 20,
        paddingRight: 20,
    },
    buttonContainer: {
        width: '100%',
    },
    continueButton: {
        backgroundColor: 'black',
        flexDirection: 'row',
        width: '100%',
        padding: 5,
        borderRadius: 20,
        alignItems: 'center',
    },
    buttonArrow: {
        backgroundColor: 'white',
        padding: 5,
        borderRadius: 20,
        marginLeft: -32,
    },
    continueButtonText: {
        color: 'white',
        width: '100%',
        textAlign: 'center',
        fontSize: 16,
        fontWeight: 600,
    },
    loginButton: {
        backgroundColor: 'transparent',
        flexDirection: 'row',
        width: '100%',
        padding: 5,
        borderRadius: 20,
        alignItems: 'center',
        borderWidth: 1,
        marginTop: 10,

    },
    registerArrow: {
        backgroundColor: 'black',
        padding: 5,
        borderRadius: 20,
        marginLeft: -32,
    },
    registerText: {
        color: 'black',
        width: '100%',
        textAlign: 'center',
        fontSize: 16,
        fontWeight: 600,
    },
})