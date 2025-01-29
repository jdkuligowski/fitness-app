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
    frequency, modalRoute, fetchWorkouts, isLoading, setIsBouncerLoading, workoutType }) {

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
            const userId = await AsyncStorage.getItem("userId");
            const formattedDate = selectedDate.toISOString().split("T")[0];
            console.log('Workout to save:', currentWorkout);

            let payload = {
                user_id: userId,
                // name: `${selectedWorkout}`,
                duration: selectedTime,
                status: status,
                scheduled_date: status === "Scheduled" ? formattedDate : null,
                activity_type: workoutType, // Add activity type dynamically
            };

            if (workoutType === "Gym") {
                payload.name =`${selectedWorkout}`,
                payload.description = "Custom generated workout";
                payload.complexity = frequency === "Rarely" ? 1 : frequency === "Sometimes" ? 2 : 3;

                payload.sections = workoutPlan.map((section, index) => {
                    if (section.partLabel === "Conditioning") {
                        return {
                            section_name: section.partLabel,
                            section_order: index + 1,
                            section_type: section.sectionType,
                            conditioning_workout: {
                                conditioning_overview_id: section.workoutId,
                                notes: section.notes,
                                comments: null,
                                rpe: null,
                                movements: section.movements.map((movement, movementIndex) => ({
                                    movement_order: movementIndex + 1,
                                    movement_name: movement.exercise,
                                    detail: movement.detail || null,
                                })),
                            },
                        };
                    } else {
                        return {
                            section_name: section.partLabel,
                            section_order: index + 1,
                            section_type: section.sectionType,
                            movements: section.movements.map((movement, movementIndex) => ({
                                movement_name: movement,
                                movement_order: movementIndex + 1,
                            })),
                        };
                    }
                });
            } else if (workoutType === "Running") {
                payload.name = currentWorkout.session_name;
                payload.description = currentWorkout.session_name;
                payload.complexity = 0; // Fixed complexity for running
                payload.running_sessions = {
                    running_session_id: currentWorkout.id,
                    rpe: workoutPlan.rpe || null,
                    comments: workoutPlan.comments || null,
                    workout_notes: workoutPlan.notes || null,
                    suggested_warmup_pace: workoutPlan.warmupPace,
                    suggested_cooldown_pace: workoutPlan.cooldownPace,
                    warmup_distance: workoutPlan.warmup_distance,
                    cooldown_distance: workoutPlan.cool_down_distance,
                    total_distance: workoutPlan.total_distance,
                    saved_intervals: currentWorkout.augmentedIntervals.map((interval) => ({
                        repeat_variation: interval.repeat_variation,
                        repeats: interval.repeats,
                        repeat_distance: interval.repeat_distance,
                        target_interval: interval.targetPaceInSeconds,
                        comments: interval.comments || null,
                        rest_time: interval.rest_time || null,
                        split_times: Array.from({ length: interval.repeats }, (_, index) => ({
                            repeat_number: index + 1,
                            time_in_seconds: interval.targetPaceInSeconds,
                            actual_time: null,
                            comments: null,
                        })),
                    })),
                };
            } else if (workoutType === "Mobility") {
                payload.description = currentWorkout.summary || "Mobility session";
                payload.name = `${selectedWorkout}`;
                payload.complexity = 0; // Fixed complexity for mobility
                payload.mobility_sessions = {
                    session_id: currentWorkout.id,
                    number_of_movements: currentWorkout.number_of_movements,
                    comments: null,
                    saved_details: currentWorkout.details.map((detail) => ({
                        order: detail.order,
                        duration: detail.duration,
                        movement_name: detail.exercise,
                    })),
                };
            }

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
            console.log("current workout ->", currentWorkout);

            const endpoint =
                currentWorkout.activity_type === "Running"
                    ? `/api/saved_workouts/get-single-running-workout/${workoutId}/`
                    : `/api/saved_workouts/get-single-workout/${workoutId}/`;

            // Fetch full workout details
            const response = await axios.get(`${ENV.API_URL}${endpoint}`, { params: { user_id: userId } });

            const workoutPlan = response.data;
            console.log("workout response ->", workoutPlan);

            if (!workoutPlan) {
                console.warn("Workout plan is missing or undefined.");
                Alert.alert("Error", "Workout data is missing. Please try again.");
                setIsBouncerLoading(false);
                return;
            }

            const formattedDate = selectedDate.toISOString().split("T")[0];
            const activityType = workoutPlan.activity_type || workoutPlan.workout?.activity_type;
            console.log('activity type: ', activityType)
            let payload = {}; // Initialize an empty payload

            if (activityType === "Gym") {
                // Gym workout logic
                payload = {
                    user_id: userId,
                    name: workoutPlan.workout.name || "Unnamed Workout",
                    workout_number: workoutPlan.workout.workout_number,
                    description: workoutPlan.workout.description || "No description",
                    duration: workoutPlan.workout.duration || 0,
                    complexity: workoutPlan.workout.complexity || 0,
                    status: status,
                    activity_type: workoutPlan.workout.activity_type,
                    scheduled_date: status === "Scheduled" ? formattedDate : null,
                    sections: workoutPlan.workout.workout_sections.map((section, index) => {
                        if (section.section_name === "Conditioning") {
                            return {
                                section_name: section.section_name,
                                section_order: index + 1,
                                section_type: section.section_type,
                                conditioning_workout: {
                                    conditioning_overview_id: section.conditioning_workout.conditioning_overview_id,
                                    notes: section.conditioning_workout.notes,
                                    rpe: section.conditioning_workout.rpe,
                                    comments: section.conditioning_workout.comments,
                                    movements: section.conditioning_workout.movements.map((movement, movementIndex) => ({
                                        movement_order: movement.movement_order,
                                        movement_name: movement.movement_name,
                                        detail: movement.detail || null,
                                    })),
                                },
                            };
                        } else {
                            return {
                                section_name: section.section_name,
                                section_order: index + 1,
                                section_type: section.section_type,
                                movements: (section.section_movement_details || []).map((movement, movementIndex) => ({
                                    movement_name: movement.movements?.exercise,
                                    movement_order: movementIndex + 1,
                                    movement_difficulty: movement.movement_difficulty || 0,
                                })),
                            };
                        }
                    }),
                };
            } else if (activityType === "Running") {
                // Running workout logic
                const runningSession = workoutPlan.workout.running_sessions[0]; // Assuming only one running session
                payload = {
                    user_id: userId,
                    name: workoutPlan.workout.name || "Unnamed Workout",
                    workout_number: workoutPlan.workout.workout_number,
                    description: workoutPlan.workout.description || "No description",
                    duration: workoutPlan.workout.duration || 0,
                    complexity: workoutPlan.workout.complexity || 0,
                    status: status,
                    activity_type: workoutPlan.workout.activity_type,
                    scheduled_date: status === "Scheduled" ? formattedDate : null,
                    running_sessions: {
                        running_session_id: runningSession.running_session || null,
                        rpe: runningSession?.rpe || null,
                        comments: runningSession?.comments || null,
                        workout_notes: runningSession?.notes || null,
                        suggested_warmup_pace: runningSession?.suggested_warmup_pace || null,
                        suggested_cooldown_pace: runningSession?.suggested_cooldown_pace || null,
                        warmup_distance: runningSession?.warmup_distance || null,
                        cooldown_distance: runningSession?.cooldown_distance || null,
                        total_distance: runningSession?.total_distance || null,
                        saved_intervals: runningSession?.saved_intervals.map((interval) => ({
                            repeat_variation: interval.repeat_variation,
                            repeats: interval.repeats,
                            repeat_distance: interval.repeat_distance,
                            target_interval: interval.target_pace,
                            comments: interval.comments || null,
                            rest_time: interval.rest_time || null,
                            split_times: interval.split_times.map((split, index) => ({
                                repeat_number: index + 1,
                                time_in_seconds: split.time_in_seconds,
                                actual_time: split.actual_time || null,
                                comments: split.comments || null,
                            })),
                        })),
                    },
                };
            }

            console.log("Payload for resave ->", JSON.stringify(payload, null, 2)); // Pretty print with 2 spaces

            // Call the save endpoint
            const saveResponse = await axios.post(`${ENV.API_URL}/api/saved_workouts/save-workout/`, payload);

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