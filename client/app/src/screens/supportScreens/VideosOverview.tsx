import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    FlatList,
    Image,
    Modal,
    ActivityIndicator,
    Dimensions,
    SafeAreaView,
    StatusBar,
    KeyboardAvoidingView,
    TouchableWithoutFeedback,
    Keyboard,
    Platform
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Video } from "expo-av";
import { useWorkout } from '../../context/WorkoutContext'; // Importing the context
import { useLoader } from '../../context/LoaderContext';
import { Colours } from "../../components/styles";
import VideoModal from "../modalScreens/VideoModal";

const SCREEN_WIDTH = Dimensions.get("window").width;

export default function VideoLibraryScreen({ navigation }) {
    const { workoutData, fetchWorkoutData } = useWorkout(); // Fetch workout data from context
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [filteredVideos, setFilteredVideos] = useState([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedVideo, setSelectedVideo] = useState(null);
    const { setIsBouncerLoading, isBouncerLoading } = useLoader(); // Access loader functions
    const [selectedMovement, setSelectedMovement] = useState(null);

    // Categories for filtering
    const categories = ["Lower body", "Upper body", "Core"];

    useEffect(() => {
        // Fetch workout data on component mount
        // setIsBouncerLoading(true);
        fetchWorkoutData()
    }, []);

    useEffect(() => {
        // Filter videos whenever relevant states change
        filterVideos();
    }, [workoutData, searchTerm, selectedCategory]);

    const filterVideos = () => {
        if (!workoutData || workoutData.length === 0) return;

        // Filter out videos without `landscape_thumbnail` and `portrait_video_url`
        let filtered = workoutData.filter(
            (movement) =>
                movement.landscape_thumbnail && movement.portrait_video_url
        );

        // Apply search term filter
        if (searchTerm) {
            filtered = filtered.filter((movement) =>
                movement.exercise.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Apply category filter
        if (selectedCategory) {
            filtered = filtered.filter(
                (movement) =>
                    movement.movement_type &&
                    movement.movement_type.includes(selectedCategory)
            );
        }

        // Sort alphabetically by `movement`
        filtered.sort((a, b) =>
            a.exercise.localeCompare(b.exercise, undefined, { sensitivity: "base" })
        );

        setFilteredVideos(filtered);
    };

    const handleSearchChange = (text) => {
        setSearchTerm(text);
    };

    const handleCategorySelect = (category) => {
        setSelectedCategory(category === selectedCategory ? null : category);
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor="#F6F3DC" />
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <KeyboardAvoidingView
                    style={styles.chatPage}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={10} // Adjust for your header height
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => navigation.goBack()}
                        >
                            <Ionicons name="arrow-back" size={24} color="black" />
                        </TouchableOpacity>
                        <Text style={styles.headingText}>Videos</Text>
                    </View>
                    <View style={styles.container}>

                        {/* Search Bar */}
                        <View style={styles.searchBox}>
                            <View style={styles.homeSearchIcon}>
                                <Ionicons name="search" size={20} color="#FFFFFF" />
                            </View>
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search videos"
                                value={searchTerm}
                                onChangeText={handleSearchChange}
                                placeholderTextColor="#B0B0B0"
                            />
                        </View>
                        <View style={styles.videosList}>
                            <FlatList
                                data={filteredVideos}
                                keyExtractor={(item) => item.id.toString()}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={styles.videoCard}
                                        onPress={() => {
                                            setSelectedMovement(item);
                                        }}
                                    >
                                        <Image
                                            source={{ uri: item.landscape_thumbnail }}
                                            style={styles.videoThumbnail}
                                        />
                                        <View style={styles.videoInfo}>
                                            <Text style={styles.videoTitle}>{item.exercise}</Text>
                    
                                        </View>
                                    </TouchableOpacity>
                                )}
                                ListEmptyComponent={
                                    <Text style={styles.noVideosText}>No videos found</Text>
                                }
                            />
                        </View>

                        {selectedMovement && (
                            <VideoModal
                                visible={!!selectedMovement}
                                movement={selectedMovement}
                                onClose={() => setSelectedMovement(null)}
                            />
                        )}
                    </View>
                </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Colours.primaryBackground,
    },
    chatPage: {
        flexGrow: 1,
        backgroundColor: Colours.primaryBackground,
    },
    header: {
        padding: 20,
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
    headingText: {
        fontSize: 20,
        fontWeight: '600',
        color: 'black',
        marginLeft: 10,
    },
    // searchContainer: {
    //     flexDirection: "row",
    //     alignItems: "center",
    //     backgroundColor: "#fff",
    //     borderRadius: 8,
    //     marginHorizontal: 16,
    //     marginVertical: 10,
    //     paddingHorizontal: 10,
    //     shadowColor: "#000",
    //     shadowOpacity: 0.1,
    //     shadowOffset: { width: 0, height: 2 },
    //     shadowRadius: 4,
    // },
    searchIcon: {
        marginRight: 10,
    },
    searchBox: {
        // marginTop: -30,
        backgroundColor: '#FFFFFF', // Background for the overlay box
        borderRadius: 20,
        marginHorizontal: 20,
        padding: 10,
        borderTopWidth: 1,
        borderLeftWidth: 1,
        borderRightWidth: 5,
        borderBottomWidth: 5,
        flexDirection: 'row', // Align icon and input horizontally
        alignItems: 'center', // Center vertically
        marginBottom: 20,
    },
    homeSearchIcon: {
        backgroundColor: '#BDD1FF', // Background color for the icon
        padding: 10,
        borderRadius: 10, // Rounded corners
        marginRight: 10, // Space between icon and input
        alignItems: 'center',
        justifyContent: 'center',
    },
    searchInput: {
        flex: 1, // Allow the input to take the remaining space
        padding: 10,
        fontSize: 16,
    },
    categoriesContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginHorizontal: 16,
        marginBottom: 10,
    },
    categoryButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: "#F3F3F3",
        borderRadius: 20,
    },
    activeCategory: {
        backgroundColor: "#E5DFFF",
    },
    categoryText: {
        fontSize: 14,
        color: "#333",
    },
    activeCategoryText: {
        color: "#4B0082",
    },
    videosList: {
        marginHorizontal: 5,
    },
    videoCard: {
        flexDirection: "column",
        backgroundColor: "white",
        marginHorizontal: 16,
        marginBottom: 10,
        borderTopWidth: 1,
        borderLeftWidth: 1,
        borderRightWidth: 3,
        borderBottomWidth: 3,
        borderRadius: 15,
        paddingHorizontal: 15,
        paddingTop: 15,
        paddingBottom: 5,
        height: 250,
        // overflow: "hidden",
        // shadowColor: "#000",
        // shadowOpacity: 0.1,
        // shadowOffset: { width: 0, height: 2 },
        // shadowRadius: 4,
    },
    videoThumbnail: {
        width: '100%',
        height: 190,
        backgroundColor: "#ccc",
        borderRadius: 15,
    },
    videoInfo: {
        flex: 1,
        padding: 10,
        justifyContent: "space-between",
    },
    videoTitle: {
        fontSize: 12,
        fontWeight: "500",
    },
    videoDuration: {
        fontSize: 12,
        color: "#666",
    },
    noVideosText: {
        textAlign: "center",
        fontSize: 16,
        color: "#666",
        marginTop: 20,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: "black",
        justifyContent: "center",
        alignItems: "center",
    },
    fullScreenVideo: {
        width: SCREEN_WIDTH,
        height: SCREEN_WIDTH * (16 / 9), // Aspect ratio for video
    },
    closeButton: {
        position: "absolute",
        top: 40,
        right: 20,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        borderRadius: 20,
        padding: 10,
    },
    loader: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
});
