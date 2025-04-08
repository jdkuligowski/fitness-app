import React, { useState, useEffect, useRef } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    FlatList,
    ActivityIndicator,
    Dimensions,
    ScrollView,
    Alert,
    Image,
    Modal
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Colours } from "@/app/src/components/styles";
import ENV from '../../../../../env'
import { useLoader } from '@/app/src/context/LoaderContext';
import SaveWorkoutModal from "../../modalScreens/SaveWorkoutModal";
import AsyncStorage from '@react-native-async-storage/async-storage';

const SCREEN_WIDTH = Dimensions.get("window").width;

export default function SuggestedRunningWorkouts({ route }) {
    const navigation = useNavigation();
    const { selectedTime, selectedWorkout, fiveKmMinutes, fiveKmSeconds } = route.params;
    const [workouts, setWorkouts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filteredWorkouts, setFilteredWorkouts] = useState([]);
    const flatListRef = useRef(null);
    const { setIsBouncerLoading, isBouncerLoading } = useLoader(); // Access loader functions
    const [currentWorkout, setCurrentWorkout] = useState(null); // Store the current workout for the modal
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Fetch workouts from the server
    const fetchWorkouts = async () => {
        try {
            const response = await axios.get(`${ENV.API_URL}/api/running_sessions/all/`);
            setWorkouts(response.data);
            setIsLoading(false);
        } catch (error) {
            console.error("Error fetching running workouts:", error);
            Alert.alert("Error", "Could not fetch workouts. Please try again.");
            setIsLoading(false);
        }
    };

    // User's 5k time in seconds
    const user5kTimeInSeconds = (fiveKmMinutes * 60) + fiveKmSeconds;

    // Calculate user's average pace per km in seconds
    const userPacePerKmInSeconds = user5kTimeInSeconds / 5;

    // Calculate easy pace as +1 minute 15 seconds (75 seconds) slower than the user's pace
    const warmupCooldownPaceInSeconds = userPacePerKmInSeconds + 75; // Easy pace

    /**
     * Parses the target_pace from the DB.
     * - If "Easy", returns warmupCooldownPaceInSeconds.
     * - Otherwise, parses any integer (positive or negative) and adjusts from userPacePerKmInSeconds.
     */
    const calculateTargetPace = (rawTargetPace) => {
        if (rawTargetPace == null) {
            console.warn("Missing target_pace:", rawTargetPace);
            return userPacePerKmInSeconds;
        }

        // Always convert to string
        const targetPaceStr = String(rawTargetPace).trim().toLowerCase();

        if (!targetPaceStr) {
            console.warn("Invalid target_pace:", rawTargetPace);
            return userPacePerKmInSeconds;
        }

        if (targetPaceStr === "easy") {
            return warmupCooldownPaceInSeconds; // Easy pace
        }

        // If it's numeric (ex: '327'), parse it
        const adjustment = parseInt(targetPaceStr, 10);
        if (isNaN(adjustment)) {
            console.warn(`Could not parse target pace: "${rawTargetPace}"`);
            return userPacePerKmInSeconds;
        }

        return userPacePerKmInSeconds - adjustment;
    };



    /**
     * Calculate the total time for a single interval set (including rests).
     */
    const calculateIntervalDuration = (interval) => {
        // 1) Calculate target pace in seconds
        const splitTimePerKm = calculateTargetPace(interval.target_pace);

        // 2) Multiply by distance * number of repeats
        const intervalTime = splitTimePerKm * interval.repeat_distance * interval.repeats;

        // 3) Add rest time (for repeats-1, if applicable)
        const restTime = interval.rest_time || 0;
        const totalRestTime = (interval.repeats - 1) * restTime;

        return intervalTime + totalRestTime;
    };

    // Calculate total workout duration (in minutes)
    const calculateWorkoutDuration = (workout) => {
        // Sum intervals
        const intervalsDuration = workout.intervals.reduce(
            (sum, interval) => sum + calculateIntervalDuration(interval),
            0
        );

        // Warmup and cooldown
        const warmupTime = workout.warmup_distance * warmupCooldownPaceInSeconds;
        const coolDownTime = workout.cool_down_distance * warmupCooldownPaceInSeconds;

        const totalTimeInSeconds = intervalsDuration + warmupTime + coolDownTime;
        // console.log('Cool down: ', totalTimeInSeconds)
        // console.log('Warm up: ', warmupTime)
        // console.log('Intervals: ', intervalsDuration)
        // console.log('Workout time: ', totalTimeInSeconds)
        return totalTimeInSeconds / 60; // Convert to minutes
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.round(seconds % 60);
        return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
    };

    /**
     * Filter workouts based on user input.
     * If "Easy", we skip the database filter and create a single run suggestion.
     */
    const filterWorkouts = () => {
        const totalTimeSec = selectedTime * 60; // Convert total time to seconds
        const maxDistance = totalTimeSec / warmupCooldownPaceInSeconds; // Calculate max distance for the Easy run
        console.log('max distance: ', maxDistance)
        // Map through workouts and override data for "Easy" runs
        const filtered = workouts.map((workout) => {
            if (workout.session_type === "Easy") {
                return {
                    ...workout,
                    isEasyRunItem: true, // Flag to identify it
                    warmup_distance: 0, // No warmup
                    cool_down_distance: 0, // No cooldown
                    total_distance: maxDistance.toFixed(2), // Override with dynamically calculated distance
                    intervals: [
                        {
                            ...workout.intervals[0], // Use the first interval structure if available
                            repeat_variation: 1,
                            repeats: 1, // Single interval
                            repeat_distance: maxDistance.toFixed(2), // Override distance
                            target_pace: warmupCooldownPaceInSeconds, // Override pace
                            rest_time: 0, // No rest
                        },
                    ],
                };
            }
            return workout; // Keep other workouts as-is
        });

        // Filter the workouts based on selected criteria
        const finalFiltered = filtered.filter((workout) => {
            const duration = calculateWorkoutDuration(workout);
            const matchesType =
                selectedWorkout === "Not sure" || workout.session_type === selectedWorkout;
            return matchesType && duration <= selectedTime;
        });

        setFilteredWorkouts(finalFiltered);
    };



    useEffect(() => {
        fetchWorkouts();
    }, []);

    useEffect(() => {
        if (workouts.length > 0) {
            filterWorkouts();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [workouts, selectedWorkout]);


    const showModalForWorkout = (workout) => {
        let augmentedWorkout;

        if (workout.isEasyRunItem) {
            // For "Easy" run, override certain fields while keeping a consistent structure
            const totalTimeSec = selectedTime * 60;
            const maxDistance = totalTimeSec / warmupCooldownPaceInSeconds; // Dynamically calculate distance

            const augmentedIntervals = [
                {
                    repeat_variation: 1,
                    repeats: 1, // Single interval
                    repeat_distance: maxDistance.toFixed(2), // Override distance
                    targetPaceInSeconds: warmupCooldownPaceInSeconds, // Override pace
                    rest_time: 0,
                    splitTimes: [
                        {
                            repeat_number: 1,
                            time_in_seconds: selectedTime,
                            actual_time: null, // Placeholder for user input
                            comments: null, // Placeholder for user input
                        },
                    ],
                },
            ];

            augmentedWorkout = {
                ...workout,
                augmentedIntervals,
                warmupPace: 0, // No warmup
                cooldownPace: 0, // No cooldown
                total_distance: maxDistance.toFixed(2), // Override total distance
            };
        } else {
            // For other workouts, augment intervals with calculated target pace
            const augmentedIntervals = workout.intervals.map((interval) => ({
                ...interval,
                targetPaceInSeconds: calculateTargetPace(interval.target_pace),
            }));

            augmentedWorkout = {
                ...workout,
                warmupPace: warmupCooldownPaceInSeconds,
                cooldownPace: warmupCooldownPaceInSeconds,
                augmentedIntervals,
            };
        }

        setCurrentWorkout(augmentedWorkout);
    };


    const saveAndStartRunningWorkout = async (workoutPlan) => {
        setIsBouncerLoading(true);
        try {
            const userId = await AsyncStorage.getItem("userId");
            if (!userId) throw new Error("User ID not found in AsyncStorage.");

            const formattedDate = new Date().toISOString().split("T")[0];

            console.log('Run to save and start:', JSON.stringify(workoutPlan, null, 2));

            // Construct the payload
            const payload = {
                user_id: userId,
                name: `${workoutPlan.session_name || "Running"}`,
                description: workoutPlan.session_name || "Running workout session",
                duration: workoutPlan.session_type === "Easy"
                    ? selectedTime
                    : calculateWorkoutDuration(workoutPlan), // Total time in minutes
                status: "Started",
                scheduled_date: formattedDate,
                activity_type: "Running",
                running_sessions: {
                    running_session_id: workoutPlan.id,
                    warmup_distance: workoutPlan.warmup_distance,
                    cooldown_distance: workoutPlan.cool_down_distance, // Corrected key
                    total_distance: workoutPlan.total_distance,
                    rpe: null,
                    comments: null,
                    suggested_warmup_pace: warmupCooldownPaceInSeconds,
                    suggested_cooldown_pace: warmupCooldownPaceInSeconds,
                    saved_intervals: workoutPlan.intervals.map((interval) => ({
                        repeat_variation: interval.repeat_variation,
                        repeats: interval.repeats,
                        repeat_distance: interval.repeat_distance,
                        target_interval: workoutPlan.session_type === "Easy"
                            ? warmupCooldownPaceInSeconds
                            : calculateTargetPace(interval.target_pace),
                        comments: interval.comments || null,
                        rest_time: interval.rest_time || null,
                        split_times: Array.from({ length: interval.repeats }, (_, index) => ({
                            repeat_number: index + 1,
                            time_in_seconds: workoutPlan.session_type === "Easy"
                                ? warmupCooldownPaceInSeconds
                                : calculateTargetPace(interval.target_pace),
                            actual_time: null,
                            comments: null,
                        })),
                    })),
                },
            };

            console.log("Payload for save and start (Running):", JSON.stringify(payload, null, 2));

            // Save the workout
            const response = await axios.post(`${ENV.API_URL}/api/saved_workouts/save-workout/`, payload);
            console.log("Response from save (Running):", response.data);

            // Extract the ID of the saved workout
            const savedWorkoutId = response.data?.workout_id;

            if (!savedWorkoutId) {
                console.error("Workout ID is undefined, check API response:", response.data);
                Alert.alert("Error", "Failed to save workout. Please try again.");
                setIsBouncerLoading(false);
                return;
            }

            console.log("New Running Workout ID ->", savedWorkoutId);

            // Fetch workout details and intervals
            const workoutDetailsResponse = await axios.get(
                `${ENV.API_URL}/api/saved_workouts/get-single-workout/${savedWorkoutId}/`,
                { params: { user_id: userId } }
            );

            const { workout } = workoutDetailsResponse.data;
            console.log("Workout details (Running) ->", JSON.stringify(workout, null, 2));

            setIsBouncerLoading(false);

            // Navigate to the complete workout screen
            navigation.navigate("Training", {
                screen: "CompleteRunningWorkout",
                params: {
                    workout: workout,
                    activityType: workout.activity_type,
                },
            });
        } catch (error) {
            console.error("Error saving and starting running workout:", error?.response?.data || error.message);
            Alert.alert("Error", "There was an error starting your running workout. Please try again.");
            setIsBouncerLoading(false);
        }
    };




    const closeModal = () => {
        setCurrentWorkout(null);
        setShowDatePicker(false);
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#E87EA1" />
                <Text>Loading running workouts...</Text>
            </View>
        );
    }

    const IntervalTime = ({ time }) => (
        <View style={styles.intervalTimeContainer}>
            <Text style={styles.intervalTimeText}>{time}</Text>
        </View>
    );

    const renderWorkoutItem = ({ item }) => {
        // If it's the synthetic "Easy Run" item
        if (item.isEasyRunItem) {
            return (
                <View style={styles.workoutCard}>
                    <View style={styles.workoutOverview}>
                        <View
                            style={[
                                styles.colorStrip,
                                { backgroundColor: Colours.runningColour },
                            ]}
                        />
                        <View style={styles.overviewBox}>
                            <View style={styles.overviewHeader}>
                                <View>
                                    <Text style={styles.workoutTitle}>Easy run</Text>
                                    <View style={styles.workoutOverviewTime}>
                                        <Ionicons name="time-outline" size={24} color="black" />
                                        <Text style={styles.timeText}>{selectedTime} mins</Text>
                                    </View>
                                </View>
                                <TouchableOpacity
                                    style={styles.profileButton}
                                    onPress={() => showModalForWorkout(item)} // Set modal for current workout
                                >
                                    <Ionicons name="ellipsis-vertical-outline" color={'black'} size={24} />
                                </TouchableOpacity>
                            </View>
                            <View style={styles.workoutSummaryArray}>
                                {/* <Text style={styles.workoutSummaryButton}>Intermediate</Text> */}
                                <Text style={styles.workoutSummaryButton}>Running session</Text>
                                {/* <Text style={styles.workoutSummaryButton}>{workoutPlans.length} sections</Text> */}
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

                    <View style={styles.dividerLine} />
                    <Text style={styles.workoutActivity}>Recommended Easy Run</Text>

                    {/* Show distance & pace details */}
                    <View style={styles.workoutList}>
                        <Text style={styles.movementDetail}>
                            You can cover about{" "}
                            {item.total_distance !== undefined ? (
                                <Text style={{ fontWeight: "700" }}>
                                    {parseFloat(item.total_distance).toFixed(2)} km
                                </Text>
                            ) : (
                                <Text style={{ fontWeight: "700" }}>N/A</Text> // Fallback if maxDistance is missing
                            )}{" "}
                            in {selectedTime} min at an easy pace of{" "}
                            <Text style={{ fontWeight: "700" }}>
                                {formatTime(warmupCooldownPaceInSeconds)} /km
                            </Text>.
                        </Text>
                    </View>


                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={styles.submitButton}
                            onPress={() => saveAndStartRunningWorkout(item)}
                        >
                            <Text style={styles.submitButtonText}>Start Easy Run</Text>
                            <View style={styles.submitArrow}>
                                <Ionicons name="arrow-forward" size={24} color="black" />
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>
            );
        }

        // Otherwise, render a standard workout item from the DB
        return (
            <View style={styles.workoutCard}>
                {/* ...all your existing code for a normal workout card... */}
                <View style={styles.workoutOverview}>
                    <View
                        style={[
                            styles.colorStrip,
                            { backgroundColor: Colours.runningColour },
                        ]}
                    />
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
                                <Ionicons name="ellipsis-vertical-outline" color={'black'} size={24} />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.workoutSummaryArray}>
                            {/* <Text style={styles.workoutSummaryButton}>Intermediate</Text> */}
                            <Text style={styles.workoutSummaryButton}>Running session</Text>
                            {/* <Text style={styles.workoutSummaryButton}>{workoutPlans.length} sections</Text> */}
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

                <View style={styles.dividerLine} />
                <Text style={styles.workoutActivity}>{item.session_name}</Text>
                {item.notes === "NULL" ?
                    null
                    : (
                        <Text style={styles.summaryDetail}>{item.notes}</Text>
                    )}

                <ScrollView style={styles.workoutList}>
                    {/* Warmup */}
                    <View style={styles.sectionContainer}>
                        {item.warmup_distance === 0 ? '' :
                            <>
                                <Text style={styles.sectionTitle}>Warmup</Text>
                                <View style={styles.intervalContainer}>
                                    {item.warmup_distance < 1 ? (
                                        <View style={styles.timeBox}>
                                            <Text style={styles.movementDetail}>
                                                {item.warmup_distance * 1000}m at
                                            </Text>
                                            <IntervalTime
                                                time={formatTime(warmupCooldownPaceInSeconds)} />
                                        </View>
                                    ) : (
                                        <View style={styles.timeBox}>
                                            <Text style={styles.movementDetail}>
                                                {item.warmup_distance}km at
                                            </Text>
                                            <IntervalTime
                                                time={formatTime(warmupCooldownPaceInSeconds)} />
                                        </View>
                                    )}
                                </View>
                            </>
                        }
                    </View>

                    {/* Intervals */}
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>Intervals</Text>
                        {item.intervals.length > 0 ? (
                            item.intervals.map((interval, index) => {
                                const targetPaceInSeconds = calculateTargetPace(
                                    interval.target_pace
                                );
                                return (
                                    <View key={index} style={styles.intervalContainer}>
                                        <View style={styles.timeBox}>
                                            <Text style={styles.movementDetail}>
                                                {interval.repeats} x{" "}
                                                {interval.repeat_distance < 1
                                                    ? `${interval.repeat_distance * 1000}m`
                                                    : `${interval.repeat_distance}km`}{" "}
                                                at
                                            </Text>
                                            <IntervalTime
                                                time={formatTime(targetPaceInSeconds)}
                                            />
                                        </View>
                                        {interval.rest_time && (
                                            <Text style={styles.movementDetail}>
                                                Rest: {interval.rest_time} seconds between intervals
                                            </Text>
                                        )}
                                    </View>
                                );
                            })
                        ) : (
                            <Text style={styles.movementDetail}>
                                No intervals defined
                            </Text>
                        )}
                    </View>

                    {/* Cooldown */}
                    <View style={styles.sectionContainer}>
                        {item.warmup_distance === 0 ? '' :
                            <>
                                <Text style={styles.sectionTitle}>Cooldown</Text>
                                <View style={styles.intervalContainer}>
                                    {item.cool_down_distance < 1 ? (
                                        <View style={styles.timeBox}>
                                            <Text style={styles.movementDetail}>
                                                {item.cool_down_distance * 1000}m at
                                            </Text>
                                            <IntervalTime
                                                time={formatTime(warmupCooldownPaceInSeconds)}
                                            />
                                        </View>
                                    ) : (
                                        <View style={styles.timeBox}>
                                            <Text style={styles.movementDetail}>
                                                {item.cool_down_distance}km at
                                            </Text>
                                            <IntervalTime
                                                time={formatTime(warmupCooldownPaceInSeconds)}
                                            />
                                        </View>
                                    )}
                                </View>
                            </>
                        }
                    </View>
                </ScrollView>

                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={styles.submitButton}
                        onPress={() => saveAndStartRunningWorkout(item)}
                    >
                        <Text style={styles.submitButtonText}>Start workout</Text>
                        <View style={styles.submitArrow}>
                            <Ionicons name="arrow-forward" size={24} color="black" />
                        </View>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.scrollContainer}>
                {filteredWorkouts.length === 0 ? (
                    <View style={styles.noWorkoutsContainer}>
                        <Text style={styles.noWorkoutsText}>
                            Sorry, we don't have any workouts that match your criteria.
                        </Text>
                        <View style={styles.buttonContainer}>
                            <TouchableOpacity
                                style={styles.submitButton}
                                onPress={() => navigation.goBack()}
                            >
                                <Text style={styles.submitButtonText}>Search again</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    <>
                        <View style={styles.header}>
                            <View style={styles.topSection}>
                                <TouchableOpacity
                                    style={styles.backButton}
                                    onPress={() => navigation.goBack()}
                                >
                                    <Ionicons name="arrow-back" size={24} color="black" />
                                </TouchableOpacity>
                                <Text style={styles.headingText}>Suggested Running Workouts</Text>
                            </View>
                        </View>

                        <FlatList
                            ref={flatListRef}
                            data={filteredWorkouts}
                            horizontal
                            pagingEnabled
                            keyExtractor={(item) => item.id.toString()}
                            showsHorizontalScrollIndicator={false}
                            renderItem={renderWorkoutItem}
                        />

                        {currentWorkout && (
                            <Modal
                                animationType="slide"
                                transparent={true}
                                visible={!!currentWorkout}
                                onRequestClose={closeModal}
                            >
                                <SaveWorkoutModal
                                    currentWorkout={currentWorkout}
                                    onClose={closeModal}
                                    selectedTime={
                                        Math.round(
                                            currentWorkout.isEasyRunItem
                                                ? selectedTime // for easy run, we just use the selectedTime
                                                : calculateWorkoutDuration(currentWorkout)
                                        )
                                    }
                                    selectedWorkout={selectedWorkout}
                                    workoutPlan={currentWorkout}
                                    closeModal={closeModal}
                                    frequency={0}
                                    modalRoute={"Discovery"}
                                    workoutType="Running"
                                />
                            </Modal>
                        )}
                    </>
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
        width: '100%',
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
        width: 50,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
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
        backgroundColor: Colours.secondaryColour,
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
        flexDirection: 'row',

    },
    overviewBox: {
        width: '94%',
        padding: 10,
        backgroundColor: Colours.primaryBackground,
        borderTopRightRadius: 20,
        borderBottomRightRadius: 20,
        justifyContent: 'space-between',
        height: 175,
    },
    overviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    colorStrip: {
        width: 20,
        borderTopLeftRadius: 100,
        borderBottomLeftRadius: 100,
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
        backgroundColor: Colours.secondaryColour,

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
        marginHorizontal: 20,
        marginVertical: 10,
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
        paddingBottom: 0,
        marginBottom: 0,
        // paddingBottom: 5,
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
        paddingTop: 0,
        height: 350,
    },
    sectionContainer: {
        // marginBottom: 10,
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
    timeBox: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    intervalTimeContainer: {
        marginLeft: 5,
        backgroundColor: Colours.runningColour,
        borderRadius: 5,
        padding: 3,
    },
    intervalTimeText: {
        fontSize: 16,
        fontWeight: 600,
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
    summaryDetail: {
        fontSize: 16,
        marginLeft: 20,
        marginTop: 10,
        marginRight: 10,
    },
    movementDescription: {
        fontSize: 16,
        color: "#555",
        lineHeight: 24, // Match the label line height for alignment
        paddingBottom: 5,
    },
    intervalContainer: {
        marginTop: 10,
    },
    buttonContainer: {
        marginVertical: 0,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
        marginTop: 10,
    },
    submitButton: {
        backgroundColor: Colours.buttonColour,
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
    noWorkoutsContainer: {
        height: 700,
        justifyContent: 'center',
        alignItems: 'center',
        width: '95%',
        margin: 20,
    },
    noWorkoutsText: {
        textAlign: 'center',
        marginRight: 20,
        marginBottom: 20,
        fontSize: 20,
    },
    emptyBox: {
        margin: 0,
        padding: 0,
        height: 0,
    },
});
