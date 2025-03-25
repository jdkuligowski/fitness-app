import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet
} from "react-native";
import { Video } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import { useKeepAwake } from "expo-keep-awake";
import { Colours } from "../../components/styles";
import * as Speech from "expo-speech";

const TimerVideoHiitModal = ({
  hiitMovements = [],
  isVisible,
  onClose,
  workoutName,
  workoutType // e.g. "EMOM", "AMRAP", etc.
}) => {
  useKeepAwake(); // Prevent screen from sleeping

  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(hiitMovements[0]?.duration ?? 60);
  const [isRunning, setIsRunning] = useState(false);

  const videoRef = useRef(null);

  useEffect(() => {
    if (isVisible && hiitMovements.length > 0) {
      const movementName = hiitMovements[currentIndex]?.movements?.exercise ?? "";
      if (/rest/i.test(movementName)) {
        Speech.speak("Rest for 60 seconds", { language: "en-GB" });
      } else {
        Speech.speak(`Start 60 seconds of ${movementName}`, { language: "en-GB" });
      }
    }
  }, [isVisible, currentIndex, hiitMovements]);

  // Timer logic
  useEffect(() => {
    let interval;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          const newVal = prev - 1;

          if (
            workoutType?.toUpperCase() === "EMOM" &&
            newVal === 10 &&
            currentIndex < hiitMovements.length - 1
          ) {
            const nextMovement =
              hiitMovements[currentIndex + 1]?.movements?.exercise || "rest";
            Speech.speak(`10 seconds until ${nextMovement}`, {
              language: "en-GB",
            });
          }

          if (newVal === 0) {
            handleNext();
          }
          return newVal;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, currentIndex, workoutType, hiitMovements]);

  // On currentIndex change, reset time + set up the video
  useEffect(() => {
    setTimeLeft(hiitMovements[currentIndex]?.duration ?? 60);

    // Stop old video
    videoRef.current?.stopAsync().then(() => {
      // If we are running, play the new one
      if (isRunning) {
        videoRef.current?.playAsync().catch((err) =>
          console.warn("Video play error:", err)
        );
      }
    });
  }, [currentIndex, hiitMovements, isRunning]);

  const handleNext = () => {
    if (currentIndex < hiitMovements.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      handleClose();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const togglePlayPause = async () => {
    const newIsRunning = !isRunning;
    setIsRunning(newIsRunning);

    if (newIsRunning) {
      await videoRef.current?.playAsync().catch((err) =>
        console.warn("Error playing video:", err)
      );
    } else {
      await videoRef.current?.pauseAsync().catch((err) =>
        console.warn("Error pausing video:", err)
      );
    }
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const resetModal = () => {
    setCurrentIndex(0);
    setTimeLeft(hiitMovements[0]?.duration ?? 60);
    setIsRunning(false);
    videoRef.current?.stopAsync();
    Speech.stop();
  };

  if (!hiitMovements.length) {
    return (
      <Modal visible={isVisible} transparent={true} onRequestClose={handleClose}>
        <View style={styles.noDataContainer}>
          <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
            <Ionicons name="close" size={25} color="white" />
          </TouchableOpacity>
          <Text style={{ color: "#fff" }}>No movements found.</Text>
        </View>
      </Modal>
    );
  }

  const currentMovement = hiitMovements[currentIndex];

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={false}
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <Text style={styles.workoutTitle}>
            {workoutName ?? "HIIT Workout"}
          </Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
            <Ionicons name="close" size={25} color="white" />
          </TouchableOpacity>
        </View>

        {/* Video Area - 30% height reserved */}
        <View style={styles.videoArea}>
          {currentMovement?.movements?.landscape_video_url ? (
            <Video
              ref={videoRef}
              source={{ uri: currentMovement.movements.landscape_video_url }}
              style={styles.video}
              resizeMode="contain"
              isLooping
              onError={(err) => console.log("Video error:", err)}
            />
          ) : (
            /* Same 30% area, just show text if no video */
            <View style={styles.videoPlaceholder}>
              <Text style={styles.noVideoText}>No video available</Text>
            </View>
          )}
        </View>

        {/* Movement Name */}
        <Text style={styles.movementName}>
          {currentMovement?.movements?.exercise || "Movement"}
        </Text>

        {/* Timer + Controls */}
        <View style={styles.timerBlock}>
          <Text style={styles.timerText}>
            {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
          </Text>

          <View style={styles.navigation}>
            {currentIndex > 0 && (
              <TouchableOpacity onPress={handlePrevious} style={styles.controlButton}>
                <Ionicons name="arrow-back-circle" size={50} color="white" />
              </TouchableOpacity>
            )}

            <TouchableOpacity onPress={togglePlayPause} style={styles.controlButton}>
              <Ionicons
                name={isRunning ? "pause-circle" : "play-circle"}
                size={50}
                color="white"
              />
            </TouchableOpacity>

            {currentIndex < hiitMovements.length - 1 ? (
              <TouchableOpacity onPress={handleNext} style={styles.controlButton}>
                <Ionicons name="arrow-forward-circle" size={50} color="white" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={handleClose} style={styles.controlButton}>
                <Ionicons name="stop-circle" size={50} color="red" />
              </TouchableOpacity>
            )}
          </View>

          {/* Coming Next Info */}
          {currentIndex < hiitMovements.length - 1 ? (
            <View style={styles.comingNextContainer}>
              <Text style={styles.comingNextLabel}>Next: </Text>
              <Text style={styles.comingNextText}>
                {hiitMovements[currentIndex + 1]?.movements?.exercise || "Movement"}
              </Text>
            </View>
          ) : (
            <Text style={styles.comingNextText}>
              Last movement in this workout
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );
};

/* Styles */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colours.primaryHeader,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 20,
    marginTop: 70,
    marginBottom: 10,
    justifyContent: "center",
  },
  workoutTitle: {
    fontSize: 18,
    fontWeight: "500",
    color: "white",
  },
  closeBtn: {
    position: "absolute",
    right: 20,
  },

  /* Reserve 30% screen height for the video region,
     whether or not a video is available. */
  videoArea: {
    width: "100%",
    height: "30%",
    justifyContent: "center",
    alignItems: "center",
  },
  video: {
    width: "100%",
    height: "100%",
  },
  videoPlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },

  noVideoText: {
    fontSize: 16,
    color: "#fff",
  },
  movementName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
    marginVertical: 10,
  },
  timerBlock: {
    alignItems: "center",
    marginTop: 30,
    paddingHorizontal: 20,
  },
  timerText: {
    fontSize: 80,
    fontWeight: "bold",
    color: "white",
  },
  navigation: {
    flexDirection: "row",
    gap: 20,
    marginTop: 20,
  },
  controlButton: {
    padding: 10,
  },
  comingNextContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 30,
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
  noDataContainer: {
    flex: 1,
    backgroundColor: Colours.primaryHeader,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default TimerVideoHiitModal;
