import React, { useState } from "react";
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
    Keyboard,
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
import TimerVideoMobilityModal from '../../../screens/modalScreens/TimerVideoMobilityModal';
import RPEInfoModal from '../../modalScreens/InfoModals/RPEInfo';

const SCREEN_WIDTH = Dimensions.get("window").width;
const ITEM_WIDTH = SCREEN_WIDTH - 85;

export default function MobilityWorkout({ route, navigation }) {
    const { workout, completeWorkouts } = route.params; // Receive the workout data as a parameter
    const [activeTab, setActiveTab] = useState("Summary"); // Active tab
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [currentVideoIndex, setCurrentVideoIndex] = useState(0); // Track current video for FlatList
    const mobilitySession = workout.mobility_sessions?.[0]; // Access the first mobility session
    const movements = mobilitySession?.mobility_details || []; // Get mobility movements
    const [currentIndex, setCurrentIndex] = useState(0); // Current index for FlatList
    const [isModalVisible, setIsModalVisible] = useState(false); // Modal visibility
    const [logData, setLogData] = useState({
        session_comments: workout.running_sessions[0]?.comments || "", // Default to an empty string
        session_rpe: workout.running_sessions[0]?.rpe || 0, // Default to 0
    })
    const [isTimerModalVisible, setIsTimerModalVisible] = useState(false);
    const [rpeModalVisible, setRpeModalVisible] = useState(false);


    const updateMobilityWorkout = async () => {
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
                `${ENV.API_URL}/api/saved_mobility/complete-workout/${workoutId}/`,
                payload,
                {
                    params: { user_id: userId },
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );

            if (response.status === 200) {
                console.log("Mobility workout updated successfully:", response.data);
                alert("Mobility workout updated successfully!");
            } else {
                console.error("Unexpected response:", response);
                alert("There was an issue updating the workout. Please try again.");
            }
        } catch (error) {
            console.error("Error updating mobility workout:", error.message || error.response?.data);
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
                        <TouchableOpacity
                            style={styles.startTimerButton}
                            onPress={() => setIsTimerModalVisible(true)}
                        >
                            <Ionicons name="timer-outline" size={30} color="black" />
                        </TouchableOpacity>
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
                                data={movements}
                                horizontal
                                // pagingEnabled
                                snapToInterval={ITEM_WIDTH}     // So each swipe snaps to the item width
                                decelerationRate="fast"         // Usually helps snapping feel smooth
                                showsHorizontalScrollIndicator={false}
                                keyExtractor={(item, index) => index.toString()}
                                renderItem={({ item }) => (
                                    // Each item is ITEM_WIDTH wide
                                    <View style={{ width: ITEM_WIDTH, height: 200 }}>
                                        <TouchableOpacity
                                            style={styles.thumbnailContainer}
                                            onPress={() => {
                                                setSelectedVideo(item.movements?.portrait_video_url);
                                                setIsModalVisible(true);
                                            }}
                                        >
                                            <Image
                                                source={{ uri: item.movements?.landscape_thumbnail }}
                                                style={styles.thumbnailImage}
                                                resizeMode="cover"
                                            />
                                            <View style={styles.playIconOverlay}>
                                                <Ionicons name="play-circle" size={48} color="white" />
                                            </View>
                                        </TouchableOpacity>
                                    </View>
                                )}
                                onMomentumScrollEnd={(e) => {
                                    const offsetX = e.nativeEvent.contentOffset.x;
                                    // index = how many item-widths we’ve scrolled
                                    const index = Math.round(offsetX / ITEM_WIDTH);
                                    setCurrentIndex(index);
                                }}
                            />
                            {/* Carousel Dots */}
                            <View style={styles.carouselContainer}>
                                {movements.map((_, index) => (
                                    <View
                                        key={index}
                                        style={[
                                            styles.carouselDot,
                                            index === currentIndex && styles.activeDot,
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

                            <View style={styles.movementDetails}>

                                <Text style={styles.summaryMessage}>
                                    {workout.mobility_sessions.length > 0 && workout.mobility_sessions[0].mobility_details.length > 0
                                        ? `Work through these ${workout.mobility_sessions[0].mobility_details.length} movements, spending ${workout.mobility_sessions[0].mobility_details[0].duration} minute${workout.mobility_sessions[0].mobility_details[0].duration > 1 ? 's' : ''} on each.`
                                        : "No mobility session details available."}
                                </Text>

                                <Text style={styles.subMessage}>Exercises</Text>

                                {/* Movement Details */}
                                {movements.map((movement, index) => (
                                    <View key={index} style={styles.movementRow}>
                                        <Text style={styles.movementName}>{movement.movements?.exercise}</Text>
                                        {/* <Text style={styles.movementDetail}>
                                        {movement.movements?.primary_body_part}
                                    </Text> */}
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {activeTab === "Log" && (
                        <KeyboardAvoidingView
                            style={{ flex: 1 }}
                            behavior={Platform.OS === "ios" ? "padding" : null}
                        >

                            {/* <ScrollView style={styles.tabContent} keyboardShouldPersistTaps="handled"> */}

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
                                    placeholder="Really nice stretch..."
                                />
                            </View>

                            {/* RPE Block for Running Session */}
                            <View style={styles.commentBlock}>
                                <View style={styles.RPEBlock}>
                                    <Text style={styles.exerciseLabel}>Session RPE: {logData.session_rpe ?? 0}</Text>
                                    <Ionicons name="information-circle-outline" size={24} color="black" style={{ marginBottom: 10 }} onPress={() => setRpeModalVisible(true)} />
                                </View>
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
                            {/* </ScrollView> */}
                        </KeyboardAvoidingView>
                    )}

                    {activeTab === 'History' && (
                        <View style={styles.detailsContent}>
                            {/* Iterate through completeWorkouts */}
                            {completeWorkouts && completeWorkouts.length > 0 ? (
                                completeWorkouts.map((workout, workoutIndex) => (
                                    <View key={workoutIndex} style={styles.historyItem}>
                                        {/* Display the workout's date */}
                                        <View style={styles.dateBox}>
                                            <Text style={styles.historyDate}>
                                                {new Date(workout.completed_date).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                })}
                                            </Text>
                                            <View style={styles.divider}></View>
                                        </View>

                                        {/* Display RPE and Comments */}
                                        <View style={styles.detailWrapper}>
                                            {workout.mobility_sessions && workout.mobility_sessions.length > 0 ? (
                                                workout.mobility_sessions.map((session, sessionIndex) => (
                                                    <View key={sessionIndex} style={styles.sessionBlock}>
                                                        <View style={styles.commentHistoryBlock}>
                                                            <Text style={styles.commentsHistoryTitle}>Workout comments</Text>
                                                            {session.comments ? (
                                                                <Text style={styles.rpeText}>{session.comments}</Text>
                                                            ) : (
                                                                <Text style={styles.rpeText}>No comments available</Text>
                                                            )}
                                                        </View>
                                                        {session.rpe && (
                                                            <View style={styles.scoreContainer}>
                                                                <RPEGauge score={session.rpe} />
                                                            </View>
                                                        )}
                                                    </View>
                                                ))
                                            ) : (
                                                <Text style={styles.noSessionText}>No mobility sessions available</Text>
                                            )}
                                        </View>
                                    </View>
                                ))
                            ) : (
                                <Text style={styles.noHistoryText}>No completed mobility workouts available</Text>
                            )}
                        </View>
                    )}

                </ScrollView>
                {/* Navigation Buttons */}
                <View style={styles.navigationContainer}>
                    <TouchableOpacity style={styles.finishButton} onPress={() => updateMobilityWorkout()}>
                        <Text style={styles.finishButtonText}>Finish Workout</Text>
                    </TouchableOpacity>
                </View>
                <TimerVideoMobilityModal
                    movements={movements}
                    isVisible={isTimerModalVisible}
                    workout_name={workout.name}
                    onClose={() => setIsTimerModalVisible(false)}
                />
                <RPEInfoModal
                    visible={rpeModalVisible}
                    onClose={() => setRpeModalVisible(false)}
                />
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
    RPEBlock: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
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
        position: 'relative', // ensures the child overlay can be absolutely positioned
        // margin: 8,
        width: SCREEN_WIDTH - 85, // Ensures each item spans the full width of the screen
        height: 200,
    },
    thumbnailImage: {
        width: '100%',
        // margin: 12,
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
