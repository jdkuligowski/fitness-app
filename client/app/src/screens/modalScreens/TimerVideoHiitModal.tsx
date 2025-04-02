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

/**
 * A single unified Timer modal for EMOM, Tabata, and 30/30,
 * retaining the same UI but adjusting logic based on workoutType.
 */
const TimerVideoHiitModal = ({
    isVisible,
    onClose,
    workoutName = "HIIT Workout",

    workoutType,            // "EMOM", "Tabata", "30/30"
    totalWorkoutDuration = 20, // in minutes for EMOM only

    // For EMOM, we rely on hiitMovements array
    hiitMovements = [],     // each object has { movements:{exercise}, duration:60 }

    workoutRounds,
    // For Tabata
    tabataRounds = 8,
    tabataTimeOn = 20,   // 20s work
    tabataTimeOff = 10,  // 10s rest

    // For 30/30
    thirtyRounds = 6,
    thirtyTimeOn = 30,
    thirtyTimeOff = 30,
}) => {
    useKeepAwake();

    const videoRef = useRef(null);

    // We'll build a unified "masterMovements" array that includes all lines
    // e.g. for Tabata: 8 rounds, each round => [Work(20s), Rest(10s)]
    // e.g. for 30/30: N rounds => [Work(30s), Rest(30s)]
    // e.g. for EMOM => repeated lines from hiitMovements

    const [masterMovements, setMasterMovements] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(0);
    const [isRunning, setIsRunning] = useState(false);

    // We'll also track totalCycles for UI: "Round X of Y"
    const [totalCycles, setTotalCycles] = useState(1);

    // On open => build masterMovements
    useEffect(() => {
        if (!isVisible) return;

        const newMaster = [];
        let computedCycles = 1;

        if (workoutType === "EMOM") {
            // We sum durations to find cycle length
            if (!hiitMovements.length) {
                console.warn("No hiitMovements for EMOM");
            } else {
                const cycleSec = hiitMovements.reduce(
                    (acc, mv) => acc + (mv.duration || 60),
                    0
                );
                const totalSec = totalWorkoutDuration * 60; // e.g. 20 => 1200
                computedCycles = Math.floor(totalSec / cycleSec);
                if (computedCycles < 1) computedCycles = 1;

                for (let c = 1; c <= computedCycles; c++) {
                    // one "round"
                    hiitMovements.forEach((mv, i) => {
                        const name = mv.movements?.exercise || `Rest`;
                        newMaster.push({
                            name,
                            durationSecs: mv.duration || 60,
                            isRest: /rest/i.test(name),
                            roundIndex: c // so we can display "Round c"
                        });
                    });
                }
            }
        }
        else if (workoutType === "Tabata") {
            // Each round => go through hiitMovements (which might be multiple exercises),
            // For each movement => do "work" line (20s) + "rest" line (10s)
            computedCycles = workoutRounds;

            for (let r = 1; r <= workoutRounds; r++) {
                // For each movement in hiitMovements, do 2 lines
                // e.g. movement + rest
                if (!hiitMovements.length) {
                    // fallback if none
                    newMaster.push({
                        name: `Work (Round ${r})`,
                        durationSecs: tabataTimeOn,
                        isRest: false,
                        roundIndex: r
                    });
                    newMaster.push({
                        name: `Rest (Round ${r})`,
                        durationSecs: tabataTimeOff,
                        isRest: true,
                        roundIndex: r
                    });
                } else {
                    // If we have multiple movements, cycle each in this "round"
                    // so 3 movements => 3*2 lines => 6 intervals per round
                    hiitMovements.forEach((mv, i) => {
                        const exName = mv.movements?.exercise || `Movement #${i + 1}`;
                        // Work line
                        newMaster.push({
                            name: `${exName}`,
                            durationSecs: tabataTimeOn,
                            isRest: false,
                            roundIndex: r,
                            landscape_video_url: mv.movements?.landscape_video_url || null
                        });
                        // Rest line
                        newMaster.push({
                            name: `Rest`,
                            durationSecs: tabataTimeOff,
                            isRest: true,
                            roundIndex: r
                            
                        });
                    });
                }
            }
        }
        else if (workoutType === "30/30") {
            // Similar approach: each round => go through hiitMovements
            // each movement => 30s work, 30s rest
            computedCycles = workoutRounds;

            for (let r = 1; r <= workoutRounds; r++) {
                if (!hiitMovements.length) {
                    newMaster.push({
                        name: `Work (Round ${r})`,
                        durationSecs: thirtyTimeOn,
                        isRest: false,
                        roundIndex: r
                    });
                    newMaster.push({
                        name: `Rest (Round ${r})`,
                        durationSecs: thirtyTimeOff,
                        isRest: true,
                        roundIndex: r
                    });
                } else {
                    hiitMovements.forEach((mv, i) => {
                        const exName = mv.movements?.exercise || `Movement #${i + 1}`;
                        // Work line
                        newMaster.push({
                            name: `${exName}`,
                            durationSecs: thirtyTimeOn,
                            isRest: false,
                            roundIndex: r,
                            landscape_video_url: mv.movements?.landscape_video_url || null
                        });
                        // Rest line
                        newMaster.push({
                            name: `Rest`,
                            durationSecs: thirtyTimeOff,
                            isRest: true,
                            roundIndex: r
                        });
                    });
                }
            }
        }

        setMasterMovements(newMaster);
        setTotalCycles(computedCycles);

        // Reset states
        setCurrentIndex(0);
        if (newMaster.length > 0) {
            setTimeLeft(newMaster[0].durationSecs);
        } else {
            setTimeLeft(0);
        }
        setIsRunning(false);
        videoRef.current?.stopAsync();
        Speech.stop();
    }, [isVisible]);

    // Timer effect
    useEffect(() => {
        let interval;
        if (isRunning && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => {
                    const val = prev - 1;

                    // only do "10s left" if EMOM
                    if (workoutType === "EMOM" && val === 10) {
                        const nextIndex = currentIndex + 1;
                        if (nextIndex < masterMovements.length) {
                            Speech.speak(`10 seconds until ${masterMovements[nextIndex].name}`, {
                                language: "en-GB"
                            });
                        }
                    }

                    if (val <= 0) {
                        goNextMovement();
                    }
                    return val;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isRunning, timeLeft, currentIndex]);

    // on currentIndex => setTimeLeft from the new line, stop or play video
    useEffect(() => {
        if (!masterMovements.length) return;
        const obj = masterMovements[currentIndex];
        setTimeLeft(obj.durationSecs);

        videoRef.current?.stopAsync().then(() => {
            if (isRunning) {
                videoRef.current?.playAsync().catch(console.warn);
            }
        });
    }, [currentIndex, isRunning]);

    // Move to next line
    const goNextMovement = () => {
        const nxt = currentIndex + 1;
        if (nxt >= masterMovements.length) {
            // done
            handleClose();
        } else {
            setCurrentIndex(nxt);
            // optionally speak if it's a "work" line
            if (workoutType === "EMOM") {
                // each line is presumably 60s, we speak at the start
                if (!masterMovements[nxt].isRest) {
                    Speech.speak(`Start ${masterMovements[nxt].name}`, { language: "en-GB" });
                } else {
                    Speech.speak("Rest now", { language: "en-GB" });
                }
            } else {
                // Tabata or 30/30 => also speak if it's a work line
                if (!masterMovements[nxt].isRest) {
                    Speech.speak(`Start ${masterMovements[nxt].name}`, { language: "en-GB" });
                } else {
                    Speech.speak("Rest now", { language: "en-GB" });
                }
            }
        }
    };

    const goPrevMovement = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    };

    const togglePlayPause = async () => {
        const newVal = !isRunning;
        setIsRunning(newVal);
        if (newVal) {
            // if timeLeft= full => speak
            if (timeLeft === masterMovements[currentIndex].durationSecs) {
                if (!masterMovements[currentIndex].isRest) {
                    Speech.speak(`Start ${masterMovements[currentIndex].name}`, { language: "en-GB" });
                } else {
                    Speech.speak(`Rest now`, { language: "en-GB" });
                }
            }
            await videoRef.current?.playAsync().catch(console.warn);
        } else {
            await videoRef.current?.pauseAsync().catch(console.warn);
        }
    };

    const handleClose = () => {
        resetModal();
        onClose();
    };

    const resetModal = () => {
        setIsRunning(false);
        setCurrentIndex(0);
        if (masterMovements.length) {
            setTimeLeft(masterMovements[0].durationSecs);
        }
        videoRef.current?.stopAsync();
        Speech.stop();
    };

    // If no data
    if (!masterMovements.length) {
        return (
            <Modal visible={isVisible} transparent onRequestClose={handleClose}>
                <View style={styles.noDataContainer}>
                    <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
                        <Ionicons name="close" size={25} color="white" />
                    </TouchableOpacity>
                    <Text style={{ color: "#fff" }}>No movements found.</Text>
                </View>
            </Modal>
        );
    }

    // figure out the "round" for UI
    // For Tabata or 30/30 => we stored roundIndex
    // For EMOM => we stored roundIndex as well
    const curObj = masterMovements[currentIndex];
    const currentRound = curObj.roundIndex || 1;


    return (
        <Modal
            visible={isVisible}
            animationType="slide"
            transparent={false}
            onRequestClose={handleClose}
        >
            <View style={styles.container}>
                {/* HEADER */}
                <View style={styles.headerContainer}>
                    <Text style={styles.workoutTitle}>{workoutName}</Text>
                    <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
                        <Ionicons name="close" size={25} color="white" />
                    </TouchableOpacity>
                </View>

                <Text style={styles.roundLabel}>
                    Round {currentRound} of {totalCycles}
                </Text>

                {/* VIDEO */}
                <View style={styles.videoArea}>
                    {curObj.landscape_video_url ? (
                        <Video
                            ref={videoRef}
                            source={{ uri: curObj.landscape_video_url }}
                            style={styles.video}
                            resizeMode="contain"
                            isLooping
                        />
                    ) : (
                        <View style={styles.videoPlaceholder}>
                            <Text style={styles.noVideoText}>No video available</Text>
                        </View>
                    )}
                </View>

                <Text style={styles.movementName}>{curObj.name}</Text>

                <View style={styles.timerBlock}>
                    <Text style={styles.timerText}>
                        {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
                    </Text>

                    <View style={styles.navigation}>
                        {currentIndex > 0 && (
                            <TouchableOpacity style={styles.controlButton} onPress={goPrevMovement}>
                                <Ionicons name="arrow-back-circle" size={50} color="white" />
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity style={styles.controlButton} onPress={togglePlayPause}>
                            <Ionicons
                                name={isRunning ? "pause-circle" : "play-circle"}
                                size={50}
                                color="white"
                            />
                        </TouchableOpacity>

                        {currentIndex < masterMovements.length - 1 ? (
                            <TouchableOpacity style={styles.controlButton} onPress={goNextMovement}>
                                <Ionicons name="arrow-forward-circle" size={50} color="white" />
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity style={styles.controlButton} onPress={handleClose}>
                                <Ionicons name="stop-circle" size={50} color="red" />
                            </TouchableOpacity>
                        )}
                    </View>
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
    roundLabel: {
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
