import React, { useState, useEffect, useRef } from "react";
import { useNavigation } from '@react-navigation/native';
import {
    View, Text, StyleSheet, TouchableOpacity, SafeAreaView, FlatList, ActivityIndicator,
    ScrollView, Modal, Alert, Dimensions, Image
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Ionicons from "@expo/vector-icons/Ionicons";
import { useWorkout } from "../../../context/WorkoutContext";
import { useLoader } from '@/app/src/context/LoaderContext';
import { Video } from 'expo-av';
import { Colours } from "@/app/src/components/styles";
const SCREEN_WIDTH = Dimensions.get("window").width;
import ENV from '../../../../../env';

// Import HIIT workout rule files
import tabataWorkouts from '../../../components/hiitRules/tabataRules';
import amrapWorkouts from "../../../components/hiitRules/amrapRules";
import emomWorkouts from "../../../components/hiitRules/emomRules";
import { tenMinBlocks, fifteenMinBlocks, twentyMinBlocks } from "../../../components/hiitRules/3030Rules";
import SaveWorkoutModal from "../../modalScreens/SaveWorkoutModal";

export default function HiitScreen({ route }) {
    const navigation = useNavigation();
    const { setIsBouncerLoading } = useLoader();
    const { selectedTime, selectedWorkout } = route.params;
    const { workoutData, fetchWorkoutData, isLoading } = useWorkout();
    const [workoutPlans, setWorkoutPlans] = useState([]);
    const [selectedMovement, setSelectedMovement] = useState(null);
    const flatListRef = useRef(null);
    const [currentWorkout, setCurrentWorkout] = useState(null);
    const [showDatePicker, setShowDatePicker] = useState(false);

    const workoutDurationLimits = {
        "AMRAP": [10, 15, 20, 30, 40],
        "EMOM": [15, 20, 25, 30, 40, 50],
        "Tabata": [10, 15],
        "30/30": [10, 15, 20],
    };


    const snapTimeToClosestValidValue = (selectedTime, validDurations) => {
        // Ensure we don't exceed the user-specified time
        let closestValid = validDurations
            .filter(time => time <= selectedTime) // Remove options exceeding the input
            .reduce((prev, curr) =>
                Math.abs(curr - selectedTime) < Math.abs(prev - selectedTime) ? curr : prev
                , validDurations[0]); // Default to the smallest if no exact match

        return closestValid;
    };


    const generateHiitWorkout = (selectedWorkout, selectedTime, movementsDB) => {
        const hiitMovementsDB = movementsDB.filter(movement => movement.hiit_flag === 1);
        console.log(`🔥 Filtering HIIT Movements → Found ${hiitMovementsDB.length} suitable exercises`);

        let validDurations = workoutDurationLimits[selectedWorkout] || [10, 15, 20, 25, 30, 40, 50];
        let adjustedTime = snapTimeToClosestValidValue(selectedTime, validDurations);
        let numWorkouts = selectedWorkout === "I don't mind" ? 15 : 10;
        let allWorkouts = [];

        console.log(`⏳ User Selected Time: ${selectedTime} → Snapped to: ${adjustedTime}`);

        if (selectedWorkout === "I don't mind") {
            console.log("🔄 Generating a mixed HIIT selection...");

            if (workoutDurationLimits["Tabata"].includes(adjustedTime)) {
                allWorkouts.push(...generateMultipleWorkouts(
                    tabataWorkouts.map(w => ({ ...w, duration: adjustedTime })),  // ✅ Apply default duration
                    "Tabata",
                    hiitMovementsDB,
                    5
                ));
            }
            if (workoutDurationLimits["AMRAP"].includes(adjustedTime)) {
                allWorkouts.push(...generateMultipleWorkouts(
                    amrapWorkouts.filter(w => Number(w.duration) === adjustedTime).map(w => ({ ...w, style: w.type })),
                    "AMRAP",
                    hiitMovementsDB,
                    3
                ));
            }
            if (workoutDurationLimits["EMOM"].includes(adjustedTime)) {
                // Use the same filter you have in your dedicated "EMOM" case:
                const possibleEmoms = emomWorkouts
                    .filter((w) => {
                        // For 15 or 25 => only combos < 10 movements
                        if ([15, 25].includes(adjustedTime)) {
                            return w.movements.length < 10;
                        }
                        // For 40 or 50 => only combos == 10 movements
                        if ([40, 50].includes(adjustedTime)) {
                            return w.movements.length === 10;
                        }
                        // Otherwise => keep them all (10, 20, 30, etc.)
                        return true;
                    })
                    .map((w) => ({ ...w, duration: adjustedTime }));

                // Then push into your “allWorkouts”
                allWorkouts.push(
                    ...generateMultipleWorkouts(
                        possibleEmoms,
                        "EMOM",
                        hiitMovementsDB,
                        4
                    )
                );
            }

            if (workoutDurationLimits["30/30"].includes(adjustedTime)) {
                allWorkouts.push(...generateMultipleWorkouts(
                    adjustedTime === 10 ? tenMinBlocks :
                        adjustedTime === 15 ? fifteenMinBlocks :
                            twentyMinBlocks,
                    "30/30",
                    hiitMovementsDB,
                    3
                ));
            }

            let formattedWorkouts = allWorkouts
                .sort(() => Math.random() - 0.5)
                .slice(0, numWorkouts);

            console.log("✅ Final Selected Workouts:", JSON.stringify(formattedWorkouts, null, 2));
            return formattedWorkouts;
        }

        console.log(`🎯 Generating specific ${selectedWorkout} workouts...`);

        if (!validDurations.includes(adjustedTime)) {
            console.warn(`⚠️ ${selectedWorkout} is not available for ${selectedTime} mins. Adjusted to ${adjustedTime}.`);
            return [];
        }

        switch (selectedWorkout) {
            case "Tabata":
                allWorkouts.push(...generateMultipleWorkouts(
                    tabataWorkouts.map(w => ({ ...w, duration: adjustedTime })),  // ✅ Apply default duration
                    "Tabata",
                    hiitMovementsDB,
                    numWorkouts
                ));
                break;
            case "AMRAP":
                allWorkouts.push(...generateMultipleWorkouts(
                    amrapWorkouts
                        .filter(w => Number(w.duration) === adjustedTime)
                        .map(w => ({
                            ...w,
                            style: w.type,  // <— Add this
                            type: "AMRAP"   // <— Force "AMRAP" so formatWorkout sees it
                        })),
                    "AMRAP",
                    hiitMovementsDB,
                    numWorkouts
                ));
                break;

            case "EMOM": {
                // Filter based on adjustedTime
                const possibleEmoms = emomWorkouts
                    .filter((workout) => {
                        // 1) For 15 or 25: only combos with fewer than 10 movements
                        if ([15, 25].includes(adjustedTime)) {
                            return workout.movements.length < 10;
                        }
                        // 2) For 40 or 50: only combos with exactly 10 movements
                        if ([40, 50].includes(adjustedTime)) {
                            return workout.movements.length === 10;
                        }
                        // 3) Otherwise (e.g. 10, 20, 30, etc.): keep all combos
                        return true;
                    })
                    .map((w) => ({
                        ...w,
                        duration: adjustedTime,
                    }));

                // Then generate multiple EMOM workouts from the final list
                allWorkouts.push(
                    ...generateMultipleWorkouts(
                        possibleEmoms,
                        "EMOM",
                        hiitMovementsDB,
                        numWorkouts
                    )
                );
                break;
            }
            case "30/30":
                allWorkouts.push(...generateMultipleWorkouts(
                    adjustedTime === 10 ? tenMinBlocks :
                        adjustedTime === 15 ? fifteenMinBlocks :
                            twentyMinBlocks,
                    "30/30",
                    hiitMovementsDB,
                    numWorkouts
                ));
                break;
            default:
                console.error("⚠️ Unrecognized workout type:", selectedWorkout);
                return [];
        }

        let formattedWorkouts = allWorkouts.sort(() => Math.random() - 0.5);
        console.log("✅ Final Selected Workouts:", JSON.stringify(formattedWorkouts, null, 2));

        return formattedWorkouts;
    };




    const generateMultipleWorkouts = (workoutRules, type, movementsDB, count) => {
        let generatedWorkouts = [];

        for (let i = 0; i < count; i++) {
            let randomWorkout = workoutRules[Math.floor(Math.random() * workoutRules.length)];
            let formattedWorkout = formatWorkout({ ...randomWorkout, type }, movementsDB);
            generatedWorkouts.push(formattedWorkout);
        }

        return generatedWorkouts;
    };

    const formatWorkout = (workout, movementsDB) => {
        let usedMovements = new Set();

        const getRandomMovement = (filter) => {
            console.log(`🔎 Filtering for: ${filter.key} contains '${filter.value}'`);

            let matchingMovements = movementsDB.filter(movement =>
                movement[filter.key]?.includes(filter.value)
            );

            console.log(`✅ Found ${matchingMovements.length} matching movements:`, matchingMovements.map(m => m.exercise));

            if (matchingMovements.length === 0) {
                console.warn(`⚠️ No match found for: ${filter.value}, returning default.`);
                return { exercise: filter.value };
            }

            matchingMovements.sort(() => Math.random() - 0.5);
            console.log("🔀 Shuffled Movements:", matchingMovements.map(m => m.exercise));

            let selectedMovement = matchingMovements.find(movement =>
                filter.value.toLowerCase().includes("conditioning") || !usedMovements.has(movement.exercise)
            );

            if (selectedMovement) {
                usedMovements.add(selectedMovement.exercise);
                console.log(`✅ Selected movement: ${selectedMovement.exercise}`);
                return selectedMovement;
            }

            console.warn(`⚠️ All possible matches were used. Returning fallback: ${filter.value}`);
            return { exercise: filter.value };
        };

        console.log(`🔹 Formatting ${workout.type} Workout`);

        // ✅ Correct AMRAP formatting
        if (workout.type === "AMRAP") {
            return {
                type: "AMRAP",
                structure: `Complete ${workout.style} with 1-3 mins rest in between`,
                duration: workout.duration || null,
                sections: workout.amraps.map((amrap, index) => ({
                    blockName: `Block ${index + 1}`,
                    repScheme: amrap.repScheme,
                    movements: amrap.movements.map(filter => getRandomMovement(filter)),
                })),
            };
        }

        // ✅ Correct EMOM formatting
        if (workout.type === "EMOM") {
            let validDurations = workoutDurationLimits[workout.type] || [10, 15, 20, 25, 30, 40];

            return {
                type: "EMOM",
                structure: "Perform one movement every minute and loop through these for the time available",
                duration: snapTimeToClosestValidValue(selectedTime, validDurations),
                movements: workout.movements.map(filter => getRandomMovement(filter)),
            };
        }

        // ✅ Correct 30/30 formatting
        if (workout.type === "30/30") {
            let validDurations = workoutDurationLimits[workout.type] || [10, 15, 20, 25, 30];

            return {
                type: "30/30",
                structure: "Alternate between movements every 30 seconds without taking any rest",
                duration: snapTimeToClosestValidValue(selectedTime, validDurations),
                blocks: workout.movements.length / 2,
                movements: workout.movements.map(filter => getRandomMovement(filter)),

            };
        }

        // ✅ Correct Tabata formatting
        if (workout.type === "Tabata") {
            let validDurations = workoutDurationLimits[workout.type] || [10, 15, 20, 25, 30];
            return {
                type: "Tabata",
                structure: "20s work / 10s rest and rotate through the movements until the time is up",
                duration: snapTimeToClosestValidValue(selectedTime, validDurations),
                movements: workout.movements.map(filter => getRandomMovement(filter)),
            };
        }

        // ✅ Default case (failsafe)
        return {
            type: workout.type,
            repScheme: workout.repScheme || null,
            movements: workout.movements.map(filter => getRandomMovement(filter)),
        };
    };


    // Fetch and generate workouts on mount
    useEffect(() => {
        fetchWorkoutData();
    }, []);

    useEffect(() => {
        if (workoutData.length > 0) {
            setWorkoutPlans(generateHiitWorkout(selectedWorkout, selectedTime, workoutData));
        }
    }, [selectedWorkout, selectedTime, workoutData]);



    const showModalForWorkout = (workout) => {
        setCurrentWorkout(workout); // Set the workout plan that will be used inside the modal
    };


    const closeModal = () => {
        setCurrentWorkout(null); // Reset the current workout when modal is closed
        setShowDatePicker(false);
    };


    const saveAndStartHiitWorkout = async (workoutPlan) => {
        setIsBouncerLoading(true);
        try {
            const userId = await AsyncStorage.getItem("userId");
            if (!userId) throw new Error("User ID not found in AsyncStorage.");

            const formattedDate = new Date().toISOString().split("T")[0];

            console.log('HIIT workout to save and start:', JSON.stringify(workoutPlan, null, 2));

            // Construct the payload
            const payload = {
                user_id: userId,
                name: workoutPlan.type ? `${workoutPlan.type} HIIT Workout` : "HIIT Workout",
                description: "High-intensity interval training session",
                duration: workoutPlan.duration,  // Total time in minutes
                status: "Started",  // 🚀 Set to "Started" since we want to start immediately
                scheduled_date: formattedDate,
                activity_type: "Hiit",
                workout_type: workoutPlan.type,  // e.g., "Tabata", "AMRAP", etc.
                structure: workoutPlan.structure, // e.g., "20s work / 10s rest"

                // Handling AMRAP vs. Other HIIT Types
                sections: workoutPlan.type === "AMRAP"
                    ? workoutPlan.sections.map((section, index) => ({
                        block_name: section.blockName || `Block ${index + 1}`,
                        rep_scheme: section.repScheme || null,
                        movements: section.movements.map((movement, movementIndex) => ({
                            id: movement.id || null,
                            exercise: movement.exercise || "Unknown Movement",
                            movement_name: movement.exercise || "Unknown Movement",
                            movement_order: movementIndex + 1,
                            rest_period: movement.exercise === "Rest",
                        })),
                    }))
                    : [{
                        block_name: "Workout Block",
                        movements: workoutPlan.movements.map((movement, movementIndex) => ({
                            id: movement.id || null,
                            exercise: movement.exercise || "Unknown Movement",
                            movement_name: movement.exercise || "Unknown Movement",
                            movement_order: movementIndex + 1,
                            rest_period: movement.exercise === "Rest",
                        })),
                    }],
            };

            console.log("Payload for save and start (HIIT):", JSON.stringify(payload, null, 2));

            // Save the workout
            const response = await axios.post(`${ENV.API_URL}/api/saved_workouts/save-workout/`, payload);
            console.log("Response from save (HIIT):", response.data);

            // Extract the ID of the saved workout
            const savedWorkoutId = response.data?.workout.id;

            if (!savedWorkoutId) {
                console.error("Workout ID is undefined, check API response:", response.data);
                Alert.alert("Error", "Failed to save workout. Please try again.");
                setIsBouncerLoading(false);
                return;
            }

            console.log("New HIIT Workout ID ->", savedWorkoutId);

            // Fetch workout details
            const workoutDetailsResponse = await axios.get(
                `${ENV.API_URL}/api/saved_workouts/get-single-hiit-workout/${savedWorkoutId}/`,
                { params: { user_id: userId } }
            );

            const { workout } = workoutDetailsResponse.data;
            console.log("Workout details (HIIT) ->", JSON.stringify(workout, null, 2));

            setIsBouncerLoading(false);

            // Navigate to the complete workout screen
            navigation.navigate("Training", {
                screen: "CompleteHiitWorkout",
                params: {
                    workout: workout,
                },
            });
        } catch (error) {
            console.error("Error saving and starting HIIT workout:", error?.response?.data || error.message);
            Alert.alert("Error", "There was an error starting your HIIT workout. Please try again.");
            setIsBouncerLoading(false);
        }
    };




    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#E87EA1" />
                <Text>Loading HIIT workouts...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="black" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Hiit workouts</Text>
                </View>

                <FlatList
                    ref={flatListRef}
                    data={[...workoutPlans, { reload: true }]}
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
                                    onPress={() => setWorkoutPlans(generateHiitWorkout(selectedWorkout, selectedTime, workoutData))}
                                >
                                    <Text style={styles.reloadButtonText}>Load more</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={styles.workoutCard}>
                                <View style={styles.workoutOverview}>
                                    <View style={styles.overviewBox}>
                                        <View style={styles.overviewHeader}>
                                            <View>
                                                <Text style={styles.workoutTitle}>{item.type} session</Text>
                                                <View style={styles.workoutOverviewTime}>
                                                    <Ionicons name="time-outline" size={24} color="black" />
                                                    <Text style={styles.timeText}>{item.duration} mins</Text>
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
                                            <Text style={styles.workoutSummaryButton}>Hiit session</Text>
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
                                {/* <Text style={styles.workoutActivity}>Workout Summary</Text> */}
                                <Text style={styles.workoutSubActivity}>{item.structure}</Text>
                                <ScrollView style={styles.workoutList}>
                                    {item.sections ? (
                                        item.sections.map((section, index) => (
                                            <View key={index} style={styles.sectionContainer}>
                                                <Text style={styles.sectionTitle}>AMRAP {section.blockName}: {section.repScheme}</Text>
                                                {section.movements.map((movement, index) => (
                                                    <View key={index} style={styles.movementRow}>
                                                        <View style={styles.movementLeft}>
                                                            <Text style={styles.movementValue}>{`${index + 1}: `}</Text>
                                                            <Text style={styles.movementDetail}>{movement.exercise || "Unknown Movement"}</Text>
                                                        </View>
                                                        {/* <Text>{movement.exercise}</Text> */}
                                                        <TouchableOpacity onPress={() => setSelectedMovement(movement)}>
                                                            <Ionicons name="play-circle" size={24} color="black" />
                                                        </TouchableOpacity>
                                                    </View>
                                                ))}
                                            </View>
                                        ))
                                    ) : (
                                        item.movements.map((movement, index) => (
                                            <View key={index} style={styles.movementRow}>
                                                <View style={styles.movementLeft}>
                                                    <Text style={styles.movementValue}>{`${index + 1}: `}</Text>
                                                    <Text style={styles.movementDetail}>{movement.exercise || "Unknown Movement"}</Text>
                                                </View>
                                                {movement.exercise === "Rest" ? "" :
                                                    <TouchableOpacity onPress={() => setSelectedMovement(movement)}>
                                                        <Ionicons name="play-circle" size={24} color="black" />
                                                    </TouchableOpacity>
                                                }
                                            </View>
                                        ))
                                    )}
                                </ScrollView>
                                <View style={styles.buttonContainer}>
                                    <TouchableOpacity
                                        style={styles.submitButton}
                                        onPress={() => saveAndStartHiitWorkout(item)}
                                    >
                                        <Text style={styles.submitButtonText}>Start Workout</Text>
                                        <View style={styles.submitArrow}>
                                            <Ionicons name="arrow-forward" size={24} color="black" />
                                        </View>
                                    </TouchableOpacity>
                                </View>
                            </View>
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
                            selectedWorkout={currentWorkout.workout_name} // Pass the selected workout name
                            workoutPlan={currentWorkout} // Pass the current workout plan
                            closeModal={closeModal} // Close function for modal
                            frequency=''
                            modalRoute={'Discovery'}
                            workoutType="Hiit"
                        />
                    </Modal>
                )}

                {selectedMovement && (
                    <Modal
                        animationType="slide"
                        transparent={false}
                        visible={!!selectedMovement}
                        onRequestClose={() => setSelectedMovement(null)}
                    >
                        <View style={styles.modalContainer}>
                            {selectedMovement?.portrait_video_url ? (
                                <Video
                                    source={{ uri: selectedMovement.portrait_video_url }}
                                    style={styles.fullScreenVideo}
                                    resizeMode="contain"
                                    useNativeControls
                                    shouldPlay
                                    onError={(error) => console.error("Video Error:", error)}
                                />
                            ) : (
                                <Text style={styles.noVideoText}>Video coming soon</Text>
                            )}
                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={() => setSelectedMovement(null)}
                            >
                                <Ionicons name="close" size={30} color="white" />
                            </TouchableOpacity>
                        </View>
                    </Modal>
                )}
            </ScrollView>
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
        flexDirection: 'row',
        alignItems: 'center',
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
        backgroundColor: '#FFFFEF',
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
        backgroundColor: '#F6F6DC',
        height: 650,
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
    workoutSubActivity: {
        paddingLeft: 20,
        paddingRight: 20,
        fontWeight: 400,
        fontSize: 14,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        marginLeft: 10,
    },
    subtitle: {
        fontSize: 18,
        marginBottom: 20,
    },
    workoutList: {
        padding: 20,
        // height: 350,
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
        alignItems: 'center',
        // justifyContent: 'space-between',
    },
    movementLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '85%',
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
    movementValue: {
        fontSize: 16,
        color: '#6456B1',
        fontWeight: "500",
        lineHeight: 24,
        // width: '30%',
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
    modalContainer: {
        flex: 1,
        backgroundColor: "black",
        justifyContent: "center",
        alignItems: "center",
    },
    fullScreenVideo: {
        width: "100%",
        height: "100%",
    },
    closeButton: {
        position: "absolute",
        top: 40,
        right: 20,
        backgroundColor: "rgba(0,0,0,0.5)",
        borderRadius: 20,
        padding: 10,
    },
    thumbnail: {
        width: 100,
        height: 100,
        marginBottom: 10,
        borderRadius: 8,
        backgroundColor: "#DDD",
        justifyContent: "center",
        alignItems: "center",
    },
    noVideoText: {
        fontSize: 14,
        color: "gray",
    },
    overlay: {
        position: "absolute",
        justifyContent: 'center',
        alignItems: 'center',
        top: 120,
        width: '70%',
        // left: 0,
        // right: 0,
        borderRadius: 5,
        backgroundColor: "rgba(0, 0, 0, 0.5)", // Semi-transparent background
        padding: 10,
        zIndex: 10, // Ensure it appears above the video
    },
    overlayText: {
        color: "white",
        fontSize: 14,
        textAlign: "center",
        fontWeight: "bold",
    },
});