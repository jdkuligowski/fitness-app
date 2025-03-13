import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    SafeAreaView,
    TouchableOpacity,
    TextInput,
    Dimensions,
    KeyboardAvoidingView, Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colours } from '@/app/src/components/styles';
import Slider from '@react-native-community/slider'
import ENV from '../../../../../env'
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useLoader } from '@/app/src/context/LoaderContext';
import RPEGauge from "@/app/src/components/RPEGauge";
const SCREEN_WIDTH = Dimensions.get('window').width;


export default function RunningWorkout({ route, navigation }) {
    const { setIsBouncerLoading } = useLoader(); // Access loader functions
    const { workout, completeWorkouts } = route.params; // Receive the workout data as a parameter
    const [activeTab, setActiveTab] = useState("Summary"); // Active tab
    const [logData, setLogData] = useState({
        session_comments: workout.running_sessions[0]?.comments || "", // Default to an empty string
        session_rpe: workout.running_sessions[0]?.rpe || 0, // Default to 0
        intervals: workout.running_sessions[0]?.saved_intervals.map((interval) => ({
            ...interval,
            split_times: interval.split_times.map((split) => ({
                ...split,
                actual_mins: split.actual_time ? Math.floor(split.actual_time / 60) : "", // Extract minutes
                actual_secs: split.actual_time ? split.actual_time % 60 : "", // Extract seconds
            })),
        })) || [],
    });



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

    const updateRunningWorkout = async () => {

        try {
            const userId = await AsyncStorage.getItem("userId");
            if (!userId) {
                throw new Error("User ID not found in storage.");
            }

            // Prepare the payload
            const payload = {
                rpe: logData.session_rpe || null, // Only update RPE if provided
                comments: logData.session_comments || null, // Only update comments if provided
                intervals: logData.intervals.map((interval) => ({
                    id: interval.id, // Include the interval ID
                    split_times: interval.split_times.map((split) => ({
                        id: split.id, // Include the split time ID
                        repeat_number: split.repeat_number,
                        actual_time: split.actual_mins * 60 + split.actual_secs, // Convert minutes and seconds to total seconds
                    })),
                })),
            };
            const workoutId = workout.id
            console.log("Payload being sent:", JSON.stringify(payload, null, 2));

            // Send the PUT request to complete the workout
            const response = await axios.put(
                `${ENV.API_URL}/api/saved_runs/complete-workout/${workoutId}/`,
                payload,
                {
                    params: { user_id: userId },
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );

            if (response.status === 200) {
                console.log("Workout updated successfully:", response.data);
                alert("Workout updated successfully!");
            } else {
                console.error("Unexpected response:", response);
                alert("There was an issue updating the workout. Please try again.");
            }
        } catch (error) {
            console.error("Error updating workout:", error.message || error.response?.data);
            alert("Error updating workout. Please check your connection or try again later.");
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.scrollContainer}>

                <View style={styles.header}>
                    <View style={styles.topSection}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => navigation.navigate("Training", {
                                screen: "TrainingDetails",
                                params: {
                                    workoutId: workout.id,
                                    activityType: workout.activity_type,
                                },
                            })}
                        >
                            <Ionicons name="arrow-back" size={24} color="black" />
                        </TouchableOpacity>
                        <View style={styles.headerTextBlock}>
                            <Text style={styles.headingText}>{workout?.description}</Text>
                            <View style={styles.workoutOverviewTime}>
                                <Ionicons name="time-outline" size={24} color="black" />
                                <Text style={styles.timeText}>{workout?.duration} mins</Text>
                            </View>
                        </View>
                    </View>
                </View>
                <View style={styles.tabs}>
                    {['Summary', 'Log', 'History'].map((tab) => {
                        const tabColors = {
                            'Summary': '#DFD7F3',  // Purple for active "Summary" tab
                            'Log': '#D6F7F4',      // Teal for active "Log" tab
                            'History': '#FFDCDD'   // Pink for active "History" tab
                        };

                        return (
                            <TouchableOpacity
                                key={tab}
                                style={[
                                    styles.tab,
                                    { backgroundColor: activeTab === tab ? tabColors[tab] : '#FFFFFF' }, // White if inactive, color if active
                                ]}
                                onPress={() => setActiveTab(tab)}
                            >
                                <Text
                                    style={[
                                        styles.tabText,
                                        activeTab === tab && styles.activeTabText, // Apply active text style only to active tab
                                    ]}
                                >
                                    {tab}
                                </Text>
                            </TouchableOpacity>
                        )
                    })}
                </View>
                {activeTab === "Summary" &&
                    <ScrollView style={styles.tabContent}>
                        <Text style={styles.workoutActivity}>{workout.description}</Text>
                        {workout.description === "Easy run" ?
                            workout.running_sessions.map((session, sessionIndex) => (
                                <View key={sessionIndex}>
                                    {session.saved_intervals && session.saved_intervals.length > 0 ? (
                                        session.saved_intervals.map((interval, intervalIndex) => (
                                            <View key={intervalIndex} style={styles.intervalContainer}>
                                                <View style={styles.timeBox}>
                                                    <Text style={styles.movementDetail}>
                                                        {workout.description} -{" "}
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
                            )) :
                            workout.running_sessions.map((session, index) => (
                                session.workout_notes ? (
                                    <>
                                        <Text style={styles.summaryDetail}>{workout.description}</Text>
                                        <Text key={`notes-${index}`} style={styles.summaryDetail}>
                                            {session.workout_notes}
                                        </Text>
                                    </>
                                ) : null
                            ))}
                        {workout.description === "Easy run" ?
                            <Text></Text>
                            :
                            <View>
                                {/* Warmup Section */}
                                {workout.running_sessions.map((session, index) => (
                                    <View key={index} style={styles.sectionContainer}>
                                        {session.warmup_distance === 0 ? '' :
                                            <>
                                                <Text style={styles.workoutActivity}>Warmup</Text>
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
                                            </>
                                        }
                                    </View>
                                ))
                                }
                                {/* Intervals Section */}
                                <View style={styles.sectionContainer}>
                                    <Text style={styles.workoutActivity}>Intervals</Text>
                                    {workout.running_sessions.map((session, sessionIndex) => (
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

                                {/* Cooldown Section */}
                                {workout.running_sessions.map((session, index) => (
                                    <View key={index} style={styles.sectionContainer}>
                                        {session.warmup_distance === 0 ? '' :
                                            <>
                                                <Text style={styles.workoutActivity}>Cooldown</Text>
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
                                            </>
                                        }
                                    </View>
                                ))}
                            </View>
                        }
                    </ScrollView>
                }

                {activeTab === "Log" &&
                    <KeyboardAvoidingView
                        style={{ flex: 1 }}
                        behavior={Platform.OS === "ios" ? "padding" : null}
                    >

                        <ScrollView style={styles.tabContent} keyboardShouldPersistTaps="handled">
                            {/* Intervals Input */}
                            {logData.intervals.map((interval, intervalIndex) => (
                                <View key={intervalIndex} style={styles.intervalContainer}>
                                    {workout.description === "Easy run" ?
                                        <Text style={styles.intervalTitle}>
                                            Log easy run
                                        </Text>
                                        :
                                        <Text style={styles.intervalTitle}>
                                            Interval {intervalIndex + 1} ({interval.repeat_distance} km x {interval.repeats})
                                        </Text>
                                    }
                                    {interval.split_times.map((split, splitIndex) => (
                                        <View key={splitIndex} style={styles.splitContainer}>
                                            {workout.description === "Easy run" ?
                                                <Text style={styles.splitLabel}>Pace:</Text>
                                                :
                                                <Text style={styles.splitLabel}>Split {split.repeat_number}:</Text>
                                            }
                                            <View style={styles.timeInputContainer}>
                                                <TextInput
                                                    style={[styles.input, styles.timeInput]}
                                                    value={split.actual_mins !== undefined ? String(split.actual_mins) : ''}
                                                    placeholder="Min"
                                                    keyboardType="numeric"
                                                    onChangeText={(value) => {
                                                        const updatedLogData = { ...logData };
                                                        const mins = parseInt(value, 10) || 0;
                                                        const secs = updatedLogData.intervals[intervalIndex].split_times[splitIndex].actual_secs || 0;
                                                        updatedLogData.intervals[intervalIndex].split_times[splitIndex].actual_mins = mins;
                                                        updatedLogData.intervals[intervalIndex].split_times[splitIndex].actual_time = mins * 60 + secs;
                                                        setLogData(updatedLogData);
                                                    }}
                                                />
                                                <Text style={styles.colon}>:</Text>
                                                <TextInput
                                                    style={[styles.input, styles.timeInput]}
                                                    value={split.actual_secs !== undefined ? String(split.actual_secs) : ''}
                                                    placeholder="Sec"
                                                    keyboardType="numeric"
                                                    onChangeText={(value) => {
                                                        const updatedLogData = { ...logData };
                                                        const secs = parseInt(value, 10) || 0;
                                                        const mins = updatedLogData.intervals[intervalIndex].split_times[splitIndex].actual_mins || 0;
                                                        updatedLogData.intervals[intervalIndex].split_times[splitIndex].actual_secs = secs;
                                                        updatedLogData.intervals[intervalIndex].split_times[splitIndex].actual_time = mins * 60 + secs;
                                                        setLogData(updatedLogData);
                                                    }}
                                                />
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            ))}

                            {/* Comments Block for Running Session */}
                            <View style={styles.commentBlock}>
                                <Text style={styles.exerciseLabel}>Session Comments</Text>
                                <TextInput
                                    style={styles.commentInput}
                                    value={logData.session_comments || ''}
                                    onChangeText={(value) => {
                                        const updatedLogData = { ...logData };
                                        updatedLogData.session_comments = value;
                                        setLogData(updatedLogData);
                                    }}
                                    placeholder="How was this session?"
                                />
                            </View>

                            {/* RPE Block for Running Session */}
                            <View style={styles.commentBlock}>
                                <Text style={styles.exerciseLabel}>Session RPE: {logData.session_rpe ?? 0}</Text>
                                <View style={styles.sliderContainer}>
                                    <Slider
                                        style={styles.slider}
                                        minimumValue={0}
                                        maximumValue={10}
                                        step={1}
                                        minimumTrackTintColor="#D6F7F4"
                                        value={logData.session_rpe || 0}
                                        onValueChange={(value) => {
                                            const updatedLogData = { ...logData };
                                            updatedLogData.session_rpe = value;
                                            setLogData(updatedLogData);
                                        }}
                                    />
                                </View>
                            </View>
                        </ScrollView>
                    </KeyboardAvoidingView>
                }

                {activeTab === 'History' && (
                    <ScrollView style={styles.tabContent} keyboardShouldPersistTaps="handled">
                        <View style={styles.detailsContent}>
                            {/* Iterate through completeWorkouts */}
                            {completeWorkouts && completeWorkouts.length > 0 ? (
                                completeWorkouts.map((workout, workoutIndex) => (
                                    <View key={workoutIndex} style={styles.historyItem}>

                                        {/* Iterate through running sessions */}
                                        {workout.running_sessions && workout.running_sessions.length > 0 ? (
                                            workout.running_sessions.map((session, sessionIndex) => (
                                                <View key={sessionIndex} style={styles.historyItem}>
                                                    {/* Display the session's date */}
                                                    <View style={styles.dateBox}>
                                                        <Text style={styles.historyDate}>
                                                            {new Date(workout.completed_date || session.created_at).toLocaleDateString('en-US', {
                                                                month: 'short',
                                                                day: 'numeric',
                                                            })}
                                                        </Text>
                                                        <View style={styles.divider}></View>
                                                    </View>
                                                    <View style={styles.detailWrapper}>
                                                        <View style={styles.intervalWrapper}>

                                                            {/* Intervals */}
                                                            {session.saved_intervals && session.saved_intervals.length > 0 ? (
                                                                session.saved_intervals.map((interval, intervalIndex) => (
                                                                    <View key={intervalIndex} style={styles.intervalBlock}>
                                                                        {/* Subheader for each interval block */}
                                                                        {interval.repeat_distance < 1 ? (
                                                                            <Text style={styles.intervalHistoryTitle}>
                                                                                Block {intervalIndex + 1}: {interval.repeat_distance * 1000}m
                                                                            </Text>
                                                                        ) : (
                                                                            <Text style={styles.intervalHistoryTitle}>
                                                                                Block {intervalIndex + 1}: {interval.repeat_distance}km
                                                                            </Text>
                                                                        )}

                                                                        <View style={styles.resultsBox}>
                                                                            {/* Split Times */}
                                                                            {interval.split_times && interval.split_times.length > 0 ? (
                                                                                <View style={styles.splitHistoryContainer}>
                                                                                    {interval.split_times.map((split, splitIndex) => (
                                                                                        <View key={splitIndex} style={styles.setItem}>
                                                                                            {interval.split_times.length === 1 ?
                                                                                                <Text style={styles.setSubNumber}>
                                                                                                </Text>
                                                                                                :
                                                                                                <Text style={styles.setSubNumber}>
                                                                                                    {splitIndex + 1}
                                                                                                </Text>
                                                                                            }
                                                                                            <Text style={styles.splitDetail}>
                                                                                                Target: {Math.floor(split.target_time / 60)}:
                                                                                                {String(split.target_time % 60).padStart(2, '0')} | Actual:{" "}
                                                                                                {split.actual_time
                                                                                                    ? `${Math.floor(split.actual_time / 60)}:${String(split.actual_time % 60).padStart(2, '0')}`
                                                                                                    : "No data"}
                                                                                            </Text>
                                                                                        </View>
                                                                                    ))}
                                                                                </View>
                                                                            ) : (
                                                                                <Text style={styles.noSplitText}>No split times available</Text>
                                                                            )}

                                                                        </View>
                                                                    </View>
                                                                ))
                                                            ) : (
                                                                <Text style={styles.noIntervalText}>No intervals available</Text>
                                                            )}
                                                        </View>
                                                        {session.rpe && (
                                                            <View style={styles.scoreContainer}>
                                                                <RPEGauge score={session.rpe} />
                                                            </View>
                                                        )}
                                                    </View>

                                                    {/* Comments */}
                                                    <Text style={styles.commentsHistoryTitle}>Workout comments</Text>
                                                    {session.comments ? (
                                                        <Text style={styles.rpeText}>{session.comments}</Text>
                                                    ) : (
                                                        <Text style={styles.rpeText}>No comments made for this workout</Text>
                                                    )}
                                                </View>
                                            ))
                                        ) : (
                                            <Text style={styles.noSessionText}>No running sessions available</Text>
                                        )}
                                    </View>
                                ))
                            ) : (
                                <Text style={styles.noHistoryText}>No completed workouts available</Text>
                            )}
                        </View>
                    </ScrollView>
                )}



                {/* Navigation Buttons */}
                <View style={styles.navigationContainer}>
                    {/* <TouchableOpacity
                        style={[styles.navButton, currentStage === 0 && styles.disabledButton]}
                        onPress={handlePrevious}
                        disabled={currentStage === 0}
                    >
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity> */}
                    <TouchableOpacity style={styles.finishButton} onPress={() => updateRunningWorkout()}>
                        {/* <TouchableOpacity style={styles.finishButton} onPress={() => completeWorkout()}> */}
                        <Text style={styles.finishButtonText}>Finish Workout</Text>
                    </TouchableOpacity>
                    {/* <TouchableOpacity
                        style={[
                            styles.navButton,
                            currentStage === workout.workout_sections.length - 1 && styles.disabledButton,
                        ]}
                        onPress={handleNext}
                        disabled={currentStage === workout.workout_sections.length - 1}
                    >
                        <Ionicons name="arrow-forward" size={24} color="white" />
                    </TouchableOpacity> */}
                </View>
                {/* {activeTab === "History" && renderHistory()} */}
            </View>
        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Colours.primaryBackground,
    },
    scrollContainer: {
        flex: 1,
        backgroundColor: Colours.primaryBackground,
        paddingBottom: 10,
        overflowY: 'hidden',
    },
    header: {
        padding: 20,
    },
    topSection: {
        flexDirection: 'row',
        alignItems: 'center',
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
    headerTextBlock: {
        flex: 1,
        paddingLeft: 10,
    },
    headingText: {
        fontSize: 20,
        fontWeight: '700',
        color: 'black',
    },
    workoutOverviewTime: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 5,
    },
    timeText: {
        marginLeft: 5,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        // marginVertical: 10,
    },
    movementText: {
        fontSize: 16,
        marginVertical: 5,
    },
    stageContainer: {
        // alignItems: 'center',
        justifyContent: 'flex-start',
        paddingHorizontal: 20,
        // maxHeight: 700,
    },
    workoutTitleBox: {
        flexDirection: 'row',
        alignItems: 'center',
        width: SCREEN_WIDTH - 80,
        marginBottom: 10,
    },
    line: {
        borderColor: 'rgba(0, 0, 0, 0.08)',
        borderWidth: 1,
        width: '80%',
    },
    stageTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginRight: 10,
    },
    movementScrollContainer: {
        // maxHeight: 700,
        // paddingBottom: 100,
    },
    movementContainer: {
        marginBottom: 20,
        // flexGrow: 1,
        // paddingHorizontal: 20,
        // alignItems: 'center',
    },
    movementSubtitle: {
        fontSize: 16,
        fontWeight: '600',
        marginVertical: 10,
        color: 'rgba(0, 0, 0, 0.6)',
    },
    tabs: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginVertical: 10,
        marginHorizontal: 20,
        borderWidth: 1,
        borderColor: '#BBBBCB',
        paddingVertical: 5,
        borderRadius: 10,
        backgroundColor: 'white',
    },
    tab: {
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 10,
        backgroundColor: 'white',
        width: '30%',
    },
    activeTab: {
        backgroundColor: '#DFD7F3',
    },
    tabText: {
        fontSize: 14,
        color: 'black',
        textAlign: 'center',

    },
    activeTabText: {
        fontWeight: 'bold',
    },

    tabContent: {
        marginTop: 10,
        marginHorizontal: 20,
        backgroundColor: 'white',
        borderRightWidth: 4,
        borderBottomWidth: 4,
        borderTopWidth: 1,
        borderLeftWidth: 1,
        borderRadius: 20,
        padding: 20,
        // flex: 1,
    },
    workoutActivity: {
        marginBottom: 5,
        fontWeight: 700,
        fontSize: 16,
    },
    summaryDetail: {
        marginBottom: 10,
        fontSize: 16,
    },
    movementDetail: {
        fontSize: 16,
        color: 'black', // Example color for movement details
    },
    sectionContainer: {
        // marginBottom: 5,
        paddingTop: 0,
        // paddingBottom: 10,
        // borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.1)',
        borderRadius: 10,
    },
    movementName: {
        marginLeft: 20,
    },
    exerciseDescription: {
        fontSize: 16,
        textAlign: 'center',
    },
    navigationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        // position: 'absolute',
        // bottom:70,
        width: '100%',
    },
    navButton: {
        backgroundColor: 'black',
        padding: 15,
        borderRadius: 50,
    },
    disabledButton: {
        backgroundColor: '#A9A9A9',
    },
    finishButton: {
        backgroundColor: 'black',
        flex: 1,
        marginHorizontal: 10,
        alignItems: 'center',
        paddingVertical: 15,
        borderRadius: 50,
    },
    finishButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    logContent: {
        padding: 20,
    },
    logContentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    setRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: 10,
        marginTop: 10,
    },
    setNumber: {
        padding: 5,
        marginRight: 10,
        width: 25,
        height: 25,
        textAlign: 'center',
        backgroundColor: '#D6F7F4',
        borderRadius: 20,
        fontWeight: 600,
    },
    weightInput: {
        borderWidth: 1,
        borderRadius: 10,
        width: 90,
        padding: 5,
        flexDirection: 'column',
        alignItems: 'center',
        borderColor: '#A9A9C7'
    },
    weightInputRow: {
        flexDirection: 'row',
        alignItems: 'center',

    },
    weightText: {
        color: '#7B7C8C',
        paddingLeft: 0,
    },
    saveButton: {
        backgroundColor: '#D6F7F4',
        flex: 1,
        marginHorizontal: 10,
        alignItems: 'center',
        paddingVertical: 15,
        borderRadius: 50,
        marginTop: 20,
    },
    saveButtonText: {
        color: 'black',
        fontSize: 16,
        fontWeight: 'bold',
    },
    commentBlock: {
        marginTop: 10,
        marginBottom: 20,
    },
    commentInput: {
        width: '100%',
        minHeight: 50,
        borderWidth: 1,
        borderColor: '#A9A9C7',
        marginTop: 5,
        borderRadius: 10,
        padding: 10,
        fontSize: 10,
    },
    sliderContainer: {
        marginTop: 10,
        marginBottom: 30, // Prevent overlap with elements below
    },
    slider: {
        width: '90%',
        height: 40,
        alignSelf: 'center',
        marginBottom: 20,
        // backgroundColor: '#D6F7F4',
    },
    thumb: {
        height: 30, // Increase the size for better visibility
        width: 30,
        borderRadius: 15,
        backgroundColor: '#000', // Thumb button color
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',

        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        width: '100%',
        height: '100%',
    },
    loadingImage: {
        width: 100,
        height: 100,
    },
    historyContent: {
        padding: 20,
    },

    exerciseLabel: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 10,
    },
    historyItem: {
        marginBottom: 20,
        // borderBottomWidth: 1,
        // borderBottomColor: '#ddd',
        // paddingBottom: 10,
    },
    dateBox: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    divider: {
        height: 1,
        backgroundColor: '#ddd',
        width: 240,
    },
    historyDate: {
        fontSize: 16,
        fontWeight: '700',
        // marginBottom: 10,
        color: '#B7B7C1'
    },
    setsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        // marginBottom: 10,
        width: '80%',
        flexWrap: 'wrap',
    },
    setItem: {
        flexDirection: 'row',
        alignItems: 'center',
        // justifyContent: 'space-between',
        width: '95%',
        marginBottom: 10,
    },
    setSubNumber: {
        width: 25,
        height: 25,
        paddingTop: 5,
        borderRadius: 20,
        fontSize: 12,
        textAlign: 'center',
        backgroundColor: '#FFDCDD',
        marginRight: 5,
    },
    setValue: {
        fontWeight: 600,
        fontSize: 14,
    },
    setMetric: {
        fontSize: 10,
        color: '#B7B7C1',
    },
    allScoresContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    scoreContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    scoreCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        borderWidth: 5,
        borderColor: '#B8373B',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scoreText: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    intervalContainer: {
        // marginTop: 10,
        marginBottom: 10,
    },
    timeBox: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    intervalTimeContainer: {
        marginLeft: 1,
        // backgroundColor: '#D2E4EA',
        borderRadius: 5,
        padding: 3,
    },
    intervalTimeText: {
        fontSize: 16,
    },
    splitContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 8,
    },
    splitHistoryContainer: {
        flexDirection: 'column',

    },
    timeInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    timeInput: {
        width: 50,
    },
    splitLabel: {
        width: 65,
        fontSize: 14,
        fontWeight: 500,
    },
    input: {
        padding: 9,
        fontSize: 14,
        fontWeight: 700,
        minWidth: 50,
        textAlign: 'center',
        borderWidth: 1,
        borderRadius: 5,
        borderColor: '#A9A9C7',
    },
    colon: {
        marginHorizontal: 10,
    },
    intervalTitle: {
        fontSize: 16,
        fontWeight: 700,
        marginBottom: 10,
    },
    intervalHistoryTitle: {
        fontSize: 14,
        fontWeight: 600,
        marginBottom: 10,
    },
    commentsHistoryTitle: {
        fontSize: 14,
        fontWeight: 600,
        marginBottom: 10,
        color: '#D32F2F',
    },
    resultsBox: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    detailWrapper: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
});
