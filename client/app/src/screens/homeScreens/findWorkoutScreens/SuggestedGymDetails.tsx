import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    Alert,
    Modal,
    Image,
    FlatList,
    Dimensions,
    ActivityIndicator
} from "react-native";
import { useNavigation } from '@react-navigation/native';
import Ionicons from "@expo/vector-icons/Ionicons";
import { Video } from "expo-av";
import axios from "axios";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colours } from '@/app/src/components/styles';
import { useWorkout } from "../../../context/WorkoutContext";
import SaveWorkoutModal from "../../modalScreens/SaveWorkoutModal";
import ENV from "../../../../../env";
import { useLoader } from '@/app/src/context/LoaderContext';

const SCREEN_WIDTH = Dimensions.get("window").width;

export default function SuggestedWorkoutSummary({ route }) {
    const navigation = useNavigation();
    const { workoutData, fetchWorkoutData } = useWorkout();

    const { workout } = route.params; // Get workout details from navigation
    const [selectedMovement, setSelectedMovement] = useState(null);
    const [currentWorkout, setCurrentWorkout] = useState(null);
    const { setIsBouncerLoading, isBouncerLoading } = useLoader();
    const [formattedWorkout, setFormattedWorkout] = useState(null); // ✅ Store pre-formatted workout

    console.log('Workout: ', workout);

    useEffect(() => {
        fetchWorkoutData(); // Ensure we have movement data loaded
    }, []);

    useEffect(() => {
        const prepareWorkout = async () => {
            const formatted = await formatWorkoutForModal(workout);
            setFormattedWorkout(formatted); // ✅ Store formatted workout in state
        };
        prepareWorkout();
    }, [workout]);

    // Helper function to find movement video
    const findMovementVideo = (exerciseName) => {
        console.log('exercise: ', exerciseName);
      
        const matchedMovement = workoutData.find(
          (movement) => 
            (movement.exercise || "").trim().toLowerCase() === (exerciseName || "").trim().toLowerCase()
        );
      
        return matchedMovement?.portrait_video_url || null;
      };
      
    // Group movements by section_name
    const groupedSections = workout.details.reduce((acc, movement) => {
        if (!acc[movement.section_name]) {
            acc[movement.section_name] = [];
        }
        acc[movement.section_name].push(movement);
        return acc;
    }, {});


    const showModalForWorkout = () => {
        if (!formattedWorkout) {
            console.error("❌ Error: formattedWorkout is not ready yet.");
            return;
        }
        setCurrentWorkout(formattedWorkout);
    };
    


    const closeModal = () => {
        setCurrentWorkout(null);
    };


    const saveAndStartWorkout = async (workoutPlan) => {
        setIsBouncerLoading(true);
        try {
            const userId = await AsyncStorage.getItem("userId");
            if (!userId) throw new Error("User ID not found in AsyncStorage.");

            const formattedDate = new Date().toISOString().split("T")[0];

            const payload = {
                user_id: userId,
                name: workoutPlan.workout_name,
                description: workoutPlan.description,
                duration: workoutPlan.duration || 45, // Default to 45 mins if no duration available
                complexity: 0,
                status: "Started",
                scheduled_date: formattedDate,
                activity_type: 'Gym',
                sections: Object.entries(groupedSections).map(([sectionName, movements], index) => ({
                    section_name: sectionName,
                    section_order: index + 1,
                    section_type: movements.length > 1 ? "superset" : "single",
                    movements: movements.map((movement, movementIndex) => ({
                        movement_name: movement.exercise,
                        movement_order: movementIndex + 1,
                    })),
                })),
            };

            console.log("Payload for save and start:", JSON.stringify(payload, null, 2));

            // 1️⃣ Save the workout
            const response = await axios.post(`${ENV.API_URL}/api/saved_workouts/save-workout/`, payload);
            console.log("Response from save:", response.data);

            const savedWorkoutId = response.data?.workout?.id;
            if (!savedWorkoutId) {
                throw new Error("Workout ID is undefined, check API response.");
            }

            console.log("New Workout ID ->", savedWorkoutId);

            // 2️⃣ Fetch workout details and movement history
            const workoutDetailsResponse = await axios.get(
                `${ENV.API_URL}/api/saved_workouts/get-single-workout/${savedWorkoutId}/`,
                { params: { user_id: userId } }
            );

            const { workout, movement_history } = workoutDetailsResponse.data;
            console.log("Workout details ->", workout);
            console.log("Movement history ->", movement_history);

            setIsBouncerLoading(false);

            // 3️⃣ Navigate directly to CompleteWorkout with all the data
            navigation.navigate("Training", {
                screen: "CompleteWorkout",
                params: {
                    workout: workout,
                    movementHistory: movement_history,
                },
            });
        } catch (error) {
            console.error("Error saving and starting workout:", error?.response?.data || error.message);
            Alert.alert("Error", "There was an error starting your workout. Please try again.");
            setIsBouncerLoading(false);
        }
    };



    const formatWorkoutForModal = async (workout) => {
        if (!workout?.details) {
          console.error("❌ Error: workout.details is undefined.");
          return null;
        }
      
        // 1) Group by section_name
        const groupedSections = workout.details.reduce((acc, movement) => {
          if (!acc[movement.section_name]) {
            acc[movement.section_name] = [];
          }
          acc[movement.section_name].push(movement);
          return acc;
        }, {});
      
        // 2) Build the array that matches the shape `saveWorkout` expects:
        const formattedSections = Object.entries(groupedSections).map(
          ([sectionName, movements]) => {
            return {
              partLabel: sectionName,                       // <— `saveWorkout` uses this
              sectionType: movements.length > 1 ? "superset" : "single",
              movements: movements.map((m) => ({
                // `saveWorkout` looks for `movement.name`
                name: m.exercise,
              })),
            };
          }
        );
      
        // 3) Attach a `.description` property to the array itself
        //    because `saveWorkout` does: `payload.description = workoutPlan.description`.
        formattedSections.description = workout.description || "Suggested strength workout";
      
        // 4) (Optional) If you want the final name to appear in `saveWorkout`,
        //    you can attach `.name` to the array too (if your code references it).
        //    But note that `saveWorkout` might override that with selectedWorkout anyway.
        formattedSections.name = workout.workout_name || "Untitled Workout";
      
        console.log("✅ Formatted for saveWorkout:", JSON.stringify(formattedSections, null, 2));
        return formattedSections; // An array of sections + appended description/name.
      };
      
    




    const renderWorkoutItem = ({ item }) => (
        <View style={styles.workoutCard}>
            <View style={styles.workoutOverview}>
                <View style={styles.overviewBox}>
                    <View style={styles.overviewHeader}>
                        <View>
                            <Text style={styles.workoutTitle}>{workout.workout_name}</Text>
                            <View style={styles.workoutOverviewTime}>
                                <Ionicons name="time-outline" size={24} color="black" />
                                <Text style={styles.timeText}>{workout.duration ? `${workout.duration} mins` : 'N/A'}</Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            style={styles.profileButton}
                            onPress={() => showModalForWorkout(item)}
                        >
                            <Ionicons name="heart-outline" color={"black"} size={20} />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.workoutSummaryArray}>
                        <Text style={styles.workoutSummaryButton}>Strength</Text>
                        <Text style={styles.workoutSummaryButton}>{workout.number_of_sections || 0} sections</Text>
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

            {/* <Text style={styles.workoutActivity}>Workout Sections</Text> */}

            <ScrollView style={styles.workoutList}>
                {/* ✅ Grouped sections rendering */}
                {Object.entries(groupedSections).map(([sectionName, movements], sectionIndex) => (
                    <View key={sectionIndex} style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>{sectionName}</Text> {/* ✅ Section title displayed once */}
                        {movements.map((movement, movementIndex) => {
                            const videoUrl = findMovementVideo(movement.exercise);
                            return (
                                <View key={movementIndex} style={styles.movementRow}>
                                    <View style={styles.movementLeft}>
                                        <Text style={styles.movementValue}>{`${movementIndex + 1}: `}</Text> {/* ✅ Reset numbering per section */}
                                        <Text style={styles.movementDetail}>{movement.exercise}</Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => {
                                            // if (videoUrl) {
                                            setSelectedMovement({ ...movement, video_url: videoUrl });
                                            // } else {
                                            //     Alert.alert("No video available", "This movement doesn't have an associated video.");
                                            // }
                                        }}
                                    >
                                        <Ionicons name="play-circle" size={24} color="black" />
                                    </TouchableOpacity>
                                </View>
                            );
                        })}
                    </View>
                ))}
            </ScrollView>

            <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.submitButton} onPress={() => saveAndStartWorkout(item)}>
                    <Text style={styles.submitButtonText}>Start Workout</Text>
                    <View style={styles.submitArrow}>
                        <Ionicons name="arrow-forward" size={24} color="black" />
                    </View>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.scrollContainer}>
                <View style={styles.header}>
                    <View style={styles.topSection}>
                        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                            <Ionicons name="arrow-back" size={24} color="black" />
                        </TouchableOpacity>
                        <Text style={styles.headingText}>Suggested Workout</Text>
                    </View>
                </View>

                <FlatList
                    data={[workout]}
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
                            onClose={closeModal} // Pass the close function
                            selectedTime={workout.duration} // Pass the selected time
                            selectedWorkout={currentWorkout.name} // Pass the selected workout name
                            workoutPlan={currentWorkout} // Pass the current workout plan
                            closeModal={closeModal} // Close function for modal
                            frequency={0}
                            modalRoute={'Discovery'}
                            workoutType="Gym"
                        />
                    </Modal>
                )}
                {selectedMovement && (
                    <Modal animationType="slide" transparent={false} visible={!!selectedMovement} onRequestClose={() => setSelectedMovement(null)}>
                        <View style={styles.modalContainer}>
                            {selectedMovement?.video_url ? (
                                <Video
                                    source={{ uri: selectedMovement.video_url }}
                                    style={styles.fullScreenVideo}
                                    resizeMode="contain"
                                    useNativeControls
                                    shouldPlay
                                    onError={(error) => console.error("Video Error:", error)}
                                />
                            ) : (
                                <Text style={styles.noVideoText}>Video coming soon</Text>
                            )}
                            <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedMovement(null)}>
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
        backgroundColor: '#F3F1FF',

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
        paddingLeft: 20,
        paddingRight: 20,
        height: 350,
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
    summaryMessage: {
        fontSize: 16,
        marginHorizontal: 20,
        marginTop: 5,
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
        width: '80%'
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