import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    StyleSheet,
    TextInput,
    Alert,
    KeyboardAvoidingView,
    TouchableWithoutFeedback,
    Keyboard,
    ScrollView,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import SquigglyLineReg from '../../components/SquigglyLineRegistration';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ENV from '../../../../env'


const OnboardingModal = ({ isVisible, onClose, navigation }) => {
    const [currentStep, setCurrentStep] = useState(1);
    const { setIsOnboardingComplete } = useAuth();

    const totalSteps = 5;

    const [formData, setFormData] = useState({
        fitnessGoal: '',
        exerciseFrequency: '',
        exerciseExclusions: '',
        five_k_mins: '',
        five_k_secs: '',
    });

    const exerciseData = [
        { name: 'Get stronger', icon: 'barbell-outline', colour: '#EFE8FF' },
        { name: 'Get fitter', icon: 'heart-outline', colour: '#D2E4EA' },
        { name: 'Get more lean', icon: 'person-outline', colour: '#FFDDDE' },
        { name: 'Get bigger', icon: 'person-outline', colour: '#F6F6DC' },
    ];


    const nextStep = () => {
        if (currentStep < totalSteps) {
            setCurrentStep(currentStep + 1);
        } else {
            handleSubmit();
        }
    };

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleInputChange = (field, value) => {
        setFormData({ ...formData, [field]: value });
    };

    const handle5kChange = (field, value) => {
        // Prevent non-numeric characters
        if (field === 'five_k_mins' || field === 'five_k_secs') {
            if (!/^\d*$/.test(value)) return;
        }

        setFormData({ ...formData, [field]: value });
    };

    const handleSkip = async () => {
        setFormData({ ...formData, five_k_mins: '', five_k_secs: '' });
        setCurrentStep(currentStep + 1);
    };



    const handleOptionSelect = (option) => {
        setFormData((prevFormData) => {
            const exclusions = prevFormData.exerciseExclusions;
            if (exclusions.includes(option)) {
                // Remove option if it's already selected
                return {
                    ...prevFormData,
                    exerciseExclusions: exclusions.filter((item) => item !== option),
                };
            } else if (exclusions.length < 3) {
                // Add option if less than 3 are selected
                return {
                    ...prevFormData,
                    exerciseExclusions: [...exclusions, option],
                };
            }
            return prevFormData; // Do nothing if 3 options are already selected
        });
    };

    const handleSubmit = async () => {
        const { fitnessGoal, exerciseFrequency, exerciseExclusions, five_k_mins, five_k_secs } = formData;
        const userId = await AsyncStorage.getItem('userId');

        // Validate fields
        if (!fitnessGoal || !exerciseFrequency) {
            Alert.alert('Error', 'Please complete all fields before submitting.');
            return;
        }

        try {
            const token = await AsyncStorage.getItem('token'); // Get auth token
            const response = await axios.put(
                `${ENV.API_URL}/api/auth/onboarding/${userId}/`,
                {
                    fitnessGoal,
                    exerciseFrequency,
                    exerciseExclusions,
                    five_k_mins,
                    five_k_secs,
                },
                // {
                //     headers: {
                //         Authorization: `Bearer ${token}`,
                //         'Content-Type': 'application/json',
                //     },
                // },
            );

            if (response.status === 200) {
                // Alert.alert('Success', 'Onboarding completed!');
                await AsyncStorage.setItem('is_onboarding_complete', 'true');
    
                setCurrentStep(6);
            } else {
                Alert.alert('Error', 'Failed to update your details. Please try again.');
            }
        } catch (error) {
            console.error('Onboarding submission error:', error);
            // Alert.alert('Error', 'An error occurred. Please try again.');
        }
    };


    useEffect(() => {
        if (currentStep === 6) {
            // Automatically navigate to the Home screen after 3 seconds
            const timer = setTimeout(() => {
                setIsOnboardingComplete(true);
                // navigation.navigate('Home');
            }, 3000);

            // Clear the timer if the component unmounts before navigation
            return () => clearTimeout(timer);
        }
    }, [currentStep]);


    return (
        <Modal visible={isVisible} animationType="slide" transparent={false}>
            <KeyboardAvoidingView
                style={[
                    styles.container,
                    {
                        padding: currentStep === 6 ? 0 : 20,
                    }
                ]}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                        {/* Progress Bar */}
                        {currentStep === 6 ? "" :
                            <View style={styles.progressBarContainer}>
                                <TouchableOpacity
                                    style={{
                                        borderWidth: 1,
                                        borderColor: currentStep === 1 ? '#ccc' : 'black',
                                        borderRadius: 24,
                                        padding: 12
                                    }}
                                    onPress={prevStep} disabled={currentStep === 1}>
                                    <Ionicons name="arrow-back" size={24} color={currentStep === 1 ? '#ccc' : 'black'} />
                                </TouchableOpacity>
                                <View style={styles.progressBar}>
                                    <View style={[styles.progress, { width: `${(currentStep / totalSteps) * 100}%` }]} />
                                </View>
                                <Text style={styles.progressText}>
                                    {currentStep}/{totalSteps}
                                </Text>
                            </View>
                        }

                        {/* Step Content */}
                        {currentStep === 1 && (
                            <View style={styles.stepContainer}>
                                <View style={styles.stepTopSection}>
                                    <Text style={styles.stepHeader}>Welcome to Burst!</Text>
                                    <Text style={styles.stepSubHeader}>A few quick answers will help us tailor our suggestions for you.</Text>
                                    <View style={styles.processTime}>
                                        <Ionicons name="time-outline" size={24} color="black" />
                                        <Text style={styles.timeText}>
                                            1 min
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.stepMiddleSection}>
                                    <View style={styles.stepRow}>
                                        <View style={[styles.iconContainer, { backgroundColor: '#E0DBFF' }]}>
                                            <Ionicons name="person-outline" size={24} color="black" />
                                        </View>
                                        <View style={styles.rowDetail}>
                                            <Text style={styles.stepOrder}>STEP 1</Text>
                                            <Text style={styles.stepDetail}>Your fitness goals</Text>
                                        </View>
                                    </View>
                                    <View style={styles.stepRow}>
                                        <View style={[styles.iconContainer, { backgroundColor: '#D6F7F4' }]}>
                                            <Ionicons name="barbell-outline" size={24} color="black" />
                                        </View>
                                        <View style={styles.rowDetail}>
                                            <Text style={styles.stepOrder}>STEP 2</Text>
                                            <Text style={styles.stepDetail}>How often you exercise</Text>
                                        </View>
                                    </View>
                                    <View style={styles.stepRow}>
                                        <View style={[styles.iconContainer, { backgroundColor: '#FFDCDD' }]}>
                                            <Ionicons name="list-outline" size={24} color="black" />
                                        </View>
                                        <View style={styles.rowDetail}>
                                            <Text style={styles.stepOrder}>STEP 3</Text>
                                            <Text style={styles.stepDetail}>Your non negotiables</Text>
                                        </View>
                                    </View>
                                </View>

                                <TouchableOpacity style={styles.nextButton} onPress={nextStep}>
                                    <Text style={styles.buttonText}>Next</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                        {currentStep === 2 && (
                            <View style={styles.stepContainer}>
                                <View style={styles.stepTopSection}>
                                    <Text style={styles.stepHeader}>What are your fitness goals?</Text>
                                    <Text style={styles.stepSubHeader}>Choose one of these.</Text>
                                </View>
                                <View style={styles.stepMiddleSection}>
                                    <View style={styles.exerciseTypeArray}>
                                        {exerciseData.map((exercise, index) => (
                                            <TouchableOpacity
                                                key={index}
                                                style={[
                                                    styles.exerciseType,
                                                    {
                                                        backgroundColor: exercise.colour,
                                                        borderTopWidth: formData.fitnessGoal === exercise.name ? 1 : 0, // Add border if selected
                                                        borderLeftWidth: formData.fitnessGoal === exercise.name ? 1 : 0, // Add border if selected
                                                        borderRightWidth: formData.fitnessGoal === exercise.name ? 1 : 0, // Add border if selected
                                                        borderBottomWidth: formData.fitnessGoal === exercise.name ? 1 : 0, // Add border if selected
                                                        borderColor: formData.fitnessGoal === exercise.name ? 'black' : 'transparent',
                                                    },
                                                ]}
                                                onPress={() => handleInputChange('fitnessGoal', exercise.name)} // Set fitnessGoal on selection
                                            >
                                                <Text style={styles.exerciseTitle}>{exercise.name}</Text>
                                                <View style={styles.exerciseCornerBox}>
                                                    <View
                                                        style={[
                                                            styles.exerciseIconBox,
                                                            { backgroundColor: exercise.colour },
                                                        ]}>
                                                        <Ionicons name={exercise.icon} color="black" size={20} />
                                                    </View>
                                                </View>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                                <TouchableOpacity
                                    style={[
                                        styles.nextButton,
                                        { backgroundColor: formData.fitnessGoal ? 'black' : '#ccc' }, // Disable button if no selection
                                    ]}
                                    onPress={formData.fitnessGoal ? nextStep : null} // Prevent advancing without selection
                                    disabled={!formData.fitnessGoal} // Disable if no selection
                                >
                                    <Text style={styles.buttonText}>Next</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                        {currentStep === 3 && (
                            <View style={styles.stepContainer}>
                                <View style={styles.stepTopSection}>
                                    <Text style={styles.stepHeader}>How often do you want to exercise?</Text>
                                    <Text style={styles.stepSubHeader}>Pick how many days a week</Text>
                                </View>
                                <View style={styles.stepMiddleSection}>
                                    <View style={styles.daysArray}>
                                        {[
                                            { day: 1, color: '#E0DCF6' },
                                            { day: 2, color: '#FFE0E1' },
                                            { day: 3, color: '#E0F4DE' },
                                            { day: 4, color: '#F6F6DC' },
                                            { day: 5, color: '#DEF3F4' },
                                            { day: 6, color: '#F5EAE0' },
                                        ].map(({ day, color }) => (
                                            <TouchableOpacity
                                                key={day}
                                                style={[
                                                    styles.dayButton,
                                                    {
                                                        backgroundColor: color, // Default background color
                                                        borderWidth: formData.exerciseFrequency === day ? 2 : 0, // Add border if selected
                                                        borderColor: formData.exerciseFrequency === day ? 'black' : 'transparent',
                                                    },
                                                ]}
                                                onPress={() => handleInputChange('exerciseFrequency', day)}
                                            >
                                                <Text
                                                    style={[
                                                        styles.dayButtonText,
                                                        { color: formData.exerciseFrequency === day ? 'black' : 'black' },
                                                    ]}
                                                >
                                                    {day}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                                <TouchableOpacity
                                    style={[
                                        styles.nextButton,
                                        { backgroundColor: formData.exerciseFrequency ? 'black' : '#ccc' },
                                    ]}
                                    onPress={formData.exerciseFrequency ? nextStep : null}
                                    disabled={!formData.exerciseFrequency}
                                >
                                    <Text style={styles.buttonText}>Next</Text>
                                </TouchableOpacity>
                            </View>
                        )}


                        {currentStep === 4 && (
                            <View style={styles.stepContainer}>
                                <View style={styles.stepTopSection}>
                                    <Text style={styles.stepHeader}>
                                        Are there any types of exercise you don’t like to do?
                                    </Text>
                                    <Text style={styles.stepSubHeader}>Choose up to 3</Text>
                                </View>
                                <View style={styles.stepMiddleSection}>
                                    <View style={styles.exerciseOptionsArray}>
                                        {[
                                            { name: "Running", color: "#E0DCF6" },
                                            { name: "Rowing", color: "#FFE0E1" },
                                            { name: "Ski erg", color: "#E0F4DE" },
                                            { name: "HIIT", color: "#F6F6DC" },
                                        ].map(({ name, color }, index) => (
                                            <TouchableOpacity
                                                key={index}
                                                style={[
                                                    styles.exerciseOption,
                                                    {
                                                        backgroundColor: color,
                                                        borderWidth: formData.exerciseExclusions.includes(name) ? 2 : 0,
                                                        borderColor: formData.exerciseExclusions.includes(name) ? 'black' : 'transparent',
                                                    },
                                                ]}
                                                onPress={() => handleOptionSelect(name)}
                                            >
                                                <Text
                                                    style={[
                                                        styles.exerciseOptionText,
                                                        { color: formData.exerciseExclusions.includes(name) ? 'black' : 'black' },
                                                    ]}
                                                >
                                                    {name}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                                <TouchableOpacity
                                    style={[
                                        styles.nextButton,
                                        { backgroundColor: 'black' }, // Enable only if at least 1 option selected
                                    ]}
                                    onPress={nextStep}
                                // disabled={formData.exerciseExclusions.length === 0}
                                >
                                    <Text style={styles.buttonText}>Next</Text>
                                </TouchableOpacity>
                            </View>
                        )}


                        {currentStep === 5 && (
                            <View style={styles.stepContainer}>
                                <View style={styles.stepTopSection}>
                                    <Text style={styles.stepHeader}>Help us understanding your running level</Text>
                                    <Text style={styles.stepSubHeader}>
                                        How quickly can you run a 5k? This will help us recommend running workouts for you and you can update it whenever you want.
                                    </Text>
                                </View>

                                {/* 5K Time Input */}
                                <View style={styles.workoutInfoDetails}>
                                    {/* <Text style={styles.workoutSubtitle}>Current 5km Time</Text> */}
                                    <View style={styles.timeInputContainer}>
                                        <TextInput
                                            style={styles.timeInput}
                                            value={formData.five_k_mins}
                                            onChangeText={(value) => handle5kChange('five_k_mins', value)}
                                            placeholder="Min"
                                            keyboardType="numeric"
                                            maxLength={2}
                                        />
                                        <Text style={styles.timeSeparator}>:</Text>
                                        <TextInput
                                            style={styles.timeInput}
                                            value={formData.five_k_secs}
                                            onChangeText={(value) => handle5kChange('five_k_secs', value)}
                                            placeholder="Sec"
                                            keyboardType="numeric"
                                            maxLength={2}
                                        />
                                    </View>
                                </View>

                                <View style={styles.buttonContainer}>
                                    <TouchableOpacity
                                        style={styles.skipButton}
                                        onPress={handleSkip} // Skips to submission with empty 5K time
                                    >
                                        <Text style={styles.skipButtonText}>Not sure</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[
                                            styles.nextButton,
                                            {
                                                backgroundColor:
                                                    formData.five_k_mins && formData.five_k_secs ? 'black' : '#ccc',
                                            },
                                        ]}
                                        onPress={
                                            formData.five_k_mins && formData.five_k_secs ? handleSubmit : null
                                        }
                                        disabled={!formData.five_k_mins || !formData.five_k_secs}
                                    >
                                        <Text style={styles.buttonText}>Submit</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                        {currentStep === 6 && (
                            <View style={styles.finalStep}>
                                {/* Top Squiggly Line */}


                                {/* Congratulations Text */}
                                <View style={styles.finalContent}>
                                    <Text style={styles.congratsText}>Dunzo!</Text>
                                    <Text style={styles.subText}>
                                        You've completed all the steps.
                                    </Text>
                                    <Text style={styles.subText}>
                                        We're loading Burst for you now!
                                    </Text>
                                </View>

                                {/* Bottom Squiggly Line */}
                                <View style={styles.squigglyTop}>
                                    <SquigglyLineReg color="#FFF5F7" height={70} />
                                </View>
                                <View style={styles.squigglyBottom}>
                                    <SquigglyLineReg color="#FFF5F7" height={70} />
                                </View>
                                <View style={styles.squigglyBottom}>
                                    <SquigglyLineReg color="#FFF5F7" height={70} />
                                </View>
                            </View>
                        )}



                    </ScrollView>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // padding: 20,
    },
    progressBarContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 50,
    },
    progressBar: {
        flex: 1,
        height: 5,
        backgroundColor: '#e0e0e0',
        borderRadius: 2.5,
        marginHorizontal: 10,
    },
    progress: {
        height: '100%',
        backgroundColor: 'black',
    },
    progressText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
    },
    stepContainer: {
        flex: 1,
        // alignItems: 'center',
        justifyContent: 'space-between',
    },
    stepHeader: {
        fontSize: 30,
        fontWeight: 'bold',
        marginTop: 20,
    },
    stepSubHeader: {
        fontSize: 20,
        marginTop: 10,
    },
    processTime: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
    },
    timeText: {
        fontSize: 18,
        marginLeft: 5,
    },
    stepRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    iconContainer: {
        borderTopWidth: 1,
        borderLeftWidth: 1,
        borderRightWidth: 3,
        borderBottomWidth: 3,
        padding: 15,
        borderRadius: 15,
        marginRight: 10,
    },
    stepOrder: {
        color: '#7B7C8C',
    },
    stepDetail: {
        fontSize: 20,
    },
    exerciseTypeArray: {
        marginTop: 0,
        // padding: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        width: '100%',
    },
    exerciseType: {
        width: '47.5%',
        height: 150,
        borderWidth: 0,
        borderRadius: 30,
        marginBottom: 10,
        // padding: 20,
        flexDirection: 'column',
        justifyContent: 'space-between',

    },
    exerciseCornerBox: {
        backgroundColor: 'white',
        width: '60%',
        height: '60%',
        alignSelf: 'flex-end',
        borderBottomRightRadius: 30,
        borderTopLeftRadius: 80,
        padding: 20,
        borderBottomColor: 'transparent',
    },
    exerciseTitle: {
        alignSelf: 'flex-start',
        padding: 20,
        fontWeight: '500',
        fontSize: 16,
    },
    exerciseIconBox: {
        borderWidth: 1,
        borderRadius: 10,
        height: 40,
        width: 40,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        bottom: 20,
        right: 20,
        borderBottomWidth: 2,
        borderRightWidth: 2,
    },
    daysArray: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        marginTop: 20,
        width: '100%',
    },
    dayButton: {
        width: '30%',
        height: 70,
        paddingVertical: 15,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 10,
        borderWidth: 1,
        marginBottom: 10,
    },
    dayButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
    },

    exerciseOptionsArray: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        marginTop: 20,
        width: '100%',
    },
    exerciseOption: {
        width: '47.5%',
        height: 70,
        paddingVertical: 15,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 10,
        borderWidth: 1,
        marginBottom: 10,
    },
    exerciseOptionText: {
        fontSize: 16,
        fontWeight: 'bold',
    },

    nextButton: {
        backgroundColor: 'black',
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderRadius: 20,
        marginBottom: 70,
    },
    submitButton: {
        backgroundColor: 'black',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
    },
    buttonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    timeInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        // justifyContent: 'center',
        marginVertical: 10,
    },
    timeInput: {
        width: 100,
        height: 60,
        borderWidth: 1,
        borderColor: '#B0B0B0',
        backgroundColor: 'white',
        borderRadius: 10,
        textAlign: 'center',
        fontSize: 16,
    },
    timeSeparator: {
        fontSize: 20,
        marginHorizontal: 10,
    },
    buttonContainer: {
        flexDirection: 'column',
        justifyContent: 'space-between',
        // width: '90%',
        marginTop: 20,
    },
    skipButton: {
        backgroundColor: '#EFE8FF',
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderRadius: 20,
        marginBottom: 10,
    },

    skipButtonText: {
        color: 'black',
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',
    },
    finalStep: {
        backgroundColor: '#FFDCDD',
        height: '100%',
        flexDirection: 'column',
        justifyContent: 'flex-end',
    },
    finalContent: {
        padding: 20,
    },
    congratsText: {
        fontSize: 50,
        fontWeight: 700,
        marginBottom: 20,
    },
    subText: {
        fontSize: 20,
        marginBottom: 20,
    },

});

export default OnboardingModal;
