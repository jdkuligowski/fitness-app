import React, { useState, useEffect } from "react";
import { useNavigation } from '@react-navigation/native';
import {
    View, Text, StyleSheet, TouchableOpacity, SafeAreaView, FlatList, ActivityIndicator,
    Image, Dimensions, ScrollView, Modal, TouchableWithoutFeedback, Alert
} from "react-native";
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from "@expo/vector-icons/Ionicons";
// import { useWorkout } from "../../../context/WorkoutContext";
import DateTimePicker from "@react-native-community/datetimepicker";
import ENV from '../../../../env'

const SCREEN_WIDTH = Dimensions.get("window").width;

export default function SaveWorkoutModal({ currentWorkout, setCurrentWorkout, onClose, selectedTime, selectedWorkout, workoutPlan, closeModal,
    frequency, modalRoute, fetchWorkouts, isLoading, setIsBouncerLoading }) {

    const navigation = useNavigation();
    const [workoutPlans, setWorkoutPlans] = useState([]);
    const [showCalendarModal, setShowCalendarModal] = useState(false); // Track Calendar modal visibility
    const [selectedDate, setSelectedDate] = useState(new Date()); // Track selected date
    const [userNeed, setUserNeed] = useState('')

    const closeCalendarModal = () => {
        setShowCalendarModal(false); // Close calendar modal
    };

    const onDateChange = (event, date) => {
        if (date) {
            setSelectedDate(date);
        }
    };

    // Handle Save Workout Button
    const handleSaveWorkout = () => {
        saveWorkout(currentWorkout, "Saved");
        closeModal();
    };

    // Handle Add to Calendar Button
    const handleAddToCalendar = () => {
        if (selectedDate && modalRoute === 'Discovery') {
            saveWorkout(currentWorkout, "Scheduled");
        } else if (selectedDate && modalRoute === 'Resave') {
            if (userNeed === 'Reschedule') {
                updateWorkoutDate(currentWorkout.id, selectedDate.toISOString().split('T')[0]);
            } else if (userNeed === 'Duplicate') {
                reSaveWorkout(currentWorkout.id, "Scheduled");
            }
            closeModal();
        } else {
            Alert.alert("Error", "Please select a date first.");
        }
    };

    // Handle move to another date
    const handleDuplicateWorkout = () => {
        if (selectedDate) {
            saveWorkout(currentWorkout, "Scheduled");
            closeModal();
        } else {
            Alert.alert("Error", "Please select a date first.");
        }
    };

    const saveWorkout = async (workoutPlan, status = "Saved") => {
        try {
            const userId = await AsyncStorage.getItem("userId"); // Retrieve the user ID if stored locally
            console.log("user_id ->", userId);
            const formattedDate = selectedDate.toISOString().split("T")[0]; // Convert to 'YYYY-MM-DD'
            console.log('save workout ->', workoutPlan);

            const payload = {
                user_id: userId, // Add the user ID here
                name: `${selectedWorkout} Workout`, // Example: "Full body Workout"
                description: "Custom generated workout",
                duration: selectedTime,
                complexity: frequency === "Rarely" ? 1 : frequency === "Sometimes" ? 2 : 3,
                status: status, // Pass the workout status ("Saved" or "Scheduled")
                scheduled_date: status === "Scheduled" ? selectedDate.toISOString().split("T")[0] : null, // Pass the selected date if "Scheduled"
                sections: workoutPlan.map((section, index) => ({
                    section_name: section.partLabel,
                    section_order: index + 1,
                    section_type: section.sectionType, // Pass section type here
                    movements: section.movements.map((movement, movementIndex) => ({
                        movement_name: movement,
                        movement_order: movementIndex + 1,
                    })),
                })),
            };

            const response = await axios.post(
                `${ENV.API_URL}/api/saved_workouts/save-workout/`,
                payload
            );
            console.log("Workout saved successfully:", response.data);
            Alert.alert("Workout Saved", "Your workout has been saved successfully!");
        } catch (error) {
            console.error("Error saving workout:", error.message);
            Alert.alert("Error", "There was an error saving your workout. Please try again.");
        }
    };


    const reSaveWorkout = async (workoutId, status = "Saved") => {
        try {
            setIsBouncerLoading(true); // Start loading spinner
    
            const userId = await AsyncStorage.getItem("userId");
    
            // 1️⃣ --- Fetch full workout details ---
            const response = await axios.get(`${ENV.API_URL}/api/saved_workouts/get-single-workout/${workoutId}/`, {
                params: { user_id: userId }
            });
    
            const workoutPlan = response.data;
    
            if (!workoutPlan) {
                console.warn('Workout plan is missing or undefined.');
                Alert.alert("Error", "Workout data is missing. Please try again.");
                setIsBouncerLoading(false);
                return; 
            }
    
            if (!workoutPlan.workout?.workout_sections || !Array.isArray(workoutPlan.workout.workout_sections)) {
                console.warn('workout_sections is missing or not an array.', workoutPlan.workout?.workout_sections);
                Alert.alert("Error", "Workout sections are missing. Please try again.");
                setIsBouncerLoading(false);
                return; 
            }
    
            const formattedDate = selectedDate.toISOString().split("T")[0];
    
            // 2️⃣ --- Format the Payload Properly ---
            const payload = {
                user_id: userId,
                name: workoutPlan.workout?.name || 'Unnamed Workout',
                comments: null,
                description: workoutPlan.workout?.description || 'No description',
                duration: workoutPlan.workout?.duration || 0,
                complexity: workoutPlan.workout?.complexity || 1,
                status: status,
                scheduled_date: status === "Scheduled" ? formattedDate : null,
                workout_number: workoutPlan.workout?.workout_number,
                sections: workoutPlan.workout?.workout_sections.map((section, index) => ({
                    section_name: section.section_name,
                    section_order: index + 1,
                    section_type: section.section_type,
                    movements: (section.section_movement_details || []).map((movement, movementIndex) => ({
                        movement_name: movement.movements?.exercise,
                        movement_order: movementIndex + 1,
                        movement_difficulty: movement.movement_difficulty || 0, // Optional if movement difficulty is included
                    })),
                })),
            };
    
            console.log("Payload for resave ->", JSON.stringify(payload, null, 2)); // Debugging
    
            // 3️⃣ --- Call the save endpoint ---
            const saveResponse = await axios.post(
                `${ENV.API_URL}/api/saved_workouts/save-workout/`,
                payload
            );
    
            console.log("Workout duplicated successfully:", saveResponse.data);
            Alert.alert("Workout Added", "Your workout has been added to the calendar!");
        } catch (error) {
            console.error("Error saving workout:", error?.response?.data || error.message);
            Alert.alert("Error", "There was an error duplicating your workout. Please try again.");
        } finally {
            fetchWorkouts();
            setIsBouncerLoading(false); // Remove loading spinner
        }
    };

    

    const deleteWorkout = async () => {
        Alert.alert(
            'Confirm Deletion',
            'Are you sure you want to delete this workout?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            closeModal()
                            setIsBouncerLoading(true)
                            const response = await axios.delete(`${ENV.API_URL}/api/saved_workouts/delete-workout/${currentWorkout.id}/`);
                            Alert.alert('Success', 'Workout deleted successfully');
                            fetchWorkouts(); // Refresh the list of workouts
                            setIsBouncerLoading(false)
                        } catch (error) {
                            console.error('Error deleting workout:', error?.response?.data || error.message);
                            Alert.alert('Error', 'Failed to delete workout. Please try again.');
                            setIsBouncerLoading(false)
                            setCurrentWorkout(true)
                        }
                    },
                },
            ],
            { cancelable: true }
        );
    };

    const updateWorkoutDate = async (workoutId, newDate) => {
        try {
            setIsBouncerLoading(true)
            const payload = { scheduled_date: newDate };
            const response = await axios.patch(
                `${ENV.API_URL}/api/saved_workouts/update-workout-date/${workoutId}/`,
                payload
            );
            console.log('Workout date updated successfully:', response.data);
            Alert.alert('Success', 'Workout date updated successfully.');
            fetchWorkouts()
            setIsBouncerLoading(false)
        } catch (error) {
            console.error('Error updating workout date:', error?.response?.data || error.message);
            Alert.alert('Error', 'Failed to update workout date. Please try again.');
        }
    };


    return (
        <TouchableWithoutFeedback onPress={onClose}>

            <View style={styles.modalBackdrop}>
                <View style={styles.modalContent}>
                    {showCalendarModal ? (
                        // Calendar View
                        <View>
                            <View style={styles.calendarModalHeader}>
                                <TouchableOpacity style={styles.modalBackButton} onPress={() => setShowCalendarModal(false)}>
                                    <Ionicons name="arrow-back" size={24} color="black" />
                                </TouchableOpacity>
                                <Text style={styles.modalTitle}>Select date</Text>
                                <DateTimePicker
                                    value={selectedDate}
                                    mode="date" // Show date picker
                                    // display="default" // Native picker UI style
                                    onChange={onDateChange} // Handle date selection
                                    style={styles.dateButton}
                                />
                            </View>

                            <TouchableOpacity
                                style={styles.modalButtonFilled}
                                onPress={handleAddToCalendar}
                            >
                                <Text style={styles.modalButtonTextFilled}>Add</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        // Main Modal View
                        <>
                            {modalRoute === 'Resave' ?
                                workoutPlan.status === 'Completed' ?
                                    <>
                                        <TouchableOpacity
                                            style={styles.modalButtonFilled}
                                            onPress={() => {
                                                setUserNeed('Duplicate')
                                                setShowCalendarModal(true)
                                            }}                                         
                                            >
                                            <Text style={styles.modalButtonTextFilled}>Duplicate workout</Text>
                                        </TouchableOpacity>
                                    </>
                                    :
                                    <>
                                        <TouchableOpacity
                                            style={styles.modalButtonOutline}
                                            onPress={deleteWorkout}
                                        >
                                            <Text style={styles.modalButtonText}>Delete workout</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.modalButtonThird}
                                            onPress={() => {
                                                setUserNeed('Reschedule')
                                                setShowCalendarModal(true)
                                            }}
                                        >
                                            <Text style={styles.modalButtonTextFilled}>Reschedule workout</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.modalButtonFilled}
                                            onPress={() => {
                                                setUserNeed('Duplicate')
                                                setShowCalendarModal(true)
                                            }} 
                                        >
                                            <Text style={styles.modalButtonTextFilled}>Duplicate workout</Text>
                                        </TouchableOpacity>
                                    </>
                                :
                                <>
                                    <TouchableOpacity
                                        style={styles.modalButtonOutline}
                                        onPress={handleSaveWorkout}
                                    >
                                        <Text style={styles.modalButtonText}>Save workout</Text>
                                    </TouchableOpacity><TouchableOpacity
                                        style={styles.modalButtonFilled}
                                        onPress={() => setShowCalendarModal(true)} // Open Calendar Screen
                                    >
                                        <Text style={styles.modalButtonTextFilled}>Add to calendar</Text>
                                    </TouchableOpacity>
                                </>
                            }

                        </>
                    )}
                </View>
            </View>
        </TouchableWithoutFeedback>
    )
};


const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
        // backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: 'white',
        padding: 20,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 40,
        paddingBottom: 60,
        // height: 200,
    },
    modalButtonOutline: {
        borderWidth: 1,
        borderColor: 'black',
        borderRadius: 25,
        paddingVertical: 12,
        paddingHorizontal: 20,
        alignItems: 'center',
        marginBottom: 15,
    },
    modalButtonThird: {
        backgroundColor: 'grey',
        borderWidth: 1,
        borderColor: 'black',
        borderRadius: 25,
        paddingVertical: 12,
        paddingHorizontal: 20,
        alignItems: 'center',
        marginBottom: 15,
    },
    modalButtonFilled: {
        backgroundColor: 'black',
        borderRadius: 25,
        paddingVertical: 12,
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    modalButtonText: {
        color: 'black',
        fontSize: 16,
        fontWeight: 'bold',
    },
    modalButtonTextFilled: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    calendarModal: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        // padding: 20,
    },
    calendarModalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginLeft: 10,
        marginRight: 30,
    },
    modalButtonAdd: {
        marginTop: 20,
        padding: 10,
        backgroundColor: "black",
        borderRadius: 5,
    },
    modalBackButton: {
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'black',
        width: 40,
        height: 40,
        borderRadius: 25,
    },
});