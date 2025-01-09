import React, { useState, useEffect } from 'react';
import {
    SafeAreaView,
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Modal, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ENV from '../../../../../env'
import { Colours } from '@/app/src/components/styles';

const SCREEN_WIDTH = Dimensions.get("window").width;


export default function WorkoutSummary({ route, navigation }) {
    const { workoutId } = route.params; // Get the workout ID passed as a parameter
    const [userWorkouts, setUserWorkouts] = useState(null); // Store the workout data
    const [isLoading, setIsLoading] = useState(true); // Loading state for fetching workout data
    const [movementHistory, setMovementHistory] = useState(null)

    // Fetch workout data
    useEffect(() => {
        const fetchWorkout = async () => {
            try {
                const userId = await AsyncStorage.getItem('userId');
                const response = await axios.get(`${ENV.API_URL}/api/saved_workouts/get-single-workout/${workoutId}/`, {
                    params: { user_id: userId }
                });

                const { workout, movement_history } = response.data; // Destructure the response
                setUserWorkouts(workout); // Set workout data
                setMovementHistory(movement_history); // Set movement history data
                console.log('Workout data ->', JSON.stringify(workout, null, 2));
                // console.log('Workout data ->', workout);
                console.log('Movement history ->', movement_history);
                setIsLoading(false)
            } catch (error) {
                console.error('Error fetching workout:', error.message);
            }
        };

        if (workoutId) fetchWorkout();
    }, [workoutId]);


    const startWorkout = async () => {
        setIsLoading(true);
        try {
            // Check if the workout is already completed

            const response = await axios.patch(`${ENV.API_URL}/api/saved_workouts/update-workout-status/${workoutId}/`, {
                status: 'Started'
            });
            console.log('Workout status updated:', response.data);



            // Navigate to CompleteWorkout regardless of status
            if (userWorkouts.activity_type === 'Gym') {
                navigation.navigate('CompleteWorkout', {
                    workout: userWorkouts,
                    movementHistory: movementHistory
                });
            } else if ((userWorkouts.activity_type === 'Running')) {
                navigation.navigate('CompleteRunningWorkout', {
                    workout: userWorkouts,
                    // movementHistory: movementHistory
                });
            }

        } catch (error) {
            console.error('Error updating workout status:', error.message);
            alert('An error occurred while starting the workout. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };


    const IntervalTime = ({ time }) => (
        <View style={styles.intervalTimeContainer}>
            <Text style={styles.intervalTimeText}>{time}</Text>
        </View>
    );

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.round(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <Image
                    source={require('../../../../../assets/images/bouncing-ball-loader-white.gif')} // Make sure this path is correct
                    style={styles.loadingImage}
                />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.scrollContainer}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="black" />
                    </TouchableOpacity>
                    <Text style={styles.headingText}>{userWorkouts.name}</Text>
                </View>

                {/* Workout Overview */}
                <View style={styles.workoutCard}>

                    <View style={styles.workoutOverview}>
                        <View style={[styles.overviewBox,
                        {
                            backgroundColor:
                                userWorkouts.activity_type === 'Gym'
                                    ? '#EFE8FF'
                                    : userWorkouts.activity_type === 'Running'
                                        ? '#D2E4EA'
                                        : 'black',
                        }]}>
                            <View style={styles.overviewHeader}>
                                <Text style={styles.workoutTitle}>{userWorkouts.name}</Text>
                                <View style={styles.workoutOverviewTime}>
                                    <Ionicons name="time-outline" size={24} color="black" />
                                    <Text style={styles.timeText}>{userWorkouts.duration} mins</Text>
                                </View>
                            </View>
                            <View style={styles.workoutSummaryArray}>
                                {/* <Text style={styles.workoutSummaryButton}>{userWorkouts.complexity === 1 ? 'Beginner' : userWorkouts.complexity === 2 ? 'Intermediate' : 'Advanced'}</Text> */}
                                <Text style={styles.workoutSummaryButton}>{userWorkouts.activity_type}</Text>
                                {/* <Text style={styles.workoutSummaryButton}>{userWorkouts.workout_sections.length} sections</Text> */}
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

                    {/* Workout Sections */}
                    <View style={styles.dividerLine}></View>
                    <Text style={styles.workoutActivity}>Workout Summary</Text>
                    <ScrollView style={styles.workoutList}>
                        {userWorkouts.activity_type === "Gym" ? (
                            // Gym Layout
                            userWorkouts?.workout_sections?.map((section, index) => (
                                <View key={index} style={styles.sectionContainer}>
                                    <Text style={styles.sectionTitle}>{section.section_name}</Text>
                                    {section.section_movement_details.map((movement, i) => (
                                        <View key={i} style={styles.movementRow}>
                                            <Text>
                                                <Text style={styles.movementLabel}>{`Movement ${i + 1}: `}</Text>
                                                <Text style={styles.movementDetail}>{movement.movements.exercise}</Text>
                                            </Text>
                                        </View>
                                    ))}
                                    <View style={styles.subDividerLine}></View>
                                </View>
                            ))
                        ) : userWorkouts.activity_type === "Running" ? (
                            // Running Layout
                            <>
                                <Text style={styles.summaryDetail}>{userWorkouts.description}</Text>
                                {userWorkouts.running_sessions.map((session, index) => (
                                    session.workout_notes ? (
                                        <Text key={`notes-${index}`} style={styles.summaryDetail}>
                                            {session.workout_notes}
                                        </Text>
                                    ) : null
                                ))}
                                {userWorkouts.running_sessions.map((session, index) => (
                                    <View key={index} style={styles.sectionContainer}>
                                        <Text style={styles.sectionTitle}>Warmup</Text>
                                        <View style={styles.intervalContainer}>
                                            {session.warmup_distance < 1 ? (
                                                <View style={styles.timeBox}>
                                                    <Text style={styles.movementDetail}>
                                                        {session.warmup_distance * 1000}m at
                                                    </Text>
                                                    <IntervalTime time={formatTime(session.suggested_warmup_pace)} />
                                                </View>
                                            ) : (
                                                <View style={styles.timeBox}>
                                                    <Text style={styles.movementDetail}>
                                                        {session.warmup_distance}km at
                                                    </Text>
                                                    <IntervalTime time={formatTime(session.suggested_warmup_pace)} />
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                ))}

                                <View style={styles.sectionContainer}>
                                    <Text style={styles.sectionTitle}>Intervals</Text>
                                    {userWorkouts.running_sessions.map((session, sessionIndex) => (
                                        <View key={sessionIndex}>
                                            {session.saved_intervals && session.saved_intervals.length > 0 ? (
                                                session.saved_intervals.map((interval, intervalIndex) => (
                                                    <View key={intervalIndex} style={styles.intervalContainer}>
                                                        <View style={styles.timeBox}>
                                                            <Text style={styles.movementDetail}>
                                                                {interval.repeats} x{" "}
                                                                {interval.repeat_distance < 1
                                                                    ? `${interval.repeat_distance * 1000}m`
                                                                    : `${interval.repeat_distance}km`}{" "}
                                                                at
                                                            </Text>
                                                            <IntervalTime time={formatTime(interval.target_pace)} />
                                                        </View>
                                                        {interval.rest_time && (
                                                            <Text style={styles.movementDetail}>
                                                                Rest: {interval.rest_time} seconds between intervals
                                                            </Text>
                                                        )}
                                                    </View>
                                                ))
                                            ) : (
                                                <Text style={styles.movementDetail}>No intervals defined</Text>
                                            )}
                                        </View>
                                    ))}
                                </View>


                                {userWorkouts.running_sessions.map((session, index) => (
                                    <View key={index} style={styles.sectionContainer}>
                                        <Text style={styles.sectionTitle}>Cool down</Text>
                                        <View style={styles.intervalContainer}>
                                            {session.cooldown_distance < 1 ? (
                                                <View style={styles.timeBox}>
                                                    <Text style={styles.movementDetail}>
                                                        {session.cooldown_distance * 1000}m at
                                                    </Text>
                                                    <IntervalTime time={formatTime(session.suggested_cooldown_pace)} />
                                                </View>
                                            ) : (
                                                <View style={styles.timeBox}>
                                                    <Text style={styles.movementDetail}>
                                                        {session.cooldown_distance}km at
                                                    </Text>
                                                    <IntervalTime time={formatTime(session.suggested_cooldown_pace)} />
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                ))}
                            </>
                        ) : (
                            <Text style={styles.movementDetail}>Unknown activity type</Text>
                        )}
                    </ScrollView>

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={styles.submitButton}
                            onPress={startWorkout}
                        // disabled={isStartingWorkout}
                        >
                            {userWorkouts.status === 'Started' ? <Text style={styles.submitButtonText}>Continue workout</Text> : userWorkouts.status === 'Completed' ? <Text style={styles.submitButtonText}>Update workout</Text> : <Text style={styles.submitButtonText}>Start workout</Text>}
                            <View style={styles.submitArrow}>
                                <Ionicons name="arrow-forward" size={24} color="black" />
                            </View>

                        </TouchableOpacity>
                    </View>
                </View>
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
        paddingHorizontal: 20,
        paddingVertical: 20,
        flexDirection: 'row',
        alignItems: 'center',
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
        flex: 1,
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
        marginBottom: 10,
        fontWeight: 700,
        fontSize: 16,
    },
    summaryDetail: {
        marginBottom: 10,
        fontSize: 16,
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
        paddingLeft: 20,
        paddingRight: 20,
        height: 350,
    },
    sectionContainer: {
        // marginBottom: 5,
        paddingTop: 0,
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
    loadingContainer: {
        zIndex: 9999,
        flex: 1,
        // backgroundColor: 'rgba(243, 243, 255, 0.1)', // Semi-transparent background
        backgroundColor: 'rgba(0, 0, 0, 0.3)', // Semi-transparent background

        // backgroundColor: '#F3F3FF', // ✅ Background color matching your app's design
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        width: '100%',
        height: '100%',
    },
    loadingImage: {
        width: 100, // ✅ Adjust to the size of your GIF
        height: 100, // ✅ Adjust to the size of your GIF
    },
    intervalContainer: {
        marginTop: 10,
        marginBottom: 10,
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
});
