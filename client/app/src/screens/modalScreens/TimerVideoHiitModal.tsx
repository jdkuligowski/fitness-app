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
  hiitMovements = [],      // array of movements (each with a 'duration')
  isVisible,
  onClose,
  workoutName,
  workoutType,             // "EMOM", "AMRAP", etc.
  totalWorkoutDuration = 40 // e.g. 40 minutes
}) => {
  useKeepAwake(); // Keep screen awake

  // 1) Calculate cycle duration
  const cycleDuration = hiitMovements.reduce((sum, m) => sum + (m.duration || 60), 0);
  // e.g. if 10 movements each 1 min => cycleDuration = 10
  // 2) Calculate how many cycles
  const totalCycles = cycleDuration > 0
    ? Math.floor(totalWorkoutDuration / (cycleDuration / 60)) // careful with min->sec
    : 1;

  /**
   * Explanation for that math:
   * - `cycleDuration` is in seconds if each movement has `duration` in seconds.
   * - But your `totalWorkoutDuration` is presumably in minutes (40).
   * If each movement's `duration` is actually "60" meaning 60s, that sums to "60 * 10 = 600" seconds for the cycle.
   * => 600 seconds = 10 minutes. So we do: cycleDuration / 60 = 10 minutes. Then total / that => 40 / 10 = 4 cycles.
   *
   * If your durations are stored in minutes, adjust accordingly!
   */

  // States
  const [cycleIndex, setCycleIndex] = useState(0);     // which cycle we’re on
  const [currentIndex, setCurrentIndex] = useState(0); // which movement in the cycle
  const [timeLeft, setTimeLeft] = useState(
    hiitMovements[0]?.duration ?? 60
  );
  const [isRunning, setIsRunning] = useState(false);

  const videoRef = useRef(null);

  // ─────────────────────────────────────────────────────────────────────────────
  // Timer logic
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    let interval;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          const newVal = prev - 1;

          // EMOM "10 seconds until..." logic
          if (
            workoutType?.toUpperCase() === "EMOM" &&
            newVal === 10
          ) {
            // We figure out the next movement name
            const { nextCycleIndex, nextMovementIndex } = getNextIndexes();
            // If we haven't finished all cycles
            if (nextCycleIndex < totalCycles) {
              const nextMovementName =
                hiitMovements[nextMovementIndex]?.movements?.exercise || "rest";
              Speech.speak(`10 seconds until ${nextMovementName}`, {
                language: "en-GB",
              });
            }
          }

          if (newVal === 0) {
            handleNext(); // go to next movement or cycle
          }
          return newVal;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, cycleIndex, currentIndex, workoutType]);

  // ─────────────────────────────────────────────────────────────────────────────
  // On currentIndex/cycleIndex change, reset timeLeft, reset video
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    // figure out the movement for the currentIndex
    const movement = hiitMovements[currentIndex];
    const newDuration = movement?.duration ?? 60;
    setTimeLeft(newDuration);

    videoRef.current?.stopAsync().then(() => {
      if (isRunning) {
        videoRef.current?.playAsync().catch((err) =>
          console.warn("Video play error:", err)
        );
      }
    });
  }, [currentIndex, cycleIndex, isRunning]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────────────────────

  // Figure out the *next* movement and cycle we’d be on if we did "handleNext"
  const getNextIndexes = () => {
    let nextCycleIndex = cycleIndex;
    let nextMovementIndex = currentIndex + 1;

    // If we finished the movements in this cycle
    if (nextMovementIndex >= hiitMovements.length) {
      nextMovementIndex = 0;
      nextCycleIndex += 1;
    }
    return { nextCycleIndex, nextMovementIndex };
  };

  // Announce new movement (or rest)
  const announceMovement = (movementName) => {
    if (/rest/i.test(movementName)) {
      Speech.speak("Rest for 60 seconds", { language: "en-GB" });
    } else {
      Speech.speak(`Start 60 seconds of ${movementName}`, { language: "en-GB" });
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Movement Navigation
  // ─────────────────────────────────────────────────────────────────────────────
  const handleNext = () => {
    const { nextCycleIndex, nextMovementIndex } = getNextIndexes();

    // If we've done all cycles, end
    if (nextCycleIndex >= totalCycles) {
      handleClose();
      return;
    }

    // Otherwise, set new indexes
    setCycleIndex(nextCycleIndex);
    setCurrentIndex(nextMovementIndex);

    // Announce the next movement
    const nextMovementName =
      hiitMovements[nextMovementIndex]?.movements?.exercise || "rest";
    announceMovement(nextMovementName);
  };

  const handlePrevious = () => {
    // If we’re at the start of a cycle and not on the first cycle,
    // we jump back to the end of the previous cycle
    if (currentIndex === 0 && cycleIndex > 0) {
      // Go to the last movement of the previous cycle
      setCycleIndex(cycleIndex - 1);
      setCurrentIndex(hiitMovements.length - 1);
    } else if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
    // We do not handle going before the start of the entire workout
  };

  // This controls BOTH the timer and the initial movement announcement (if needed)
  const togglePlayPause = async () => {
    const newIsRunning = !isRunning;
    setIsRunning(newIsRunning);

    if (newIsRunning) {
      // If we’re about to “start” and we’re EXACTLY at the beginning of a brand new exercise,
      // we announce the movement now (only if we haven’t started it).
      // That is, if timeLeft is at the movement’s full duration.
      // e.g. if hiitMovements[currentIndex] is 60 but timeLeft is 60 => we haven't run it yet

      const movement = hiitMovements[currentIndex];
      // If timeLeft matches movement.duration exactly, we haven't played it yet
      if (timeLeft === (movement?.duration ?? 60)) {
        const movementName = movement?.movements?.exercise || "Movement";
        announceMovement(movementName);
      }
      // Play the video
      await videoRef.current?.playAsync().catch((err) =>
        console.warn("Error playing video:", err)
      );
    } else {
      // Pause the video
      await videoRef.current?.pauseAsync().catch((err) =>
        console.warn("Error pausing video:", err)
      );
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Closing
  // ─────────────────────────────────────────────────────────────────────────────
  const handleClose = () => {
    resetModal();
    onClose();
  };

  const resetModal = () => {
    setCycleIndex(0);
    setCurrentIndex(0);
    setTimeLeft(hiitMovements[0]?.duration ?? 60);
    setIsRunning(false);
    videoRef.current?.stopAsync();
    Speech.stop();
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // If no data
  // ─────────────────────────────────────────────────────────────────────────────
  if (!hiitMovements.length) {
    return (
      <Modal
        visible={isVisible}
        transparent={true}
        onRequestClose={handleClose}
      >
        <View style={styles.noDataContainer}>
          <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
            <Ionicons name="close" size={25} color="white" />
          </TouchableOpacity>
          <Text style={{ color: "#fff" }}>No movements found.</Text>
        </View>
      </Modal>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Rendering
  // ─────────────────────────────────────────────────────────────────────────────

  const currentMovement = hiitMovements[currentIndex];
  const movementName = currentMovement?.movements?.exercise || "Movement";

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
          <Text style={styles.workoutTitle}>{workoutName || "HIIT Workout"}</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
            <Ionicons name="close" size={25} color="white" />
          </TouchableOpacity>
        </View>

        {/* Show current cycle + total cycles if you want */}
        <Text style={styles.cycleLabel}>
          Round {cycleIndex + 1} of {totalCycles}
        </Text>

        {/* Video area (30% height) */}
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
            <View style={styles.videoPlaceholder}>
              <Text style={styles.noVideoText}>No video available</Text>
            </View>
          )}
        </View>

        {/* Movement Name */}
        <Text style={styles.movementName}>{movementName}</Text>

        {/* Timer & Controls */}
        <View style={styles.timerBlock}>
          <Text style={styles.timerText}>
            {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
          </Text>

          <View style={styles.navigation}>
            {/* PREV */}
            {(cycleIndex > 0 || currentIndex > 0) && (
              <TouchableOpacity onPress={handlePrevious} style={styles.controlButton}>
                <Ionicons name="arrow-back-circle" size={50} color="white" />
              </TouchableOpacity>
            )}

            {/* PLAY/PAUSE */}
            <TouchableOpacity onPress={togglePlayPause} style={styles.controlButton}>
              <Ionicons
                name={isRunning ? "pause-circle" : "play-circle"}
                size={50}
                color="white"
              />
            </TouchableOpacity>

            {/* NEXT / STOP */}
            {/* If we have more cycles left or more movements in this cycle, show next */}
            {(cycleIndex < totalCycles - 1 || currentIndex < hiitMovements.length - 1) ? (
              <TouchableOpacity onPress={handleNext} style={styles.controlButton}>
                <Ionicons name="arrow-forward-circle" size={50} color="white" />
              </TouchableOpacity>
            ) : (
              // Otherwise, show a "stop" button
              <TouchableOpacity onPress={handleClose} style={styles.controlButton}>
                <Ionicons name="stop-circle" size={50} color="red" />
              </TouchableOpacity>
            )}
          </View>

          {/* Coming Next Info */}
          {(() => {
            // get the next indexes
            const { nextCycleIndex, nextMovementIndex } = getNextIndexes();
            if (nextCycleIndex >= totalCycles) {
              return (
                <Text style={styles.comingNextText}>
                  This is the final movement.
                </Text>
              );
            } else {
              const nextName =
                hiitMovements[nextMovementIndex]?.movements?.exercise || "Movement";
              return (
                <View style={styles.comingNextContainer}>
                  <Text style={styles.comingNextLabel}>Next: </Text>
                  <Text style={styles.comingNextText}>{nextName}</Text>
                </View>
              );
            }
          })()}
        </View>
      </View>
    </Modal>
  );
};

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
    justifyContent: "center",
    marginBottom: 10

  },
  workoutTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "white",
  },
  closeBtn: {
    position: "absolute",
    right: 20,
  },
  cycleLabel: {
    color: "#fff",
    fontSize: 16,
    marginTop: 10,
  },
  videoArea: {
    width: "100%",
    height: "30%",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
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
    marginTop: 20,
    paddingHorizontal: 20,
  },
  timerText: {
    fontSize: 70,
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
