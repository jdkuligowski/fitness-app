import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    FlatList,
    Dimensions,
    SafeAreaView,
    StatusBar,
    ScrollView,
    TextInput,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider'
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import RPEGauge from '../../../components/RPEGauge'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import ENV from '../../../../../env'
import { useLoader } from '@/app/src/context/LoaderContext';


const SCREEN_WIDTH = Dimensions.get('window').width;

export default function CompleteWorkout({ route, navigation }) {
    const { setIsBouncerLoading } = useLoader(); // Access loader functions
    const { workout, movementHistory } = route.params; // Get the workout data from the previous screen
    const [currentStage, setCurrentStage] = useState(0); // Current workout stage index
    const [activeTab, setActiveTab] = useState('Summary'); // Active tab for Summary, Log, History
    const flatListRef = useRef(null); // Ref for FlatList to programmatically scroll
    const [isLoading, setIsLoading] = useState(false)
    // State to track the sets for each movement
    const [movementLogs, setMovementLogs] = useState({});
    const [movementSummaryDetails, setMovementSummaryDetails] = useState({})

    useEffect(() => {
        const initialLogs = {};
        const initialSummaryDetails = {};
        workout.workout_sections.forEach((section) => {
            section.section_movement_details.forEach((movement) => {
                initialLogs[movement.id] = movement.workout_sets.length > 0
                    ? movement.workout_sets
                    : [
                        { set_number: 1, reps: null, weight: null },
                        { set_number: 2, reps: null, weight: null },
                        { set_number: 3, reps: null, weight: null },
                    ];
                initialSummaryDetails[movement.id] = {
                    movement_difficulty: movement.movement_difficulty ?? 0, // Use the correct name from the backend
                    movement_comments: movement.movement_comment ?? '', // Use the correct name from the backend
                };
            });
        });
        setMovementLogs(initialLogs);
        setMovementSummaryDetails(initialSummaryDetails);
    }, [workout]);



    const handleNext = () => {
        if (currentStage < workout.workout_sections.length - 1) {
            setCurrentStage(currentStage + 1);
            flatListRef.current.scrollToIndex({ index: currentStage + 1 });
        }
    };

    const handlePrevious = () => {
        if (currentStage > 0) {
            setCurrentStage(currentStage - 1);
            flatListRef.current.scrollToIndex({ index: currentStage - 1 });
        }
    };

    const handleAddSet = (movementId) => {
        setMovementLogs((prevLogs) => ({
            ...prevLogs,
            [movementId]: [
                ...prevLogs[movementId],
                {
                    set_number: prevLogs[movementId].length + 1,
                    reps: 0,
                    weight: 0,
                },
            ],
        }));
    };

    const handleRemoveSet = (movementId, setIndex) => {
        setMovementLogs((prevLogs) => {
            const currentSets = prevLogs[movementId];
            // Ensure at least one set remains
            if (currentSets.length > 1) {
                const updatedSets = currentSets.filter((_, index) => index !== setIndex);
                return {
                    ...prevLogs,
                    [movementId]: updatedSets,
                };
            }
            return prevLogs; // If only one set remains, do nothing
        });
    };

    const handleSetChange = (movementId, setIndex, field, value) => {
        setMovementLogs((prevLogs) => {
            // Clone the entire movement log object
            const updatedLogs = { ...prevLogs };

            // Clone the specific array of sets for the movement
            const updatedSets = [...updatedLogs[movementId]];

            // Clone the specific set being changed (not modifying directly)
            const updatedSet = { ...updatedSets[setIndex] };

            // Update the field with the new value
            updatedSet[field] = value === null ? '' : parseFloat(value);

            // Put the updated set back into the array of sets
            updatedSets[setIndex] = updatedSet;

            // Put the updated array of sets back into the movement logs
            updatedLogs[movementId] = updatedSets;

            return updatedLogs;
        });
    };


    const handleSummaryChange = (movementId, field, value) => {
        setMovementSummaryDetails((prevDetails) => ({
            ...prevDetails,
            [movementId]: {
                ...prevDetails[movementId], // Clone the current object for the specific movement
                [field]: value, // Update the field (rpe or comments)
            },
        }));
    };



    const saveWorkout = async () => {
        setIsBouncerLoading(true)
        const payload = {
            sections: workout.workout_sections.map((section) => ({
                section_id: section.id,
                movements: section.section_movement_details.map((movement) => ({
                    movement_id: movement.id,
                    movement_difficulty: movementSummaryDetails[movement.id]?.movement_difficulty || 0, // Use the correct key from backend
                    movement_comments: movementSummaryDetails[movement.id]?.movement_comments || '', // Use the correct key from backend
                    sets: movementLogs[movement.id]?.map((set) => ({
                        set_number: set.set_number,
                        reps: set.reps,
                        weight: set.weight,
                    })) || [],
                })),
            })),
        };

        console.log('Payload:', JSON.stringify(payload, null, 2)); // Log payload for debugging

        try {
            const response = await fetch(`${ENV.API_URL}/api/workout_sections/save-workout-details/`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Error:', errorData);
                alert('Error saving workout');
            } else {
                const data = await response.json();
                alert('Workout saved successfully!');
                console.log('Saved response:', data);
            }
        } catch (error) {
            console.error('Error saving workout:', error);
            alert('Error saving workout. Please try again.');
        }
        setIsBouncerLoading(false)
    };


    const completeWorkout = async () => {
        setIsBouncerLoading(true)
        const payload = {
            sections: workout.workout_sections.map((section) => ({
                section_id: section.id,
                movements: section.section_movement_details.map((movement) => ({
                    movement_id: movement.id,
                    movement_difficulty: movementSummaryDetails[movement.id]?.movement_difficulty || 0, // Use the correct key from backend
                    movement_comments: movementSummaryDetails[movement.id]?.movement_comments || '', // Use the correct key from backend
                    sets: movementLogs[movement.id]?.map((set) => ({
                        set_number: set.set_number,
                        reps: set.reps,
                        weight: set.weight,
                    })) || [],
                })),
            })),
        };

        console.log('Payload:', JSON.stringify(payload, null, 2)); // Log payload for debugging

        try {
            const userId = await AsyncStorage.getItem('userId');
            const response = await axios.put(`${ENV.API_URL}/api/saved_workouts/complete-workout/${workout.id}/`, payload, {
                params: { user_id: userId }
            });
            setIsBouncerLoading(false)
            navigation.navigate('TrainingOverview')
            alert('Workout completed successfully!');
        } catch (error) {
            console.error('Error saving workout:', error);
            if (error.response && error.response.data) {
                alert(`Error: ${error.response.data.error}`);
                setIsBouncerLoading(false)
            } else {
                alert('Error saving workout. Please try again.');
                setIsBouncerLoading(false)
            }
        }

    };


    // if (isLoading) {
    //     return (
    //         <View style={styles.loadingContainer}>
    //             <Image
    //                 source={require('../../../../../assets/images/bouncing-ball-loader-white.gif')} // Make sure this path is correct
    //                 style={styles.loadingImage}
    //             />
    //         </View>
    //     );
    // }

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor="#F6F3DC" />
            <View style={styles.scrollContainer}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.topSection}>
                        <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('TrainingOverview')}>
                            <Ionicons name="arrow-back" size={24} color="black" />
                        </TouchableOpacity>
                        <View style={styles.headerTextBlock}>
                            <Text style={styles.headingText}>{workout?.name}</Text>
                            <View style={styles.workoutOverviewTime}>
                                <Ionicons name="time-outline" size={24} color="black" />
                                <Text style={styles.timeText}>{workout?.duration} mins</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Horizontal FlatList for Sections */}
                <FlatList
                    ref={flatListRef}
                    data={workout.workout_sections}
                    horizontal
                    pagingEnabled
                    keyExtractor={(item, index) => index.toString()}
                    showsHorizontalScrollIndicator={false}
                    renderItem={({ item, index }) => (
                        <View style={[styles.stageContainer, { width: SCREEN_WIDTH }]}>
                            {/* Section Title */}
                            <View style={styles.workoutTitleBox}>
                                <Text style={styles.stageTitle}>{item.section_name}</Text>
                                <View style={styles.line} />
                            </View>

                            {/* Vertical ScrollView for Movements */}
                            <ScrollView
                                contentContainerStyle={styles.movementScrollContainer}
                                showsVerticalScrollIndicator={false}
                            >
                                {item.section_movement_details.map((movement, movementIndex) => (
                                    <View key={movementIndex} style={styles.movementContainer}>
                                        {/* Movement Subtitle */}
                                        <Text style={styles.movementSubtitle}>{movement.movements.exercise}</Text>

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


                                        {/* Dynamic Tab Content */}
                                        {activeTab === 'Summary' && (
                                            <View style={styles.tabContent}>
                                                <Image
                                                    style={styles.movementImage}
                                                // source={require('../../../../../assets/images/sample-exercise.png')} // Replace with actual image path
                                                />
                                                <Text style={styles.movementName}>
                                                    {movement.movements.exercise}
                                                </Text>
                                                <Text style={styles.movementDescription}>
                                                    {/* {`Perform ${movement.movement_order} reps with proper form.`} */}
                                                </Text>
                                            </View>
                                        )}
                                        {activeTab === 'Log' && (
                                            <KeyboardAwareScrollView
                                                contentContainerStyle={styles.scrollContent}
                                                enableOnAndroid={true} // Ensure keyboard avoidance works on Android
                                                extraScrollHeight={100} // Adjust to provide extra space when the keyboard appears
                                            >
                                                <View style={styles.tabContent}>
                                                    <View style={styles.logContent}>
                                                        {item.section_name !== 'Warmup' && (
                                                            <View style={styles.logContentHeader}>
                                                                <Text style={styles.exerciseLabel}>Set details</Text>
                                                                {/* Hide the add set button for warmup */}
                                                                <TouchableOpacity
                                                                    style={styles.addSetButton}
                                                                    onPress={() => handleAddSet(movement.id)}
                                                                >
                                                                    <Ionicons name="add-circle-outline" size={24} color="black" />
                                                                </TouchableOpacity>
                                                            </View>
                                                        )}
                                                        {/* Hide set details for warmup section */}
                                                        {item.section_name !== 'Warmup' && movementLogs[movement.id]?.map((set, setIndex) => (
                                                            <View key={setIndex} style={styles.setRow}>
                                                                <Text style={styles.setNumber}>{setIndex + 1}</Text>
                                                                <View style={styles.weightInput}>
                                                                    <Text style={styles.weightText}>Weight</Text>
                                                                    <View style={styles.weightInputRow}>
                                                                        <TextInput
                                                                            style={styles.input}
                                                                            keyboardType="numeric"
                                                                            value={set.weight !== null && set.weight !== undefined ? String(set.weight) : ''}
                                                                            onChangeText={(value) => {
                                                                                const numericValue = value === '' ? null : parseInt(value, 10);
                                                                                handleSetChange(movement.id, setIndex, 'weight', numericValue);
                                                                            }}
                                                                        />
                                                                        <Text style={styles.weightText}>KG</Text>
                                                                    </View>
                                                                </View>
                                                                <Text>x</Text>
                                                                <View style={styles.weightInput}>
                                                                    <Text style={styles.weightText}>Reps</Text>
                                                                    <View style={styles.weightInputRow}>
                                                                        <TextInput
                                                                            style={styles.input}
                                                                            keyboardType="numeric"
                                                                            value={set.reps !== null && set.reps !== undefined ? String(set.reps) : ''}
                                                                            onChangeText={(value) => {
                                                                                const numericValue = value.trim() === '' ? null : parseInt(value, 10);
                                                                                handleSetChange(movement.id, setIndex, 'reps', numericValue);
                                                                            }}
                                                                        />
                                                                    </View>
                                                                </View>

                                                                <TouchableOpacity
                                                                    onPress={() => handleRemoveSet(movement.id, setIndex)}
                                                                >
                                                                    <Ionicons name="remove-circle-outline" size={24} color="black" />
                                                                </TouchableOpacity>
                                                            </View>
                                                        ))}

                                                        {/* Comment Block */}
                                                        <View style={styles.commentBlock}>
                                                            <Text style={styles.exerciseLabel}>Comments</Text>
                                                            <TextInput
                                                                style={styles.commentInput}
                                                                value={movementSummaryDetails[movement.id]?.movement_comments ?? ''}
                                                                onChangeText={(value) => handleSummaryChange(movement.id, 'movement_comments', value)}
                                                                placeholder="Enter your comments"
                                                            />
                                                        </View>

                                                        {/* RPE Block */}
                                                        <View style={styles.commentBlock}>
                                                            <Text style={styles.exerciseLabel}>RPE: {movementSummaryDetails[movement.id]?.movement_difficulty ?? 0}</Text>
                                                            <Slider
                                                                style={styles.slider}
                                                                minimumValue={0}
                                                                maximumValue={10}
                                                                step={1}
                                                                minimumTrackTintColor="#D6F7F4"
                                                                value={movementSummaryDetails[movement.id]?.movement_difficulty ?? 0}
                                                                onValueChange={(value) => handleSummaryChange(movement.id, 'movement_difficulty', value)}
                                                            />
                                                        </View>

                                                        <TouchableOpacity style={styles.saveButton} onPress={() => saveWorkout()}>
                                                            <Text style={styles.saveButtonText}>Save details</Text>
                                                        </TouchableOpacity>
                                                    </View>
                                                </View>
                                            </KeyboardAwareScrollView>
                                        )}

                                        {activeTab === 'History' && (
                                            <View style={styles.tabContent}>
                                                <View style={styles.historyContent}>
                                                    <Text style={styles.exerciseLabel}>
                                                        {movement.movements.exercise} history
                                                    </Text>

                                                    {/* Get history for the current exercise ID */}
                                                    {movementHistory && movementHistory[movement.movements.id] ? (
                                                        movementHistory[movement.movements.id].length > 0 ? (
                                                            movementHistory[movement.movements.id]
                                                                .filter(dateGroup =>
                                                                    dateGroup.sets.length > 0 && // Ensure the date has sets
                                                                    dateGroup.sets.some(set => set.reps !== null && set.weight !== null) // Ensure at least one set has valid data
                                                                )
                                                                .map((dateGroup, index) => (
                                                                    <View key={index} style={styles.historyItem}>
                                                                        {/* Date */}
                                                                        <View style={styles.dateBox}>
                                                                            <Text style={styles.historyDate}>
                                                                                {new Date(dateGroup.workout_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                                            </Text>
                                                                            <View style={styles.divider}></View>
                                                                        </View>

                                                                        {/* Sets and Movement Difficulty */}
                                                                        <View style={styles.allScoresContainer}>
                                                                            {/* Sets */}
                                                                            <View style={styles.setsContainer}>
                                                                                {dateGroup.sets
                                                                                    .filter(set => set.reps !== null && set.weight !== null) // Only show sets with valid values
                                                                                    .sort((a, b) => a.set_number - b.set_number) // Sort sets in ascending order by set_number
                                                                                    .map((set, setIndex) => (
                                                                                        <View key={setIndex} style={styles.setItem}>
                                                                                            <Text style={styles.setSubNumber}>{set.set_number}</Text>
                                                                                            {set.weight !== null && set.weight !== undefined ? (
                                                                                                <>
                                                                                                    <Text style={styles.setValue}>{set.weight}</Text>
                                                                                                    <Text style={styles.setMetric}>KG</Text>
                                                                                                </>
                                                                                            ) : null}
                                                                                            <Text style={styles.setCross}>x</Text>
                                                                                            {set.reps !== null && set.reps !== undefined ? (
                                                                                                <>
                                                                                                    <Text style={styles.setValue}>{set.reps}</Text>
                                                                                                    <Text style={styles.setMetric}>Reps</Text>
                                                                                                </>
                                                                                            ) : null}
                                                                                        </View>
                                                                                    ))}
                                                                            </View>

                                                                            {/* Movement Difficulty */}
                                                                            {dateGroup.movement_difficulty !== null && dateGroup.movement_difficulty !== undefined ? (
                                                                                <View style={styles.scoreContainer}>
                                                                                    <RPEGauge score={dateGroup.movement_difficulty} />
                                                                                </View>
                                                                            ) : null}
                                                                        </View>
                                                                    </View>
                                                                ))
                                                        ) : (
                                                            <Text style={styles.noHistoryText}>No history available</Text>
                                                        )
                                                    ) : (
                                                        <Text style={styles.noHistoryText}>No actual history available</Text>
                                                    )}
                                                </View>
                                            </View>
                                        )}




                                    </View>
                                ))}
                                <View />
                                {/* Navigation Buttons */}
                                <View style={styles.navigationContainer}>
                                    <TouchableOpacity
                                        style={[styles.navButton, currentStage === 0 && styles.disabledButton]}
                                        onPress={handlePrevious}
                                        disabled={currentStage === 0}
                                    >
                                        <Ionicons name="arrow-back" size={24} color="white" />
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.finishButton} onPress={() => completeWorkout()}>
                                        <Text style={styles.finishButtonText}>Finish Workout</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[
                                            styles.navButton,
                                            currentStage === workout.workout_sections.length - 1 && styles.disabledButton,
                                        ]}
                                        onPress={handleNext}
                                        disabled={currentStage === workout.workout_sections.length - 1}
                                    >
                                        <Ionicons name="arrow-forward" size={24} color="white" />
                                    </TouchableOpacity>
                                </View>
                            </ScrollView>
                        </View>

                    )}
                    onMomentumScrollEnd={(e) => {
                        const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                        setCurrentStage(index);
                        Keyboard.dismiss(); // Dismiss the keyboard when swiping
                    }}
                />


            </View>
        </SafeAreaView>

    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F3F3FF',
    },
    scrollContainer: {
        flexGrow: 1,
        backgroundColor: '#F3F3FF',
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
        fontWeight: '600',
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
        paddingBottom: 100,
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
        // alignItems: 'center',
        marginTop: 10,
        backgroundColor: 'white',
        minHeight: 400,
        borderRightWidth: 4,
        borderBottomWidth: 4,
        borderTopWidth: 1,
        borderLeftWidth: 1,
        borderRadius: 20,
    },
    movementImage: {
        width: '93%',
        margin: 12,
        height: 200,
        borderRadius: 10,
        // marginBottom: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
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
    input: {
        padding: 5,
        fontSize: 20,
        fontWeight: 700,
        minWidth: 50,
        textAlign: 'center',
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
    slider: {
        width: '90%',
        height: 40,
        alignSelf: 'center',
        // backgroundColor: '#D6F7F4',
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
        marginBottom: 10,
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
        justifyContent: 'space-between',
        width: '48%',
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
        // marginRight: 5,
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
});
