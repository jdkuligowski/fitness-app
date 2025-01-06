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
    Image
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Colours } from "@/app/src/components/styles";
import ENV from '../../../../../env'
import { useLoader } from '@/app/src/context/LoaderContext';

const SCREEN_WIDTH = Dimensions.get("window").width;

export default function SuggestedRunningWorkouts({ route }) {
    const navigation = useNavigation();
    const { selectedTime, selectedWorkout, fiveKmMinutes, fiveKmSeconds } = route.params;
    const [workouts, setWorkouts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filteredWorkouts, setFilteredWorkouts] = useState([]);
    const flatListRef = useRef(null);
    const { setIsBouncerLoading, isBouncerLoading } = useLoader(); // Access loader functions


    // Fetch workouts from the server
    const fetchWorkouts = async () => {
        // setIsBouncerLoading(true)
        try {
            const response = await axios.get(`${ENV.API_URL}/api/running_sessions/all/`);
            // console.log('running workouts ->', response.data)
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

    // Calculate easy pace as 1 minute 15 seconds (75 seconds) slower than the user's pace
    const warmupCooldownPaceInSeconds = userPacePerKmInSeconds + 75; // Easy pace

    // Calculate interval duration
    const calculateIntervalDuration = (interval) => {
        let splitTimePerKm;

        if (interval.target_pace.toLowerCase() === "easy") {
            // If the target pace is "Easy," use the easy pace
            splitTimePerKm = warmupCooldownPaceInSeconds;
        } else {
            const [baseTime, subString] = interval.target_pace.split(" sub ");
            const adjustment = parseInt(subString, 10) || 0;
            const baseTimeInSeconds = parseInt(baseTime, 10); // Extract the first number
            console.log('5 km time secs:', user5kTimeInSeconds);

            console.log('Per km time:', userPacePerKmInSeconds);

            splitTimePerKm = userPacePerKmInSeconds - adjustment;
            console.log('Split time:', splitTimePerKm);

            // Ensure split time doesn't go below the base time
            if (!isNaN(baseTimeInSeconds)) {
                splitTimePerKm = Math.min(splitTimePerKm, baseTimeInSeconds * 60); // Convert minutes to seconds
            }
        }

        const intervalTime = splitTimePerKm * interval.repeat_distance * interval.repeats;
        const restTime = interval.rest_time || 0;
        const totalRestTime = (interval.repeats - 1) * restTime;
        return intervalTime + totalRestTime;
    };

    // Calculate total workout duration
    const calculateWorkoutDuration = (workout) => {
        const intervalsDuration = workout.intervals.reduce(
            (sum, interval) => sum + calculateIntervalDuration(interval),
            0
        );

        const warmupTime = workout.warmup_distance * warmupCooldownPaceInSeconds;
        const coolDownTime = workout.cool_down_distance * warmupCooldownPaceInSeconds;

        const totalTimeInSeconds = intervalsDuration + warmupTime + coolDownTime;
        console.log('Workout Duration (seconds):', totalTimeInSeconds);

        return totalTimeInSeconds / 60; // Convert to minutes
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.round(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    // Calculate the target pace
    const calculateTargetPace = (targetPace) => {
        if (targetPace.toLowerCase() === "easy") {
            return warmupCooldownPaceInSeconds; // Easy pace in seconds
        }

        const adjustment = parseInt(targetPace, 10) || 0; // Adjustment from DB
        return userPacePerKmInSeconds - adjustment; // Target pace in seconds
    };



    // Filter workouts based on user input
    const filterWorkouts = () => {
        const filtered = workouts.filter((workout) => {
            const duration = calculateWorkoutDuration(workout);

            // If "Not sure" is selected, do not apply the type filter
            const matchesType = selectedWorkout === "Not sure" || workout.session_type === selectedWorkout;

            return matchesType && duration <= selectedTime;
        });

        console.log('Filtered workouts ->', filtered);
        setFilteredWorkouts(filtered);
    };


    useEffect(() => {
        fetchWorkouts();
    }, []);

    useEffect(() => {
        if (workouts.length > 0) {
            filterWorkouts();
        }
    }, [workouts]);

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
                                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                                    <Ionicons name="arrow-back" size={24} color="black" />
                                </TouchableOpacity>
                                <Text style={styles.headingText}>Suggested running Workouts</Text>
                            </View>
                        </View>
                        <FlatList
                            ref={flatListRef}
                            data={filteredWorkouts}
                            horizontal
                            pagingEnabled
                            keyExtractor={(item) => item.id.toString()}
                            showsHorizontalScrollIndicator={false}
                            renderItem={({ item }) => (
                                <View style={styles.workoutCard}>
                                    <View style={styles.workoutOverview}>
                                        <View style={styles.overviewBox}>
                                            <View style={styles.overviewHeader}>
                                                <View>
                                                    <Text style={styles.workoutTitle}>{item.session_type} workout</Text>
                                                    <View style={styles.workoutOverviewTime}>
                                                        <Ionicons name="time-outline" size={24} color="black" />
                                                        <Text style={styles.timeText}>Approx. {Math.round(calculateWorkoutDuration(item))} mins</Text>
                                                    </View>
                                                </View>
                                                <TouchableOpacity
                                                    style={styles.profileButton}
                                                    // onPress={() => showModalForWorkout(item)} // Set modal for current workout
                                                >
                                                    <Ionicons name="heart-outline" color={'black'} size={20} />
                                                </TouchableOpacity>
                                            </View>
                                            <View style={styles.workoutSummaryArray}>
                                                <Text style={styles.workoutSummaryButton}>{item.session_type}</Text>
                                                <Text style={styles.workoutSummaryButton}>Running session</Text>
                                                {/* <Text style={styles.workoutSummaryButton}>{workoutPlans.length} sections</Text> */}
                                            </View>
                                            <View style={styles.trainerDetails}>
                                                <Image
                                                    style={styles.trainerImage}
                                                    source={require('../../../../../assets/images/gus_image.jpeg')} />
                                                <View style={styles.trainerDetailsBox}>
                                                    <Text style={styles.trainerName}>Gus Barton</Text>
                                                    <Text style={styles.trainerTitle}>Head Trainer at Burst</Text>
                                                </View>
                                            </View>
                                        </View>
                                    </View>
                                    <View style={styles.dividerLine}></View>
                                    <Text style={styles.workoutActivity}>Workout Summary</Text>
                                    <Text style={styles.summaryDetail}>{item.session_name}
                                    </Text>
                                    <ScrollView style={styles.workoutList}>
                                        <View style={styles.sectionContainer}>
                                            <Text style={styles.sectionTitle}>Warmup</Text>
                                            <View style={styles.intervalContainer}>
                                                {item.warmup_distance < 1 ? (
                                                    <View style={styles.timeBox}>
                                                        <Text style={styles.movementDetail}>
                                                            {item.warmup_distance * 1000}m at
                                                        </Text>
                                                        <IntervalTime time={formatTime(warmupCooldownPaceInSeconds)} />
                                                    </View>
                                                ) : (
                                                    <View style={styles.timeBox}>
                                                        <Text style={styles.movementDetail}>
                                                            {item.warmup_distance}km at
                                                        </Text>
                                                        <IntervalTime time={formatTime(warmupCooldownPaceInSeconds)} />
                                                    </View>
                                                )}
                                            </View>
                                        </View>
                                        <View style={styles.sectionContainer}>
                                            <Text style={styles.sectionTitle}>Intervals</Text>
                                            {item.intervals.length > 0 ? (
                                                item.intervals.map((interval, index) => {
                                                    const targetPaceInSeconds = calculateTargetPace(interval.target_pace);
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
                                                                <IntervalTime time={formatTime(targetPaceInSeconds)} />
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
                                                <Text style={styles.movementDetail}>No intervals defined</Text>
                                            )}
                                        </View>

                                        <View style={styles.sectionContainer}>
                                            <Text style={styles.sectionTitle}>Cooldown</Text>
                                            <View style={styles.intervalContainer}>
                                                {item.cool_down_distance < 1 ? (
                                                    <View style={styles.timeBox}>
                                                        <Text style={styles.movementDetail}>
                                                            {item.cool_down_distance * 1000}m at
                                                        </Text>
                                                        <IntervalTime time={formatTime(warmupCooldownPaceInSeconds)} />
                                                    </View>
                                                ) : (
                                                    <View style={styles.timeBox}>
                                                        <Text style={styles.movementDetail}>
                                                            {item.cool_down_distance}km at
                                                        </Text>
                                                        <IntervalTime time={formatTime(warmupCooldownPaceInSeconds)} />
                                                    </View>
                                                )}
                                            </View>
                                        </View>
                                    </ScrollView>

                                    <View style={styles.buttonContainer}>
                                        <TouchableOpacity
                                            style={styles.submitButton}
                                            // onPress={() => saveAndStartWorkout(item)}
                                        >
                                            <Text style={styles.submitButtonText}>Start workout</Text>
                                            <View style={styles.submitArrow}>
                                                <Ionicons name="arrow-forward" size={24} color="black" />
                                            </View>
                                        </TouchableOpacity>
                                    </View>

                                </View>
                            )} />
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
        backgroundColor: '#D2E4EA',
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
        marginBottom: 10,
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
        backgroundColor: '#D2E4EA',
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
});
