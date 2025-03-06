import React, { useState, useEffect } from 'react';
import {
    SafeAreaView,
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Modal, Dimensions, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ENV from '../../../../../env'
import { Colours } from '@/app/src/components/styles';
import { Video } from "expo-av";

const SCREEN_WIDTH = Dimensions.get("window").width;


export default function WorkoutSummary({ route, navigation }) {
    const { workoutId, activityType } = route.params; // Get the workout ID passed as a parameter
    const [userWorkouts, setUserWorkouts] = useState(null); // Store the workout data
    const [isLoading, setIsLoading] = useState(true); // Loading state for fetching workout data
    const [movementHistory, setMovementHistory] = useState(null)
    const [selectedMovement, setSelectedMovement] = useState(null);
    const [recentWorkouts, setRecentWorkouts] = useState(null); // For running workouts
    const [similarWorkouts, setSimilarWorkouts] = useState(null); // For running workouts

    // Fetch workout data
    useEffect(() => {
        const fetchWorkout = async () => {
            try {
                const userId = await AsyncStorage.getItem('userId');

                if (!userId) {
                    throw new Error('User ID not found in storage.');
                }
                console.log('activity type: ', activityType)
                let endpoint = '';
                if (activityType === 'Gym') {
                    endpoint = `${ENV.API_URL}/api/saved_workouts/get-single-workout/${workoutId}/`;
                } else if (activityType === 'Running') {
                    endpoint = `${ENV.API_URL}/api/saved_workouts/get-single-running-workout/${workoutId}/`;
                } else if (activityType === 'Mobility') {
                    endpoint = `${ENV.API_URL}/api/saved_workouts/get-single-mobility-workout/${workoutId}/`;
                } else if (activityType === 'Hiit') {
                    endpoint = `${ENV.API_URL}/api/saved_workouts/get-single-hiit-workout/${workoutId}/`;
                } else {
                    throw new Error(`Unsupported activity type: ${activityType}`);
                }
                const response = await axios.get(endpoint, {
                    params: { user_id: userId }
                });



                if (activityType === 'Gym') {
                    const { workout, movement_history } = response.data;
                    setUserWorkouts(workout);
                    setMovementHistory(movement_history);
                    console.log('Running workouts: ', JSON.stringify(response.data, null, 2))
                } else if (activityType === 'Running') {
                    const { workout, similar_workouts, recent_running_workouts } = response.data;
                    setUserWorkouts(workout);
                    setSimilarWorkouts(similar_workouts);
                    setRecentWorkouts(recent_running_workouts);
                    console.log('Running workouts: ', JSON.stringify(response.data, null, 2))
                } else if (activityType === 'Mobility') {
                    const { workout, similar_mobility_workouts } = response.data;
                    setUserWorkouts(workout);
                    setSimilarWorkouts(similar_mobility_workouts);
                    console.log('Mobility workouts: ', JSON.stringify(response.data, null, 2))
                } else if (activityType === 'Hiit') {
                    const { workout, similar_workouts, recent_hiit_workouts } = response.data;
                    setUserWorkouts(workout);
                    setSimilarWorkouts(similar_workouts);
                    setRecentWorkouts(recent_hiit_workouts);
                    console.log('Hiit workouts: ', JSON.stringify(response.data, null, 2));
                }

                setIsLoading(false);
            } catch (error) {
                console.error('Error fetching workout:', error.message);
                Alert.alert('Error', 'An error occurred while loading the workout. Please try again.');
                setIsLoading(false);
            }
        };

        if (workoutId && activityType) fetchWorkout();
    }, [workoutId, activityType]);

    const startWorkout = async () => {
        setIsLoading(true);
        try {
            // Update workout status to "Started"
            await axios.patch(`${ENV.API_URL}/api/saved_workouts/update-workout-status/${workoutId}/`, {
                status: 'Started'
            });

            // Navigate to the appropriate workout screen
            if (activityType === 'Gym') {
                navigation.navigate('CompleteWorkout', {
                    workout: userWorkouts,
                    movementHistory: movementHistory
                });
            } else if (activityType === 'Running') {
                navigation.navigate('CompleteRunningWorkout', {
                    workout: userWorkouts,
                    completeWorkouts: similarWorkouts,
                    recentWorkouts: recentWorkouts,
                });
            } else if (activityType === 'Mobility') {
                navigation.navigate('CompleteMobilityWorkout', {
                    workout: userWorkouts,
                    completeWorkouts: similarWorkouts,
                });
            } else if (activityType === 'Hiit') {
                navigation.navigate('CompleteHiitWorkout', {
                    workout: userWorkouts,
                    completeWorkouts: similarWorkouts,
                    recentWorkouts: recentWorkouts,
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
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.navigate("Training", {
                            screen: "TrainingOverview",
                        })}
                    >
                        <Ionicons name="arrow-back" size={24} color="black" />
                    </TouchableOpacity>
                    <Text style={styles.headingText}>{userWorkouts.name}</Text>
                </View>

                {/* Workout Overview */}
                <View style={[styles.workoutCard,
                {
                    backgroundColor:
                        userWorkouts.activity_type === 'Gym'
                            ? '#F3F1FF'
                            : userWorkouts.activity_type === 'Running'
                                ? '#E4EAEC'
                                : userWorkouts.activity_type === 'Mobility'
                                    ? '#FFEEEF'
                                    : userWorkouts.activity_type === 'Hiit'
                                        ? '#F6F6DC'
                                        : 'black',
                }]}>

                    <View style={styles.workoutOverview}>
                        <View style={[styles.overviewBox,
                        {
                            backgroundColor:
                                userWorkouts.activity_type === 'Gym'
                                    ? '#EFE8FF'
                                    : userWorkouts.activity_type === 'Running'
                                        ? '#D2E4EA'
                                        : userWorkouts.activity_type === 'Mobility'
                                            ? '#FFDDDE'
                                            : userWorkouts.activity_type === 'Hiit'
                                                ? '#FFFFEF'
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
                    {/* <Text style={styles.workoutActivity}>Workout Summary</Text> */}
                    <ScrollView style={styles.workoutList}>
                        {userWorkouts.activity_type === "Gym" ? (
                            // Gym Layout
                            userWorkouts?.workout_sections?.map((section, index) => (
                                <View key={index} style={styles.sectionContainer}>
                                    <Text style={styles.sectionTitle}>{section.section_name}</Text>
                                    {section.section_movement_details.map((movement, i) => (
                                        <View key={i} style={styles.movementRow}>
                                            <Text>
                                                <Text style={styles.movementLabel}>{`${i + 1}: `}</Text>
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
                                {userWorkouts.description === "Easy run" ?
                                    userWorkouts.running_sessions.map((session, sessionIndex) => (
                                        <View key={sessionIndex}>
                                            {session.saved_intervals && session.saved_intervals.length > 0 ? (
                                                session.saved_intervals.map((interval, intervalIndex) => (
                                                    <View key={intervalIndex} style={styles.intervalContainer}>
                                                        <View style={styles.timeBox}>
                                                            <Text style={styles.movementDetail}>
                                                                {userWorkouts.description} -{" "}
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
                                    ))
                                    :
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
                                }
                            </>
                        ) : userWorkouts.activity_type === "Mobility" ? (
                            // Mobility Layout
                            <>
                                <Text style={styles.summaryMessage}>
                                    {userWorkouts.mobility_sessions.length > 0 && userWorkouts.mobility_sessions[0].mobility_details.length > 0
                                        ? `Work through these ${userWorkouts.mobility_sessions[0].mobility_details.length} movements, spending ${userWorkouts.mobility_sessions[0].mobility_details[0].duration} minute${userWorkouts.mobility_sessions[0].mobility_details[0].duration > 1 ? 's' : ''} on each.`
                                        : "No mobility session details available."}
                                </Text>
                                {userWorkouts.mobility_sessions.map((session, index) => (
                                    <View key={index} style={styles.sectionContainer}>
                                        <Text style={styles.sectionTitle}>Mobility Session</Text>
                                        {session.mobility_details.map((detail, i) => (
                                            <View key={i} style={styles.movementRow}>
                                                <View style={styles.movementLeft}>
                                                    <Text>
                                                        <Text style={styles.movementLabel}>{`${i + 1}: `}</Text>
                                                        <Text style={styles.movementDetail}>{detail.movements.exercise}</Text>
                                                        {detail.duration && (
                                                            <Text style={styles.movementDetail}></Text>
                                                        )}
                                                    </Text>
                                                </View>
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        if (detail.movements.portrait_video_url) {
                                                            setSelectedMovement({
                                                                ...detail,
                                                                portrait_video_url: detail.movements.portrait_video_url,
                                                            });
                                                        } else {
                                                            Alert.alert("No video available", "This movement doesn't have an associated video.");
                                                        }
                                                    }}
                                                >
                                                    <Ionicons name="play-circle" size={24} color="black" />
                                                </TouchableOpacity>
                                            </View>
                                        ))}
                                        {/* <View style={styles.subDividerLine}></View> */}
                                    </View>
                                ))}
                            </>
                        ) : userWorkouts.activity_type === "Hiit" ? (
                            <>

                                {userWorkouts.hiit_sessions.map((session, index) => (
                                    <View key={index} style={styles.sectionContainer}>
                                        {/* <Text style={styles.sectionTitle}>{session.workout_type} Workout</Text> */}
                                        <Text style={styles.summaryDetail}>{session.structure}</Text>

                                        {session.hiit_details.map((block, i) => (
                                            <View key={i} style={styles.sectionContainer}>
                                                <Text style={styles.sectionTitle}>{block.block_name}</Text>
                                                {block.hiit_movements.map((movement, j) => (
                                                    <View key={j} style={styles.movementRow}>
                                                        <View style={styles.movementLeft}>
                                                            <Text>
                                                                <Text style={styles.movementLabel}>{`${j + 1}: `}</Text>
                                                                <Text style={styles.movementDetail}>{movement.exercise_name}</Text>
                                                                {movement.rest_period && (
                                                                    <Text style={styles.restPeriod}> (Rest)</Text>
                                                                )}
                                                            </Text>
                                                        </View>
                                                        <TouchableOpacity
                                                            onPress={() => {
                                                                if (movement.movements?.portrait_video_url) {
                                                                    setSelectedMovement({
                                                                        ...movement,
                                                                        portrait_video_url: movement.movements.portrait_video_url,
                                                                    });
                                                                } else {
                                                                    Alert.alert("No video available", "This movement doesn't have an associated video.");
                                                                }
                                                            }}
                                                        >
                                                            <Ionicons name="play-circle" size={24} color="black" />
                                                        </TouchableOpacity>
                                                    </View>
                                                ))}
                                                <View style={styles.subDividerLine}></View>
                                            </View>
                                        ))}
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
                {selectedMovement && (
                    <Modal
                        animationType="slide"
                        transparent={false}
                        visible={!!selectedMovement}
                        onRequestClose={() => setSelectedMovement(null)}
                    >
                        <View style={styles.videoModalContainer}>
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
    summaryMessage: {
        fontSize: 16,
        // marginHorizontal: 20,
        marginBottom: 20,
    },
    partLabel: {
        fontWeight: 600,
    },
    movementRow: {
        marginVertical: 5, // Space between rows
        flexDirection: 'row',
        paddingLeft: 10,
        alignItems: 'center',
        justifyContent: 'space-between',
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
    videoModalContainer: {
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
    intervalTimeText: {
        fontSize: 16,
        fontWeight: 600,
    },
});
