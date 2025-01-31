import React, { useState, useEffect, useRef } from "react";
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    StyleSheet,
} from "react-native";
import { Video } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import { Colours } from "../../components/styles";

const MobilityTimerModal = ({ movements, isVisible, onClose, workout_name }) => {
    const [currentMovementIndex, setCurrentMovementIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(movements[currentMovementIndex]?.duration * 60 || 60);
    const [totalTimeLeft, setTotalTimeLeft] = useState(
        movements.reduce((total, movement) => total + (movement.duration * 60 || 0), 0)
    );
    const [isRunning, setIsRunning] = useState(false);
    const [isVideoPlaying, setIsVideoPlaying] = useState(false);
    const videoRef = useRef(null);

    useEffect(() => {
        let interval;
        if (isRunning && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
                setTotalTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            handleNextMovement();
        }
        return () => clearInterval(interval);
    }, [isRunning, timeLeft]);

    useEffect(() => {
        setTimeLeft(movements[currentMovementIndex]?.duration * 60 || 60);
        setIsVideoPlaying(false); // ✅ Video should not auto-play when movement changes

        if (!isRunning) {
            videoRef.current?.stopAsync(); // ✅ Ensure video resets when navigating
        }
    }, [currentMovementIndex]);

    const handleNextMovement = () => {
        if (currentMovementIndex < movements.length - 1) {
            setTotalTimeLeft(prev => prev - (movements[currentMovementIndex]?.duration * 60 || 0));
            setCurrentMovementIndex(prev => prev + 1);
            setTimeLeft(movements[currentMovementIndex + 1]?.duration * 60 || 60);
    
            // ✅ Keep video in sync with the timer
            if (isRunning) {
                videoRef.current?.stopAsync().then(() => videoRef.current?.playAsync());
            } else {
                videoRef.current?.stopAsync();
            }
        } else {
            handleClose(); // ✅ Reset everything when closing
        }
    };
    
    const handlePreviousMovement = () => {
        if (currentMovementIndex > 0) {
            setTotalTimeLeft(prev => prev + (movements[currentMovementIndex - 1]?.duration * 60 || 0));
            setCurrentMovementIndex(prev => prev - 1);
            setTimeLeft(movements[currentMovementIndex - 1]?.duration * 60 || 60);
    
            // ✅ Keep video in sync with the timer
            if (isRunning) {
                videoRef.current?.stopAsync().then(() => videoRef.current?.playAsync());
            } else {
                videoRef.current?.stopAsync();
            }
        }
    };
    
    const togglePlayPause = () => {
        setIsRunning(!isRunning);
        setIsVideoPlaying(!isVideoPlaying);
    
        if (!isVideoPlaying) {
            videoRef.current?.playAsync();
        } else {
            videoRef.current?.pauseAsync();
        }
    };
    

    const handleClose = () => {
        // ✅ Reset everything when closing
        setCurrentMovementIndex(0);
        setTimeLeft(movements[0]?.duration * 60 || 60);
        setTotalTimeLeft(
            movements.reduce((total, movement) => total + (movement.duration * 60 || 0), 0)
        );
        setIsRunning(false);
        setIsVideoPlaying(false);
        videoRef.current?.stopAsync();
        onClose();
    };

    return (
        <Modal visible={isVisible} animationType="slide" transparent={false} onRequestClose={handleClose}>
            <View style={styles.fullVideoModalContainer}>

                {/* Header with Workout Name and Close Button */}
                <View style={styles.headerContainer}>
                    <Text style={styles.workoutTitle}>{workout_name}</Text>
                    <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                        <Ionicons name="close" size={25} color="white" />
                    </TouchableOpacity>
                </View>

                {/* Video Section */}
                {movements[currentMovementIndex]?.movements.portrait_video_url ? (
                    <Video
                        ref={videoRef}
                        source={{ uri: movements[currentMovementIndex]?.movements.landscape_video_url }}
                        style={styles.video}
                        resizeMode="contain"
                        shouldPlay={false} // ✅ Ensure it doesn't auto-play
                        isLooping
                        onError={(error) => console.error("Video Error:", error)}
                    />
                ) : (
                    <Text style={styles.noVideoText}>Video coming soon</Text>
                )}

                {/* Movement Name */}
                <Text style={styles.movementName}>
                    {movements[currentMovementIndex]?.movements.exercise}
                </Text>

                <View style={styles.timerBlock}>

                    {/* Timer Display */}
                    <Text style={styles.timer}>
                        {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
                    </Text>
                    <Text style={styles.totalTimeText}>
                        Total Time Left: {Math.floor(totalTimeLeft / 60)}:{String(totalTimeLeft % 60).padStart(2, "0")}
                    </Text>

                    {/* Timer Controls */}
                    <View style={styles.controls}>

                        {/* <TouchableOpacity onPress={handleRestartTimer} style={styles.controlButton}>
                        <Ionicons name="refresh-circle" size={50} color="white" />
                    </TouchableOpacity> */}
                    </View>

                    {/* Navigation Buttons */}
                    <View style={styles.navigation}>
                        {currentMovementIndex > 0 && (
                            <TouchableOpacity onPress={handlePreviousMovement} style={styles.controlButton}>
                                <Ionicons name="arrow-back-circle" size={50} color="white" />
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity onPress={togglePlayPause} style={styles.controlButton}>
                            <Ionicons name={isRunning ? "pause-circle" : "play-circle"} size={50} color="white" />
                        </TouchableOpacity>
                        {currentMovementIndex < movements.length - 1 ? (
                            <TouchableOpacity onPress={handleNextMovement} style={styles.controlButton}>
                                <Ionicons name="arrow-forward-circle" size={50} color="white" />
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity onPress={handleClose} style={styles.controlButton}>
                                <Ionicons name="stop-circle" size={50} color="red" />
                            </TouchableOpacity>
                        )}
                    </View>
                    {/* Coming Next Movement */}
                    <View style={styles.comingNextContainer}>
                        {currentMovementIndex < movements.length - 1 ? (
                            <><Text style={styles.comingNextLabel}>Coming Next: </Text>
                            <Text style={styles.comingNextText}>
                                {movements[currentMovementIndex + 1]?.movements.exercise}
                            </Text></>
                        ) : (
                            <Text style={styles.comingNextText}>This is the final movement</Text>
                        )}
                    </View>

                </View>

            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    fullVideoModalContainer: {
        flex: 1,
        backgroundColor: Colours.primaryHeader,
        alignItems: "center",
    },
    headerContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        paddingHorizontal: 20,
        marginTop: 70,
    },
    workoutTitle: {
        flex: 1,
        textAlign: "center",
        fontSize: 18,
        fontWeight: "500",
        color: "white",
    },
    closeButton: {
        position: "absolute",
        right: 20,
    },
    video: {
        width: "100%",
        height: "30%",
    },
    noVideoText: {
        color: "white",
        fontSize: 18,
        marginVertical: 10,
    },
    movementName: {
        fontSize: 16,
        fontWeight: "500",
        color: "white",
        marginBottom: 10,
    },
    timerBlock: {
        flexDirection: 'column',
        alignItems: 'center',
        padding: 70,
    },
    totalTimeText: {
        fontSize: 14,
        fontWeight: "500",
        color: "white",
        marginBottom: 10,
    },
    timer: {
        fontSize: 100,
        fontWeight: "bold",
        color: "white",
        // marginVertical: 20,
    },
    controls: {
        flexDirection: "row",
        gap: 20,
    },
    controlButton: {
        padding: 10,
    },
    navigation: {
        flexDirection: "row",
        gap: 20,
        marginTop: 20,
    },
    comingNextContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 40,
    },
    comingNextLabel: {
        fontSize: 14,
        fontWeight: "500",
        color: "white",
    },
    comingNextText: {
        fontSize: 14,
        fontWeight: "500",
        color: "white",
    },
});

export default MobilityTimerModal;
