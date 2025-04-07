import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from "@expo/vector-icons/Ionicons";
import SquigglyLine from '@/app/src/components/SquigglyLine';
import RegistrationModal from '../modalScreens/RegistrationModal'; // Import the new modal
import { Colours } from '../../components/styles';

export default function LandingPage() {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const navigation = useNavigation();

    return (
        <SafeAreaView style={styles.landingSafeArea}>
            <View style={styles.landingContainer}>
                <View style={styles.landingTextBox}>
                    <Text style={styles.landingText}>
                        Workouts that <Text style={styles.highlightText}>fit your life</Text>
                    </Text>
                    <View style={styles.squigglyLineContainer}>
                        <SquigglyLine color={Colours.buttonColour} />
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
                                <Ionicons name="arrow-forward" size={24} color="white" />
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.loginButton}
                            onPress={() => navigation.navigate('Login')}>
                            <Text style={styles.registerText}>I already have an account</Text>
                            <View style={styles.registerArrow}>
                                <Ionicons name="arrow-forward" size={24} color="black" />
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* Multi-Step Registration Modal */}
            <RegistrationModal 
                isVisible={isModalVisible} 
                onClose={() => setIsModalVisible(false)} 
                navigation={navigation} 
            />
        </SafeAreaView>
    );
}



const styles = StyleSheet.create({
    landingSafeArea: {
        flex: 1,
        backgroundColor: Colours.primaryBackground,
    },
    landingContainer: {
        flex: 1,
        backgroundColor: Colours.primaryBackground,
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
        color: Colours.buttonColour,
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
        backgroundColor: Colours.buttonColour,
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
        color: Colours.secondaryColour,
    },
    buttonContainer: {
        width: '100%',
    },
    continueButton: {
        backgroundColor: Colours.secondaryColour,
        flexDirection: 'row',
        width: '100%',
        padding: 5,
        borderRadius: 20,
        alignItems: 'center',
    },
    buttonArrow: {
        backgroundColor: Colours.buttonColour,
        padding: 5,
        borderRadius: 20,
        marginLeft: -32,
    },
    continueButtonText: {
        color: Colours.buttonColour,
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
        backgroundColor: Colours.secondaryColour,
        padding: 5,
        borderRadius: 20,
        marginLeft: -32,
    },
    registerText: {
        color: Colours.secondaryColour,
        width: '100%',
        textAlign: 'center',
        fontSize: 16,
        fontWeight: 600,
    },
})