import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    SafeAreaView,
    TouchableOpacity,
    Dimensions,
    FlatList,
    Image,
    Modal,
    KeyboardAvoidingView,
    Platform,
    TextInput
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Video } from "expo-av";
import { Colours } from '@/app/src/components/styles';
import axios from 'axios';
import ENV from '../../../../../env'
import AsyncStorage from '@react-native-async-storage/async-storage';
import Slider from '@react-native-community/slider'
import RPEGauge from "@/app/src/components/RPEGauge";

const SCREEN_WIDTH = Dimensions.get("window").width;

export default function HiitWorkout({ route, navigation }) {
    const { workout, completeWorkouts } = route.params; // Receive workout data as a parameter
    const [activeTab, setActiveTab] = useState("Summary"); // Active tab
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [isModalVisible, setIsModalVisible] = useState(false); // Video modal visibility
    const [currentBlockIndex, setCurrentBlockIndex] = useState(0); // Track current HIIT block
    const hiitBlocks = workout.hiit_sessions?.[0]?.hiit_details || []; // HIIT blocks

    const [logData, setLogData] = useState({
        session_comments: workout.hiit_sessions[0]?.comments || "", // Default to an empty string
        session_rpe: workout.hiit_sessions[0]?.rpe || 0, // Default to 0
    });

    // useEffect(() => {
    //     console.log('Hiit workout loaded: ', JSON.stringify(workout, null, 2))
    // })

    const updateHiitWorkout = async () => {
        try {
            const userId = await AsyncStorage.getItem("userId");
            if (!userId) {
                throw new Error("User ID not found in storage.");
            }

            // Prepare the payload
            const payload = {
                rpe: logData.session_rpe || null, // Update RPE
                comments: logData.session_comments || null, // Update comments
            };

            const workoutId = workout.id;
            console.log("Payload being sent:", JSON.stringify(payload, null, 2));

            // Send the PUT request to complete the workout
            const response = await axios.put(
                `${ENV.API_URL}/api/saved_hiit/complete-workout/${workoutId}/`,
                payload,
                {
                    params: { user_id: userId },
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );

            if (response.status === 200) {
                console.log("HIIT workout updated successfully:", response.data);
                alert("HIIT workout updated successfully!");
            } else {
                console.error("Unexpected response:", response);
                alert("There was an issue updating the workout. Please try again.");
            }
        } catch (error) {
            console.error("Error updating HIIT workout:", error.message || error.response?.data);
            alert("Error updating workout. Please check your connection or try again later.");
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.scrollContainer}>
                {/* Header */}
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
                            <Text style={styles.headingText}>{workout?.name}</Text>
                            <View style={styles.workoutOverviewTime}>
                                <Ionicons name="time-outline" size={24} color="black" />
                                <Text style={styles.timeText}>{workout?.duration} mins</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Tabs */}
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

                {/* Tab Content */}
                <ScrollView style={styles.tabContent}>
                    {activeTab === "Summary" && (
                        <View style={styles.summaryContent}>
                            {/* Horizontal Video FlatList */}
                            <FlatList
                                data={hiitBlocks.flatMap(block => block.hiit_movements)} // Flatten all movements into a single list
                                horizontal
                                pagingEnabled
                                keyExtractor={(item, index) => index.toString()}
                                showsHorizontalScrollIndicator={false}
                                renderItem={({ item, index }) => (
                                    <TouchableOpacity
                                        style={[styles.thumbnailContainer]}
                                        onPress={() => {
                                            if (item.movements?.portrait_video_url) {
                                                setSelectedVideo(item.movements.portrait_video_url);
                                                setIsModalVisible(true);
                                            } else {
                                                alert("No video available for this movement.");
                                            }
                                        }}
                                    >
                                        <Image
                                            source={{ uri: item.movements?.landscape_thumbnail || "" }} // Use thumbnail if available
                                            style={styles.thumbnail}
                                            resizeMode="cover"
                                        />
                                    </TouchableOpacity>
                                )}
                                onMomentumScrollEnd={(e) => {
                                    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                                    setCurrentBlockIndex(index); // Update carousel indicator
                                }}
                            />

                            {/* Carousel Dots */}
                            <View style={styles.carouselContainer}>
                                {hiitBlocks.flatMap(block => block.hiit_movements).map((_, index) => (
                                    <View
                                        key={index}
                                        style={[
                                            styles.carouselDot,
                                            index === currentBlockIndex && styles.activeDot,
                                        ]}
                                    />
                                ))}
                            </View>

                            {/* Modal for Full-Screen Video */}
                            <Modal
                                animationType="slide"
                                transparent={false}
                                visible={isModalVisible}
                                onRequestClose={() => setIsModalVisible(false)}
                            >
                                <View style={styles.modalContainer}>
                                    {selectedVideo ? (
                                        <Video
                                            source={{ uri: selectedVideo }}
                                            style={styles.fullScreenVideo}
                                            resizeMode="contain"
                                            useNativeControls
                                            shouldPlay
                                            onError={(error) => console.error("Video Error:", error)}
                                        />
                                    ) : (
                                        <Text style={styles.noVideoText}>Video not available</Text>
                                    )}
                                    <TouchableOpacity
                                        style={styles.closeButton}
                                        onPress={() => setIsModalVisible(false)}
                                    >
                                        <Ionicons name="close" size={30} color="white" />
                                    </TouchableOpacity>
                                </View>
                            </Modal>
                            {/* HIIT Block Sections */}
                            <Text style={styles.sectionTitle}>{workout.hiit_sessions[0].workout_type} workout</Text>
                            <Text style={styles.summaryMessage}>{workout.hiit_sessions[0].structure}</Text>
                            {hiitBlocks.map((block, index) => (
                                <View key={index} style={styles.blockContainer}>
                                    {/* Movements inside the block */}
                                    {workout.hiit_sessions[0].workout_type === 'AMRAP' ?
                                        <Text style={styles.blockHeader}>{block.block_name}</Text>
                                        :
                                        <Text></Text>
                                    }
                                    {block.hiit_movements.map((movement, i) => (
                                        <View key={i} style={styles.movementRow}>
                                            <Text style={styles.movementName}>{movement.exercise_name}</Text>
                                        </View>
                                    ))}
                                </View>
                            ))}
                        </View>
                    )}



                    {activeTab === "Log" && (
                        <KeyboardAvoidingView
                            behavior={Platform.OS === "ios" ? "padding" : null}
                        >
                            <View style={styles.commentBlock}>
                                <Text style={styles.exerciseLabel}>Session Comments</Text>
                                <TextInput
                                    style={styles.commentInput}
                                    value={logData.session_comments || ''}
                                    onChangeText={(value) => setLogData({ ...logData, session_comments: value })}
                                    placeholder="How was this session?"
                                />
                            </View>

                            <View style={styles.commentBlock}>
                                <Text style={styles.exerciseLabel}>Session RPE: {logData.session_rpe ?? 0}</Text>
                                <Slider
                                    style={styles.slider}
                                    minimumValue={0}
                                    maximumValue={10}
                                    step={1}
                                    value={logData.session_rpe || 0}
                                    onValueChange={(value) => setLogData({ ...logData, session_rpe: value })}
                                />
                            </View>
                        </KeyboardAvoidingView>
                    )}

                    {activeTab === 'History' && (
                        <View>
                            {completeWorkouts.length > 0 ? (
                                completeWorkouts.map((prevWorkout, index) => (
                                    <View key={index} style={styles.historyItem}>
                                        <Text>{new Date(prevWorkout.completed_date).toLocaleDateString()}</Text>
                                        <Text>RPE: {prevWorkout.hiit_sessions[0]?.rpe || "N/A"}</Text>
                                        <Text>Comments: {prevWorkout.hiit_sessions[0]?.comments || "No comments"}</Text>
                                    </View>
                                ))
                            ) : (
                                <Text>No previous HIIT workouts found.</Text>
                            )}
                        </View>
                    )}
                </ScrollView>

                {/* Finish Workout Button */}
                <View style={styles.navigationContainer}>
                    <TouchableOpacity style={styles.finishButton} onPress={updateHiitWorkout}>
                        <Text style={styles.finishButtonText}>Finish Workout</Text>
                    </TouchableOpacity>
                </View>

                {/* Video Modal */}
                <Modal visible={isModalVisible} transparent={false}>
                    <View style={styles.modalContainer}>
                        {selectedVideo ? (
                            <Video source={{ uri: selectedVideo }} style={styles.fullScreenVideo} resizeMode="contain" useNativeControls shouldPlay />
                        ) : (
                            <Text>No video available</Text>
                        )}
                        <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                            <Ionicons name="close" size={30} color="white" />
                        </TouchableOpacity>
                    </View>
                </Modal>
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
        marginTop: 10,
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
    sectionContainer: {
        // marginBottom: 5,
        paddingTop: 0,
        // paddingBottom: 10,
        // borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.1)',
        borderRadius: 10,
    },
    movementDetails: {
        marginTop: 20,
    },
    summaryMessage: {
        marginBottom: 20,
    },
    subMessage: {
        marginBottom: 5,
        fontWeight: 600,
    },
    movementRow: {
        marginBottom: 5,
    },
    movementName: {
        // marginLeft: 20,
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
    blockContainer: {
        marginBottom: 10,
    },
    blockHeader: {
        fontSize: 16,
        fontWeight: 600, 
        marginBottom: 5,
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
    videoContainer: {
        height: 200,
        width: '100%',
        justifyContent: "center",
        alignItems: "center",
    },
    video: {
        width: '100%',
        height: "100%",
        borderRadius: 10,
    },
    thumbnailContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        height: 200, // Total height of the thumbnail area
        width: SCREEN_WIDTH - 85, // Ensures each item spans the full width of the screen
        // marginRight: 5, // Add padding for consistent spacing
    },
    thumbnail: {
        width: '100%', // Set width to 90% of the screen for some padding
        height: 200, // Keeps the intended height of the thumbnail
        borderRadius: 10,
    },
    carouselContainer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginTop: 10,
    },
    carouselDot: {
        width: 7,
        height: 7,
        borderRadius: 5,
        backgroundColor: "#DFD7F3",
        marginHorizontal: 5,
    },
    activeDot: {
        backgroundColor: "black",
    },
    modalContainer: {
        flex: 1,
        backgroundColor: "black",
        justifyContent: "center",
        alignItems: "center",
    },
    fullScreenVideo: {
        width: "100%",
        height: "80%",
    },
    closeButton: {
        position: "absolute",
        top: 50,
        right: 20,
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        padding: 10,
        borderRadius: 25,
    },
    commentsHistoryTitle: {
        fontSize: 14,
        fontWeight: 600,
        marginBottom: 5,
        color: '#D32F2F',
    },
    sessionBlock: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    commentHistoryBlock: {
        width: '70%',
    }
});
