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
    Modal,
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
import { Colours } from '@/app/src/components/styles';
import { Video } from 'expo-av';
import RPEInfoModal from '../../modalScreens/InfoModals/RPEInfo';
import VideoModal from '../../modalScreens/VideoModal';

const SCREEN_WIDTH = Dimensions.get('window').width;
const ITEM_WIDTH = SCREEN_WIDTH - 45;


export default function CompleteWorkout({ route, navigation }) {
    const { setIsBouncerLoading } = useLoader(); // Access loader functions
    const { workout, movementHistory, conditioningHistory } = route.params; // Get the workout data from the previous screen
    // console.log('Movement history: ', JSON.stringify(movementHistory, null, 2))
    console.log('Conditioning history: ', JSON.stringify(conditioningHistory, null, 2))
    const [currentStage, setCurrentStage] = useState(0); // Current workout stage index
    const [activeTab, setActiveTab] = useState('Summary'); // Active tab for Summary, Log, History
    const flatListRef = useRef(null); // Ref for FlatList to programmatically scroll
    const [isLoading, setIsLoading] = useState(false)
    // State to track the sets for each movement
    const [movementLogs, setMovementLogs] = useState({});
    const [movementSummaryDetails, setMovementSummaryDetails] = useState({})
    const [conditioningDetails, setConditioningDetails] = useState({});
    const [isVideoPlaying, setIsVideoPlaying] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedMovement, setSelectedMovement] = useState(null);
    const [rpeModalVisible, setRpeModalVisible] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0); // Current index for FlatList

    useEffect(() => {
        const initialLogs = {};
        const initialSummaryDetails = {};
        const initialConditioningDetails = {}; // Add state for conditioning-specific details

        workout.workout_sections.forEach((section) => {
            if (section.section_name === "Conditioning" && section.conditioning_elements.length > 0) {
                // Handle Conditioning section
                section.conditioning_elements.forEach((conditioning) => {
                    initialConditioningDetails[conditioning.id] = {
                        comments: conditioning.comments || '', // Set initial comments
                        rpe: conditioning.rpe || 0,           // Set initial RPE
                    };

                    // If conditioning details exist, handle movements inside them
                    conditioning.conditioning_overview.conditioning_details.forEach((detail) => {
                        initialLogs[detail.id] = [{ set_number: 1, reps: null, weight: null }];
                        initialSummaryDetails[detail.id] = {
                            movement_difficulty: 0,
                            movement_comments: '',
                        };
                    });
                });
            } else {
                // Handle non-conditioning sections
                section.section_movement_details.forEach((movement) => {
                    initialLogs[movement.id] = movement.workout_sets.length > 0
                        ? movement.workout_sets
                        : [
                            { set_number: 1, reps: null, weight: null },
                            // { set_number: 2, reps: null, weight: null },
                            // { set_number: 3, reps: null, weight: null },
                        ];
                    initialSummaryDetails[movement.id] = {
                        movement_difficulty: movement.movement_difficulty ?? 0,
                        movement_comments: movement.movement_comment ?? '',
                    };
                });
            }
        });

        setMovementLogs(initialLogs);
        setMovementSummaryDetails(initialSummaryDetails);
        setConditioningDetails(initialConditioningDetails); // Set conditioning details state
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
        setMovementLogs((prevLogs) => {
            // 1) Grab the current sets for this movement
            const currentSets = prevLogs[movementId];

            // 2) Get the last set's reps/weight
            const lastSet = currentSets[currentSets.length - 1];

            // 3) Duplicate its values (or empty if lastSet is empty)
            const newSet = {
                set_number: currentSets.length + 1,
                reps: lastSet.reps,       // copy the last set’s reps
                weight: lastSet.weight,   // copy the last set’s weight
            };

            // 4) Return the updated logs
            return {
                ...prevLogs,
                [movementId]: [...currentSets, newSet],
            };
        });
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

    const handleConditioningChange = (conditioningId, field, value) => {
        setConditioningDetails((prevDetails) => ({
            ...prevDetails,
            [conditioningId]: {
                ...prevDetails[conditioningId],
                [field]: value,
            },
        }));
    };

    const formatHistoryDate = (rawDateString) => {
        const date = new Date(rawDateString);

        // Define "today" and "yesterday"
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        // Helper to check if two dates have the same year/month/day
        const isSameDay = (d1, d2) =>
            d1.getFullYear() === d2.getFullYear() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getDate() === d2.getDate();

        // Return "Today", "Yesterday", or a formatted string
        if (isSameDay(date, today)) {
            return 'Today';
        } else if (isSameDay(date, yesterday)) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
    }


    const saveWorkout = async () => {
        setIsBouncerLoading(true);

        const payload = {
            scheduled_date: workout.scheduled_date,
            sections: workout.workout_sections.map((section) => {
                if (section.section_name === "Conditioning" && section.conditioning_elements.length > 0) {
                    // Include conditioning-specific details
                    return {
                        section_id: section.id,
                        conditioning_workouts: section.conditioning_elements.map((conditioning) => ({
                            conditioning_id: conditioning.id,
                            comments: conditioningDetails[conditioning.id]?.comments || '', // Conditioning comments
                            rpe: conditioningDetails[conditioning.id]?.rpe || 0,           // Conditioning RPE
                        })),
                    };
                }
                // For non-conditioning sections
                return {
                    section_id: section.id,
                    movements: section.section_movement_details.map((movement) => ({
                        movement_id: movement.id,
                        movement_difficulty: movementSummaryDetails[movement.id]?.movement_difficulty || 0,
                        movement_comments: movementSummaryDetails[movement.id]?.movement_comments || '',
                        sets: movementLogs[movement.id]?.map((set) => ({
                            set_number: set.set_number,
                            reps: set.reps,
                            weight: set.weight,
                        })) || [],
                    })),
                };
            }),
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
        } finally {
            setIsBouncerLoading(false);
        }
    };


    const completeWorkout = async () => {
        setIsBouncerLoading(true);

        const payload = {
            scheduled_date: workout.scheduled_date,
            sections: workout.workout_sections.map((section) => ({
                section_id: section.id,
                movements: section.section_movement_details.map((movement) => ({
                    movement_id: movement.id,
                    movement_difficulty: movementSummaryDetails[movement.id]?.movement_difficulty || 0,
                    movement_comments: movementSummaryDetails[movement.id]?.movement_comments || '',
                    sets: movementLogs[movement.id]?.map((set) => ({
                        set_number: set.set_number,
                        reps: set.reps,
                        weight: set.weight,
                    })) || [],
                })),
                ...(section.section_name === "Conditioning" && section.conditioning_elements.length > 0
                    ? {
                        conditioning_workouts: section.conditioning_elements.map((conditioning) => ({
                            conditioning_id: conditioning.id,
                            comments: conditioningDetails[conditioning.id]?.comments || '',
                            rpe: conditioningDetails[conditioning.id]?.rpe || 0,
                        })),
                    }
                    : {}),
            })),
        };

        console.log('Payload:', JSON.stringify(payload, null, 2)); // Log payload for debugging

        try {
            const userId = await AsyncStorage.getItem('userId');
            const response = await axios.put(
                `${ENV.API_URL}/api/saved_workouts/complete-workout/${workout.id}/`,
                payload,
                { params: { user_id: userId } }
            );
            setIsBouncerLoading(false);
            navigation.navigate('TrainingOverview');
            alert('Workout completed successfully!');
        } catch (error) {
            console.error('Error saving workout:', error);
            if (error.response && error.response.data) {
                alert(`Error: ${error.response.data.error}`);
            } else {
                alert('Error saving workout. Please try again.');
            }
            setIsBouncerLoading(false);
        }
    };



    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor="#F6F3DC" />
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={10} // Adjust if you have a top header

            >
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
                        keyboardDismissMode="on-drag"
                        keyboardShouldPersistTaps="always" // Allow taps to pass through to FlatList
                        onScrollBeginDrag={() => Keyboard.dismiss()} // <-- Add this
                        renderItem={({ item, index }) => (
                            <View style={[styles.stageContainer, { width: SCREEN_WIDTH }]}>
                                {/* Section Title */}
                                <View style={styles.workoutTitleBox}>
                                    <Text style={styles.stageTitle}>{item.section_name}</Text>
                                    <View style={styles.line} />
                                </View>

                                {item.section_name === "Conditioning" ? (
                                    <>
                                        <View style={styles.conditioningContainer}>
                                            <View style={styles.tabs}>
                                                {['Summary', 'Log', 'History'].map((tab) => {
                                                    const tabColors = {
                                                        'Summary': Colours.buttonColour,
                                                        'Log': Colours.buttonColour,
                                                        'History': Colours.buttonColour,
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
                                                    );
                                                })}
                                            </View>
                                            <View style={styles.tabContent}>
                                                {activeTab === "Summary" && (
                                                    <View style={styles.screenContainer}>
                                                        <View style={styles.sectionContainer}>

                                                            {/* 1) Show the general structure, similar to HIIT's <Text style={styles.summaryDetail}>{session.structure}</Text> */}
                                                            <Text style={styles.summaryDetail}>
                                                                {item.conditioning_elements?.[0]?.conditioning_overview?.notes || "No structure/notes provided"}
                                                            </Text>

                                                            {/* 2) A single blockContainer that lists the “movements” (similar to HIIT blocks) */}
                                                            <View style={styles.blockContainer}>
                                                                {/* If you want a “block name” like HIIT’s block_name: rep_scheme */}
                                                                <Text style={styles.sectionTitle}>
                                                                    {item.conditioning_elements?.[0]?.conditioning_overview?.name || "Conditioning Block"}
                                                                </Text>

                                                                {/* 3) Movements list, similar to HIIT’s block.hiit_movements */}
                                                                {item.section_movement_details?.map((movementDetail, i) => {
                                                                    // movementDetail.movements is your actual movement object
                                                                    const movement = movementDetail.movements || {};
                                                                    const movementName = movement.exercise || "No exercise name";
                                                                    const condDetail = item.conditioning_elements?.[0]?.conditioning_overview?.conditioning_details?.find(
                                                                        (cd) => cd.movement_order === movementDetail.movement_order
                                                                    );

                                                                    const detail = condDetail?.detail;

                                                                    console.log('Movement: ', JSON.stringify(item, null, 2))
                                                                    return (
                                                                        <View key={i} style={styles.movementRow}>
                                                                            <View style={styles.movementLeft}>
                                                                                <Text>
                                                                                    {/* Index label + movement name */}
                                                                                    <Text style={styles.movementLabel}>{`${i + 1}: `}</Text>
                                                                                    <Text style={styles.movementDetail}>{`${detail} `}</Text>
                                                                                    <Text style={styles.movementDetail}>{movementName}</Text>
                                                                                </Text>
                                                                            </View>

                                                                            {/* 4) Play button (except for “Rest”) */}
                                                                            {movementName.toLowerCase() === "rest" ? null : (
                                                                                <TouchableOpacity
                                                                                    onPress={() => {
                                                                                        setSelectedMovement({
                                                                                            ...movement,
                                                                                            portrait_video_url: movement.portrait_video_url,
                                                                                        });
                                                                                    }}
                                                                                >
                                                                                    <Ionicons name="play-circle" size={24} color="black" />
                                                                                </TouchableOpacity>
                                                                            )}
                                                                        </View>
                                                                    );
                                                                })}

                                                                {/* 5) Divider line at the end of the block, like in HIIT */}
                                                                <View style={styles.subDividerLine}></View>
                                                            </View>
                                                        </View>
                                                    </View>
                                                )}

                                                {activeTab === 'Log' && (
                                                    <>
                                                        <View style={styles.logContent}>
                                                            {item.conditioning_elements.map((conditioning) => (
                                                                <>
                                                                    <View key={conditioning.id} style={styles.commentBlock}>
                                                                        {/* Comments */}
                                                                        <Text style={styles.exerciseLabel}>Comments</Text>
                                                                        <TextInput
                                                                            style={styles.commentInput}
                                                                            value={conditioningDetails[conditioning.id]?.comments || ''}
                                                                            onChangeText={(value) => handleConditioningChange(conditioning.id, 'comments', value)}
                                                                            placeholder="Brutal conditioning..." />
                                                                    </View>
                                                                    <View style={styles.commentBlock}>
                                                                        <View style={styles.RPEBlock}>
                                                                            <Text style={styles.exerciseLabel}>RPE: {conditioningDetails[conditioning.id]?.rpe || 0}</Text>
                                                                            <Ionicons name="information-circle-outline" size={24} color="black" style={{ marginBottom: 10 }} onPress={() => setRpeModalVisible(true)} />
                                                                        </View>
                                                                        <Slider
                                                                            style={styles.slider}
                                                                            minimumValue={0}
                                                                            maximumValue={10}
                                                                            step={1}
                                                                            minimumTrackTintColor="#D6F7F4"
                                                                            value={conditioningDetails[conditioning.id]?.rpe || 0}
                                                                            onValueChange={(value) => handleConditioningChange(conditioning.id, 'rpe', value)} />
                                                                    </View>
                                                                </>
                                                            ))}
                                                            <TouchableOpacity style={styles.saveButton} onPress={() => saveWorkout()}>
                                                                <Text style={styles.saveButtonText}>Save details</Text>
                                                            </TouchableOpacity>
                                                        </View>
                                                    </>
                                                )}
                                                {activeTab === 'History' && (
                                                    <View style={styles.historyContent}>
                                                        <Text style={styles.exerciseLabel}>Conditioning History</Text>
                                                        {conditioningHistory && Object.keys(conditioningHistory).length > 0 ? (
                                                            Object.entries(conditioningHistory).map(([overviewId, historyArray]) => (
                                                                <View key={overviewId}>
                                                                    {/* If you want a separate header for each overview ID, do it here */}
                                                                    {/* e.g. <Text style={styles.exerciseLabel}>Conditioning Overview {overviewId} History</Text> */}

                                                                    {historyArray.length > 0 ? (
                                                                        historyArray.map((dateGroup, index) => (
                                                                            <View key={index} style={styles.historyItem}>
                                                                                {/* Date */}
                                                                                <View style={styles.dateBox}>
                                                                                    <Text style={styles.historyDate}>
                                                                                        {formatHistoryDate(dateGroup.completed_date)}
                                                                                    </Text>
                                                                                    <View style={styles.divider}></View>
                                                                                </View>

                                                                                {/* Comments + RPE */}
                                                                                <View style={styles.allScoresContainer}>
                                                                                    {/* We'll treat "entries" as the "sets container" area */}
                                                                                    <View style={styles.setsContainer}>
                                                                                        {dateGroup.entries && dateGroup.entries.map((entry, eIndex) => (
                                                                                            <View key={eIndex} style={styles.commentItem}>
                                                                                                {/* Just display the comments text */}
                                                                                                <Text style={styles.commentTitleText}>Comments: </Text>
                                                                                                <Text style={styles.commentText}>{entry.comments}</Text>
                                                                                            </View>
                                                                                        ))}
                                                                                    </View>

                                                                                    {/* If you still want RPE gauge on the right */}
                                                                                    {dateGroup.entries && dateGroup.entries.length > 0 && (
                                                                                        // Example: take the first entry's RPE if that's your main measure
                                                                                        dateGroup.entries[0].rpe ? (
                                                                                            <View style={styles.scoreContainer}>
                                                                                                <RPEGauge score={dateGroup.entries[0].rpe} />
                                                                                            </View>
                                                                                        ) : null
                                                                                    )}
                                                                                </View>

                                                                            </View>
                                                                        ))
                                                                    ) : (
                                                                        <Text style={styles.noHistoryText}>No conditioning history available</Text>
                                                                    )}
                                                                </View>
                                                            ))
                                                        ) : (
                                                            <Text style={styles.noHistoryText}>No conditioning history available</Text>
                                                        )}
                                                    </View>
                                                )}

                                            </View>
                                        </View>
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
                                    </>
                                ) : (
                                    < ScrollView
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
                                                            'Summary': Colours.buttonColour,
                                                            'Log': Colours.buttonColour,
                                                            'History': Colours.buttonColour,
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
                                                        {/* Thumbnail Button */}
                                                        <TouchableOpacity
                                                            style={styles.thumbnailContainer}
                                                            onPress={() => setSelectedMovement(movement.movements)}
                                                        >
                                                            {/* Thumbnail */}
                                                            <Image
                                                                style={styles.thumbnailImage}
                                                                source={{ uri: movement.movements.landscape_thumbnail }}
                                                            />

                                                            {/* Play Icon Overlay */}
                                                            <View style={styles.playIconOverlay}>
                                                                <Ionicons name="play-circle" size={48} color="white" />
                                                            </View>
                                                        </TouchableOpacity>

                                                        {/* Modal for Full-Screen Video */}
                                                        {selectedMovement?.id === movement.movements.id && (
                                                            <VideoModal
                                                                visible={!!selectedMovement}
                                                                movement={selectedMovement}
                                                                onClose={() => setSelectedMovement(null)}
                                                            />
                                                        )}
                                                        {/* Section instructions */}
                                                        <View style={styles.summarySections}>
                                                            {/* <Text style={styles.movementName}>{`${item.section_name}: ${movement.movements.exercise}`}</Text> */}
                                                            {item.section_name === "Warm up A" ?
                                                                <Text style={styles.sectionSubTitle}>Progressive 4 min warm up to get the heart rate going</Text> :
                                                                item.section_type === "superset" ?
                                                                    <Text style={styles.sectionSubTitle}>{`Complete ${item.section_name} as a superset with no rest between exercises.`}</Text> :
                                                                    item.section_type === "single" ?
                                                                        <Text style={styles.sectionSubTitle}>{`${item.section_name} is a single exercise. Focus on maximising your performance with this movement.`}</Text> :
                                                                        ''}

                                                        </View>
                                                        {/* Movement instructions */}
                                                        <View style={styles.summarySections}>
                                                            {(item.section_name === "Warm up A" || item.section_name === "Warm Up A") ?
                                                                '' :
                                                                <Text style={styles.movementName}>Movement instructions</Text>
                                                            }
                                                            {(item.section_name === "Warm up B" || item.section_name === "Warm Up B") && movement.movements.movement_hold_cue === "Movement" ?
                                                                <Text style={styles.sectionSubTitle}>Complete 2 sets of 5-8 reps at RPE 5-6</Text> :
                                                                (item.section_name === "Warm up B" || item.section_name === "Warm Up B") && movement.movements.movement_hold_cue === "Hold" ?
                                                                    <Text style={styles.sectionSubTitle}>Complete 2 sets for 20-40 seconds</Text> :
                                                                    item.section_name === "Strong 1" || item.section_name === "Strong 2" ?
                                                                        <Text style={styles.sectionSubTitle}>Complete 3 sets of 5-8 reps at RPE 8</Text> :
                                                                        (item.section_name === "Build 1" || item.section_name === "Build 2") && movement.movements.movement_hold_cue === "Movement" ?
                                                                            <Text style={styles.sectionSubTitle}>Complete 3 sets of 8-12 reps at RPE 8-9</Text> :
                                                                            (item.section_name === "Build 1" || item.section_name === "Build 2") && movement.movements.movement_hold_cue === "Hold" ?
                                                                                <Text style={styles.sectionSubTitle}>Complete 3 sets of 30-60 seconds</Text> :
                                                                                (item.section_name === "Pump 1" || item.section_name === "Pump 2") && movement.movements.movement_hold_cue === "Movement" ?
                                                                                    <Text style={styles.sectionSubTitle}>Complete 2-3 sets of 12-20 reps at RPE 9</Text> :
                                                                                    (item.section_name === "Pump 1" || item.section_name === "Pump 2") && movement.movements.movement_hold_cue === "Hold" ?
                                                                                        <Text style={styles.sectionSubTitle}>Complete 3 sets of 30-60 seconds</Text> :
                                                                                        ''}

                                                        </View>

                                                        {/* Coaching cues */}
                                                        {movement?.movements?.coaching_cue1 && (
                                                            <View style={styles.summarySections}>
                                                                {/* Show heading unless it's a "Warm up A" section */}
                                                                {(item.section_name === "Warm up A" || item.section_name === "Warm Up A")
                                                                    ? null
                                                                    : <Text style={styles.movementName}>Coaching cues</Text>
                                                                }

                                                                {/* We'll collect the cues in an array to map over */}
                                                                <View style={styles.bulletList}>
                                                                    {/* Cue 1 */}
                                                                    {!!movement.movements.coaching_cue1 && (
                                                                        <View style={styles.bulletRow}>
                                                                            <Text style={styles.bullet}>•</Text>
                                                                            <Text style={styles.bulletListItem}>{movement.movements.coaching_cue2}</Text>
                                                                        </View>
                                                                    )}
                                                                    {/* Cue 2 */}
                                                                    {!!movement.movements.coaching_cue2 && (
                                                                        <View style={styles.bulletRow}>
                                                                            <Text style={styles.bullet}>•</Text>
                                                                            <Text style={styles.bulletListItem}>{movement.movements.coaching_cue2}</Text>
                                                                        </View>
                                                                    )}
                                                                    {/* ...Add more if needed */}
                                                                </View>
                                                            </View>
                                                        )}

                                                    </View>
                                                )}

                                                {activeTab === 'Log' && (
                                                    // <KeyboardAvoidingView
                                                    //     // style={{ flexGrow: 1 }}
                                                    //     behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                                                    //     keyboardVerticalOffset={50} // Adjust if you have a header
                                                    // >
                                                    <View style={styles.tabContent}>
                                                        <View style={styles.logContent}>
                                                            {item.section_name !== 'Warm up A' && (
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
                                                            {item.section_name !== 'Warm up A' && movementLogs[movement.id]?.map((set, setIndex) => (
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
                                                                    placeholder="Smashed it, increase weight next week..."
                                                                />
                                                            </View>

                                                            {/* RPE Block */}
                                                            <View style={styles.commentBlock}>
                                                                <View style={styles.RPEBlock}>
                                                                    <Text style={styles.exerciseLabel}>RPE: {movementSummaryDetails[movement.id]?.movement_difficulty ?? 0}</Text>
                                                                    <Ionicons name="information-circle-outline" size={24} color="black" style={{ marginBottom: 10 }} onPress={() => setRpeModalVisible(true)} />
                                                                </View>
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
                                                    // </KeyboardAvoidingView>
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
                                                                            dateGroup.sets.some(set => set.reps !== 0 && set.weight !== 0) // Ensure at least one set has valid data
                                                                        )
                                                                        .map((dateGroup, index) => (
                                                                            <View key={index} style={styles.historyItem}>
                                                                                {/* Date */}
                                                                                <View style={styles.dateBox}>
                                                                                    <Text style={styles.historyDate}>
                                                                                        {formatHistoryDate(dateGroup.completed_date)}
                                                                                    </Text>
                                                                                    <View style={styles.divider}></View>
                                                                                </View>

                                                                                {/* Sets and Movement Difficulty */}
                                                                                <View style={styles.allScoresContainer}>
                                                                                    {/* Sets */}
                                                                                    <View style={styles.setsContainer}>
                                                                                        {dateGroup.sets
                                                                                            .filter(set => set.reps > 0 && set.weight > 0) // Only show sets with valid values
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
                                                                                    {dateGroup.movement_difficulty !== 0 && dateGroup.movement_difficulty !== 0 ? (
                                                                                        <View style={styles.scoreContainer}>
                                                                                            <RPEGauge score={dateGroup.movement_difficulty} />
                                                                                        </View>
                                                                                    ) : null}
                                                                                </View>
                                                                                {dateGroup.movement_comment &&
                                                                                    <View style={styles.setsContainer}>
                                                                                        <View style={styles.commentItem}>
                                                                                            {/* Just display the comments text */}
                                                                                            <Text style={styles.commentTitleText}>Comments: </Text>
                                                                                            <Text style={styles.commentText}>{dateGroup.movement_comment}</Text>
                                                                                        </View>
                                                                                    </View>
                                                                                }
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
                                )}
                            </View>

                        )}
                        onMomentumScrollEnd={(e) => {
                            const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                            setCurrentStage(index);
                            Keyboard.dismiss(); // Dismiss the keyboard when swiping
                        }}
                    />
                    <RPEInfoModal
                        visible={rpeModalVisible}
                        onClose={() => setRpeModalVisible(false)}
                    />
                    {selectedMovement && (
                        <VideoModal
                            visible={!!selectedMovement}
                            movement={selectedMovement}
                            onClose={() => setSelectedMovement(null)}
                        />
                    )}
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView >

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
        fontSize: 18,
        fontWeight: '600',
        marginVertical: 10,
        color: 'rgba(0, 0, 0, 0.6)',
        // textAlign: 'center',
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
        paddingHorizontal: 0,
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
        fontWeight: 600,
        color: Colours.secondaryColour,
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
    // summaryContent: {
    //     flexDirection:''
    // },
    thumbnail: {
        width: '93%',
        margin: 12,
        height: 200,
        borderRadius: 10,
        // marginBottom: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    thumbnailContainer: {
        // some desired width/height for the container
        // width: '100%',
        // height: 200,
        position: 'relative', // ensures the child overlay can be absolutely positioned
        margin: 8,
    },
    thumbnailImage: {
        // width: '93%',
        margin: 12,
        height: 200,
        borderRadius: 10,
        // marginBottom: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    playIconOverlay: {
        position: 'absolute',
        // Center the icon
        top: '50%',
        left: '50%',
        // Shift it back up/left by half its size to truly center
        transform: [{ translateX: -24 }, { translateY: -24 }],
        zIndex: 9999,
    },
    movementName: {
        marginHorizontal: 20,
        fontWeight: '600',
    },
    sectionSubTitle: {
        marginTop: 5,
        marginHorizontal: 20,
    },
    summarySections: {
        marginBottom: 10,
    },
    bulletList: {
        marginTop: 5,
        marginHorizontal: 20,
    },
    bulletRow: {
        flexDirection: 'row',
    },
    bullet: {
        fontSize: 14,
        marginLeft: 5,
    },
    bulletListItem: {
        fontSize: 14,
        lineHeight: 20,
        marginLeft: 5,
        marginBottom: 2,
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
        backgroundColor: Colours.buttonColour,
        padding: 15,
        borderRadius: 50,
    },
    disabledButton: {
        backgroundColor: '#A9A9A9',
    },
    finishButton: {
        backgroundColor: Colours.buttonColour,
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
    scrollContent: {
        flex: 1,
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
        backgroundColor: Colours.buttonColour,
        color: Colours.secondaryColour,
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
        backgroundColor: Colours.buttonColour,
        // flex: 1,
        marginHorizontal: 10,
        alignItems: 'center',
        paddingVertical: 15,
        borderRadius: 50,
        marginTop: 20,
    },
    saveButtonText: {
        color: Colours.secondaryColour,
        fontSize: 16,
        fontWeight: 'bold',
    },
    commentBlock: {
        marginTop: 10,
    },
    RPEBlock: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
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
    commentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        // justifyContent: 'space-between',
        width: '78%',
        marginBottom: 10,
        fontWeight: '700',
    },
    setSubNumber: {
        width: 25,
        height: 25,
        paddingTop: 5,
        borderRadius: 20,
        fontSize: 12,
        textAlign: 'center',
        backgroundColor: Colours.buttonColour,
        color: Colours.secondaryColour,
        // marginRight: 5,
    },
    setValue: {
        fontWeight: 600,
        fontSize: 14,
    },
    commentText: {
        fontWeight: 400,
        fontSize: 14,
    },
    commentTitleText: {
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
    conditioningDetails: {
        marginHorizontal: 20,
        marginVertical: 10,
    },
    conditioningDescription: {
        marginVertical: 10,
    },
    movementDetail: {
        margin: 0,
    },
    videoContainer: {
        position: 'relative',
        width: '100%',
        height: 800,
        backgroundColor: 'black',
    },
    videoPlayer: {
        width: '100%',
        height: '100%',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'black',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullScreenVideo: {
        width: '100%',
        height: '100%',
    },
    closeButton: {
        position: 'absolute',
        top: 40,
        right: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        padding: 10,
        borderRadius: 20,
    },
    movementDetails: {
        flexDirection: 'row',
        marginBottom: 5,
    },
    conditioningPlaceholder: {
        padding: 20,
    },
    blockContainer: {
        marginBottom: 10,
    },
    movementRow: {
        marginVertical: 5,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    rowText: {
        flexDirection: 'row',
        paddingLeft: 10,
        alignItems: 'center',
        justifyContent: 'flex-start',
        width: '80%',
    },
    movementLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '85%',
    },
    summaryDetail: {
        marginBottom: 10,
        fontSize: 16,
    },
    sectionContainer: {
        padding: 20,
    },
});
