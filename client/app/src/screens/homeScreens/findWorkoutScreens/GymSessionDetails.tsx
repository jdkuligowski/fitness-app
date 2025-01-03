import React, { useState, useEffect, useRef } from "react";
import { useNavigation } from '@react-navigation/native';
import {
    View, Text, StyleSheet, TouchableOpacity, SafeAreaView, FlatList, ActivityIndicator,
    Image, Dimensions, ScrollView, Modal, TouchableWithoutFeedback, Alert
} from "react-native";
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from "@expo/vector-icons/Ionicons";
import { useWorkout } from "../../../context/WorkoutContext";
import DateTimePicker from "@react-native-community/datetimepicker";
import SaveWorkoutModal from "../../modalScreens/SaveWorkoutModal";
import ENV from '../../../../../env'
import { useLoader } from '@/app/src/context/LoaderContext';
import { Colours } from '@/app/src/components/styles';
import strengthRules30 from '../../../components/workoutRules/strengthRules30'
import strengthRules40 from '../../../components/workoutRules/strengthRules40'
import strengthRules50 from '../../../components/workoutRules/strengthRules50'
import strengthRules60 from '../../../components/workoutRules/strengthRules60'
import commonRules from '../../../components/workoutRules/commonRules'

const SCREEN_WIDTH = Dimensions.get("window").width;

const strengthRulesMap = {
    30: strengthRules30,
    40: strengthRules40,
    50: strengthRules50,
    60: strengthRules60,
};

export default function WorkoutScreen({ route }) {
    const navigation = useNavigation();
    const { setIsBouncerLoading } = useLoader(); // Access loader functions
    const { selectedTime, selectedWorkout, frequency } = route.params;
    const { workoutData, fetchWorkoutData, isLoading } = useWorkout();
    const [workoutPlans, setWorkoutPlans] = useState([]);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showCalendarModal, setShowCalendarModal] = useState(false); // Track Calendar modal visibility
    const [selectedDate, setSelectedDate] = useState(new Date()); // Track selected date
    const [modalRoute, setModalRoute] = useState('')

    const [currentWorkout, setCurrentWorkout] = useState(null); // Store the current workout for the modal

    const flatListRef = useRef(null);

    const [hasSeenAnimation, setHasSeenAnimation] = useState(false);
    const ANIMATION_KEY = 'hasSeenSwipeAnimation';

    // run this animation on first load
    useEffect(() => {
        const checkIfAnimationSeen = async () => {
            // const hasSeen = await AsyncStorage.getItem(ANIMATION_KEY);
            if (!hasSeenAnimation) {
                setTimeout(() => startSwipeAnimation(), 1000); // Delay so everything loads first
            }
        };

        checkIfAnimationSeen();
    }, []);

    // Animation logic
    const startSwipeAnimation = async () => {
        try {
            const ITEM_WIDTH = 300; // Width of each card (customize if different)
            const OFFSET = SCREEN_WIDTH * 0.25; // 25% of the width

            // Scroll to 25% of the second item
            flatListRef.current?.scrollToOffset({ offset: OFFSET, animated: true });

            // Wait for 1 second and then scroll back to 0
            setTimeout(() => {
                flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
            }, 500);

            // Store in AsyncStorage so it only runs once
            // await AsyncStorage.setItem(ANIMATION_KEY, 'true');
            // setHasSeenAnimation(true);
        } catch (error) {
            console.error('Error running swipe animation:', error);
        }
    };



    // Filter workout data for a section
    const filterWorkoutData = (filters, usedExercises = new Set(), workoutType) => {
        if (!filters || !Array.isArray(filters)) {
            console.warn("Invalid filters provided to filterWorkoutData:", filters);
            return [];
        }

        const filteredMovements = filters.flatMap((filterSet) => {
            if (!Array.isArray(filterSet)) {
                // console.warn("Filter set is not an array. Wrapping it:", filterSet);
                filterSet = [filterSet];
            }

            return workoutData.filter((exercise) => {
                const standardizedWorkoutType = workoutType.toLowerCase(); // Standardize workoutType
                const exerciseBodyArea = exercise.body_area?.toLowerCase() || ""; // Standardize exercise body_area

                // Check if this filter set explicitly targets Core
                const isCoreFilter = filterSet.some(
                    ({ key, value }) => key === "primary_body_part" && value.toLowerCase() === "core"
                );

                // Determine if the body area filter should be applied
                const isCorrectBodyArea =
                    isCoreFilter || // If Core is in the filter, bypass body area filtering
                    standardizedWorkoutType === "full body" || // Full Body skips body area filtering
                    exerciseBodyArea.includes(standardizedWorkoutType); // Match Upper/Lower Body for others

                // Apply all conditions in the filter set
                const matchesFilters = filterSet.every(({ key, value, operator }) => {
                    if (!exercise[key]) return false;
                    if (operator === "contains") {
                        return Array.isArray(value)
                            ? value.some((v) => exercise[key].includes(v))
                            : exercise[key].includes(value);
                    }
                    if (operator === "equals") {
                        return exercise[key] === value;
                    }
                    return false;
                });

                return isCorrectBodyArea && matchesFilters;
            });
        });

        // Deduplicate, shuffle, and exclude already used exercises
        const uniqueMovements = Array.from(new Set(filteredMovements.map((m) => m.exercise)));
        return uniqueMovements
            .sort(() => Math.random() - 0.5) // Shuffle for randomness
            .filter((movement) => !usedExercises.has(movement)); // Exclude used exercises
    };



    // Function to handle filtering and random selection for Warm-Up A
    const filterWarmUpA = () => {
        // console.log('common rules ->', commonRules.warmUpA.filters);

        // Flatten filters if they are nested
        const filters = commonRules.warmUpA.filters.flat();

        // Filter exercises matching the Warm-Up A criteria
        const warmUpCandidates = workoutData.filter((exercise) => {
            return filters.every(({ key, value, operator }) => {
                if (!exercise[key]) return false;
                if (operator === "contains") return exercise[key].includes(value);
                if (operator === "equals") return exercise[key] === value;
                return false;
            });
        });

        if (warmUpCandidates.length === 0) {
            console.warn("No candidates found for Warm-Up A.");
            return [];
        }

        // Select one random movement from the candidates
        const selectedExercise = warmUpCandidates[Math.floor(Math.random() * warmUpCandidates.length)];
        return [selectedExercise.exercise]; // Return as an array
    };



    // Function to handle filtering and random selection for Warm-Up B (up to 3 movements)
    const filterWarmUpMovements = (usedExercises, type) => {
        const standardizedType = type.toLowerCase();
        const bodyAreaFilter =
            standardizedType === "upper body" ? "upper body" : standardizedType === "lower body" ? "lower body" : null;

        const warmUpMovements = workoutData.filter(
            (exercise) =>
                exercise.movement_type.includes("Warm Up") &&
                (!bodyAreaFilter || exercise.body_area?.toLowerCase() === bodyAreaFilter) &&
                !usedExercises.has(exercise.exercise)
        );

        const shuffledMovements = warmUpMovements
            .sort(() => Math.random() - 0.5) // Shuffle the array
            .slice(0, 3) // Select up to 3
            .map((movement) => movement.exercise);

        shuffledMovements.forEach((movement) => usedExercises.add(movement));
        return shuffledMovements;
    };

    // Generate a single workout plan
    const generateWorkoutPlan = () => {
        const allowedTimes = [30, 40, 50, 60, 75];
        const closestTime = allowedTimes.reduce((prev, curr) =>
            Math.abs(curr - selectedTime) < Math.abs(prev - selectedTime) ? curr : prev
        );
        console.log(`Adjusted selectedTime from ${selectedTime} to ${closestTime}`);

        const rules = strengthRulesMap[closestTime];
        if (!rules) {
            console.error(`No rules found for ${closestTime} minutes.`);
            return [];
        }

        const workoutKeyBase = selectedWorkout.toLowerCase().replace(/\s/g, "_");
        const workoutKeys = Object.keys(rules).filter((key) => key.startsWith(workoutKeyBase));
        if (workoutKeys.length === 0) {
            console.error(`No workout keys found for type: ${selectedWorkout}`);
            return [];
        }

        const selectedKey = workoutKeys[Math.floor(Math.random() * workoutKeys.length)];
        const selectedRules = rules[selectedKey];
        if (!selectedRules) {
            console.error(`No rules found for selected workout key: ${selectedKey}`);
            return [];
        }

        const usedExercises = new Set();
        const plan = [];

        // Add Warm-Up A Section (1 movement)
        const warmUpA = filterWarmUpA();
        plan.push({
            partLabel: commonRules.warmUpA.section,
            movements: warmUpA,
            sectionType: "single",
        });

        // Add Warm-Up B Section (up to 3 movements)
        const warmUpB = filterWarmUpMovements(usedExercises, selectedWorkout);
        plan.push({
            partLabel: commonRules.warmUpB.section,
            movements: warmUpB,
            sectionType: "superset",
        });

        // Add Main Workout Sections
        selectedRules.sections.forEach((sectionRule) => {
            const movements = [];

            sectionRule.filters.forEach((filterSet) => {
                const movementCandidates = filterWorkoutData(filterSet, usedExercises, selectedWorkout);
                if (movementCandidates.length > 0) {
                    const selectedMovement =
                        movementCandidates[Math.floor(Math.random() * movementCandidates.length)];
                    movements.push(selectedMovement);
                    usedExercises.add(selectedMovement);
                }
            });

            plan.push({
                partLabel: sectionRule.section,
                movements,
                sectionType: movements.length > 1 ? "superset" : "single",
            });
        });

        return plan.slice(0, 9);
    };

    // Generate multiple workout plans
    const generateWorkoutPlans = () => {
        const plans = [];
        for (let i = 0; i < 5; i++) {
            plans.push(generateWorkoutPlan());
        }
        setWorkoutPlans(plans);
        console.log("Generated workout plans:", plans);
    };

    // Fetch data and generate workout plans
    useEffect(() => {
        fetchWorkoutData();
    }, []);

    useEffect(() => {
        if (workoutData.length > 0) {
            generateWorkoutPlans();
        }
    }, [workoutData]);



    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#E87EA1" />
                <Text>Loading workout plans...</Text>
            </View>
        );
    }



    const showModalForWorkout = (workout) => {
        setCurrentWorkout(workout); // Set the workout plan that will be used inside the modal
    };


    const closeModal = () => {
        setCurrentWorkout(null); // Reset the current workout when modal is closed
        setShowDatePicker(false);
    };


    const saveAndStartWorkout = async (workoutPlan) => {
        setIsBouncerLoading(true);
        try {
            const userId = await AsyncStorage.getItem("userId");
            if (!userId) throw new Error('User ID not found in AsyncStorage.');

            const formattedDate = new Date().toISOString().split("T")[0];
            const payload = {
                user_id: userId,
                name: `${selectedWorkout} Workout`,
                description: "Custom generated workout",
                duration: selectedTime,
                complexity: frequency === "Rarely" ? 1 : frequency === "Sometimes" ? 2 : 3,
                status: 'Started',
                scheduled_date: formattedDate,
                sections: workoutPlan.map((section, index) => ({
                    section_name: section.partLabel,
                    section_order: index + 1,
                    section_type: section.sectionType,
                    movements: section.movements.map((movement, movementIndex) => ({
                        movement_name: movement,
                        movement_order: movementIndex + 1,
                    })),
                })),
            };

            console.log('Payload for save and start:', JSON.stringify(payload, null, 2));

            // 1️⃣ Save the workout
            const response = await axios.post(`${ENV.API_URL}/api/saved_workouts/save-workout/`, payload);
            console.log('Response from save:', response.data);

            // Extract the ID of the saved workout
            const savedWorkoutId = response.data?.workout_id;

            if (!savedWorkoutId) {
                console.error('Workout ID is undefined, check API response:', response.data);
                Alert.alert('Error', 'Failed to save workout. Please try again.');
                setIsBouncerLoading(false);
                return;
            }

            console.log('New Workout ID ->', savedWorkoutId);

            // 2️⃣ Fetch workout details and movement history
            const workoutDetailsResponse = await axios.get(`${ENV.API_URL}/api/saved_workouts/get-single-workout/${savedWorkoutId}/`, {
                params: { user_id: userId }
            });

            const { workout, movement_history } = workoutDetailsResponse.data;
            console.log('Workout details ->', workout);
            console.log('Movement history ->', movement_history);
            setIsBouncerLoading(false);
            // 3️⃣ Navigate directly to CompleteWorkout with all the data
            navigation.navigate('Training', {
                screen: 'CompleteWorkout',
                params: {
                    workout: workout,
                    movementHistory: movement_history
                }
            });



        } catch (error) {
            console.error('Error saving and starting workout:', error?.response?.data || error.message);
            Alert.alert('Error', 'There was an error starting your workout. Please try again.');
            setIsBouncerLoading(false);
        }
    };





    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.scrollContainer}>
                <View style={styles.header}>
                    <View style={styles.topSection}>
                        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                            <Ionicons name="arrow-back" size={24} color="black" />
                        </TouchableOpacity>
                        <Text style={styles.headingText}>Here are some gym workouts for you</Text>
                    </View>
                </View>
                <FlatList
                    ref={flatListRef}
                    data={[...workoutPlans, { reload: true }]} // Add a reload page
                    horizontal
                    pagingEnabled
                    keyExtractor={(_, index) => index.toString()}
                    showsHorizontalScrollIndicator={false}
                    renderItem={({ item }) =>
                        item.reload ? (
                            <View style={styles.reloadContainer}>
                                <Text style={styles.reloadText}>Not what you were looking for?</Text>
                                <TouchableOpacity
                                    style={styles.reloadButton}
                                    onPress={generateWorkoutPlans}
                                >
                                    <Text style={styles.reloadButtonText}>Load more</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <>
                                <View style={styles.workoutCard}>
                                    <View style={styles.workoutOverview}>
                                        <View style={styles.overviewBox}>
                                            <View style={styles.overviewHeader}>
                                                <View>
                                                    <Text style={styles.workoutTitle}>{selectedWorkout} session</Text>
                                                    <View style={styles.workoutOverviewTime}>
                                                        <Ionicons name="time-outline" size={24} color="black" />
                                                        <Text style={styles.timeText}>{selectedTime} mins</Text>
                                                    </View>
                                                </View>
                                                <TouchableOpacity
                                                    style={styles.profileButton}
                                                    onPress={() => showModalForWorkout(item)} // Set modal for current workout
                                                >
                                                    <Ionicons name="heart-outline" color={'black'} size={20} />
                                                </TouchableOpacity>
                                            </View>
                                            <View style={styles.workoutSummaryArray}>
                                                <Text style={styles.workoutSummaryButton}>Intermediate</Text>
                                                <Text style={styles.workoutSummaryButton}>Gym session</Text>
                                                <Text style={styles.workoutSummaryButton}>{workoutPlans.length} sections</Text>
                                            </View>
                                            <View style={styles.trainerDetails}>
                                                <Image
                                                    style={styles.trainerImage}
                                                    source={require('../../../../../assets/images/gus_image.jpeg')}
                                                />
                                                <View style={styles.trainerDetailsBox}>
                                                    <Text style={styles.trainerName}>Gus Barton</Text>
                                                    <Text style={styles.trainerTitle}>Head Trainer at Burst</Text>
                                                </View>
                                            </View>
                                        </View>
                                    </View>
                                    <View style={styles.dividerLine}></View>
                                    <Text style={styles.workoutActivity}>Workout Summary</Text>
                                    <ScrollView style={styles.workoutList}>
                                        {item.map((section, index) => (
                                            <View key={index} style={styles.sectionContainer}>
                                                <Text style={styles.sectionTitle}>{section.partLabel}</Text>
                                                {section.movements.map((movement, i) => (
                                                    <View key={i} style={styles.movementRow}>
                                                        {section.partLabel === "Warmup" ? (
                                                            <Text style={styles.movementDescription}>{movement}</Text>
                                                        ) : (
                                                            <Text>
                                                                <Text style={styles.movementLabel}>{`Movement ${i + 1}: `}</Text>
                                                                <Text style={styles.movementDetail}>{movement}</Text>
                                                            </Text>
                                                        )}
                                                    </View>
                                                ))}
                                                <View style={styles.subDividerLine}></View>
                                            </View>
                                        ))}
                                    </ScrollView>
                                    <View style={styles.buttonContainer}>
                                        <TouchableOpacity
                                            style={styles.submitButton}
                                            onPress={() => saveAndStartWorkout(item)}
                                        >
                                            <Text style={styles.submitButtonText}>Start workout</Text>
                                            <View style={styles.submitArrow}>
                                                <Ionicons name="arrow-forward" size={24} color="black" />
                                            </View>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </>
                        )
                    }
                />
                {currentWorkout && (
                    <Modal
                        animationType="slide"
                        transparent={true}
                        visible={!!currentWorkout}
                        onRequestClose={closeModal}
                    >
                        <SaveWorkoutModal
                            currentWorkout={currentWorkout} // Pass the workout object
                            onClose={closeModal} // Pass the close function
                            selectedTime={selectedTime} // Pass the selected time
                            selectedWorkout={selectedWorkout} // Pass the selected workout name
                            workoutPlan={currentWorkout} // Pass the current workout plan
                            closeModal={closeModal} // Close function for modal
                            frequency={frequency}
                            modalRoute={'Discovery'}
                        />
                    </Modal>
                )}


            </View>
        </SafeAreaView>
    );


}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Colours.primaryBackground,
    },
    scrollContainer: {
        flexGrow: 1,
        backgroundColor: Colours.primaryBackground,
        paddingBottom: 100,
    },
    header: {
        padding: 20,
        // backgroundColor: '#FFF4F4',
        // height: 175,
        // borderBottomLeftRadius: 50,
        // borderBottomRightRadius: 50,
        width: '100%',
        // zIndex: 1,
    },
    topSection: {
        flexDirection: 'row',
        alignItems: 'center',
        // flexDirection: 'row',
        // alignItems: 'center',
        // justifyContent: 'space-between',
    },
    backButton: {
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'black',
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    profileButton: {
        backgroundColor: 'white',
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderRightWidth: 1,
        borderBottomWidth: 1,
        borderTopWidth: 1,
        borderLeftWidth: 1,
    },
    workoutTitle: {
        fontWeight: 600,
        fontSize: 18,
        marginBottom: 5
    },
    workoutSummaryArray: {
        flexDirection: 'row',

    },
    workoutSummaryButton: {
        backgroundColor: '#F5EAB7',
        borderWidth: 1,
        borderRadius: 10,
        paddingLeft: 10,
        paddingRight: 10,
        padding: 3,
        marginRight: 5,
    },
    headingText: {
        width: '100%',
        fontSize: 20,
        paddingLeft: 10,
        fontWeight: 600,
        color: 'black',
        flex: 1, // Makes the text take remaining space
    },
    workoutOverview: {
        paddingLeft: 10,
        paddingRight: 10,
        paddingTop: 10,
    },
    overviewBox: {
        width: '100%',
        padding: 10,
        backgroundColor: '#EFE8FF',
        borderRadius: 20,
        justifyContent: 'space-between',
        height: 175,
    },
    overviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    workoutOverviewTime: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    timeText: {
        paddingLeft: 10,
    },
    trainerDetails: {
        flexDirection: 'row',
    },
    trainerImage: {
        width: 35,
        height: 35,
        borderRadius: 10,
        marginRight: 10,
        borderWidth: 1,
    },
    trainerName: {
        fontWeight: 600,
    },
    trainerTitle: {
        fontWeight: 400,
    },
    workoutInfoTiles: {
        flexDirection: 'row',
        marginTop: 10,
        paddingLeft: 10
    },
    workoutCard: {
        width: SCREEN_WIDTH - 40,
        borderRightWidth: 4,
        borderBottomWidth: 4,
        borderTopWidth: 1,
        borderLeftWidth: 1,
        marginLeft: 20,
        marginRight: 20,
        borderRadius: 20,

    },
    workoutInfoTile: {
        paddingLeft: 10,
        paddingRight: 10,
        padding: 5,
        backgroundColor: '#F5EAB7',
        borderRadius: 10,
        marginRight: 10,
        borderWidth: 1,
    },
    dividerLine: {
        borderBottomColor: 'rgba(0, 0, 0, 0.12)',
        borderBottomWidth: 1,
        margin: 20,
        marginTop: 10,
        // marginLeft: 30,
        // marginRight: 30,
    },
    subDividerLine: {
        marginTop: 5,
        marginBottom: 5,
        borderBottomColor: 'rgba(0, 0, 0, 0.12)',
        borderBottomWidth: 1,
    },
    workoutActivity: {
        paddingLeft: 20,
        paddingRight: 20,
        fontWeight: 700,
        fontSize: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 18,
        marginBottom: 20,
    },
    workoutList: {
        padding: 20,
        height: 350,
    },
    sectionContainer: {
        // marginBottom: 5,
        paddingTop: 10,
        // paddingBottom: 10,
        // borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.1)',
        borderRadius: 10,
    },
    sectionTitle: {
        color: "black",
        fontSize: 16,
        fontWeight: "600",

    },
    movementText: {
        fontSize: 16,
        color: "#",
        marginVertical: 5,
    },
    partLabel: {
        fontWeight: 600,
    },
    movementRow: {
        marginVertical: 5, // Space between rows
        flexDirection: 'row',
        paddingLeft: 10,
    },
    movementTextBlock: {
        flexDirection: 'row',

    },
    movementLabel: {
        fontSize: 16,
        color: '#6456B1',
        fontWeight: "500",
        lineHeight: 24,
        width: '30%',
    },
    movementDetail: {
        fontSize: 16,
        color: 'black', // Example color for movement details
    },
    movementDescription: {
        fontSize: 16,
        color: "#555",
        lineHeight: 24, // Match the label line height for alignment
        paddingBottom: 5,
    },
    buttonContainer: {
        marginVertical: 0,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
        marginTop: 10,
    },
    submitButton: {
        backgroundColor: 'black',
        width: '90%',
        height: 50,
        borderRadius: 30,
        flexDirection: 'row', // Align text and arrow in a row
        alignItems: 'center', // Center vertically
        paddingHorizontal: 5, // Add padding for spacing
    },
    submitButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
        flex: 1, // Take up remaining space, centering the text
    },
    submitArrow: {
        backgroundColor: 'white',
        padding: 8,
        borderRadius: 20, // Make the background circular
    },
    reloadContainer: {
        width: SCREEN_WIDTH,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    reloadText: {
        fontSize: 18,
        fontWeight: "600",
        marginBottom: 20,
    },
    reloadButton: {
        backgroundColor: "#E87EA1",
        padding: 15,
        borderRadius: 10,
    },
    reloadButtonText: {
        color: "#fff",
        fontWeight: "600",
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
        // backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
    },
    modalBackdrop: {
        flex: 1,
        // backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: 'white',
        padding: 20,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 40,
        paddingBottom: 40,
        height: 200,
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
