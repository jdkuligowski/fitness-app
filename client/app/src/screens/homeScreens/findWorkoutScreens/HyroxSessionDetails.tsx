import React, { useState, useEffect, useRef } from "react";
import { useNavigation } from '@react-navigation/native';
import {
    View, Text, StyleSheet, TouchableOpacity, SafeAreaView, FlatList, ActivityIndicator,
    Image, Dimensions, ScrollView, Modal, TouchableWithoutFeedback, Alert
} from "react-native";
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from "@expo/vector-icons/Ionicons";
import { useWorkout } from "../../../context/WorkoutContext";
import DateTimePicker from "@react-native-community/datetimepicker";
import SaveWorkoutModal from "../../modalScreens/SaveWorkoutModal";
import ENV from '../../../../../env'
import { useLoader } from '@/app/src/context/LoaderContext';
import { Colours } from '@/app/src/components/styles';
import min30Workouts from '../../../components/hyroxRules/30minWorkouts'
import min40Workouts from '../../../components/hyroxRules/40minWorkouts'
import min50Workouts from '../../../components/hyroxRules/50minWorkouts'
import min60Workouts from '../../../components/hyroxRules/60minWorkouts'
import commonRules from '../../../components/workoutRules/commonRules'
import ruleSet from '../../../components/workoutRules/warmupBRules'
import { Video } from 'expo-av';
import VideoModal from "../../modalScreens/VideoModal";

const SCREEN_WIDTH = Dimensions.get("window").width;

const hyroxRulesMap = {
    30: min30Workouts,
    40: min40Workouts,
    50: min50Workouts,
    60: min60Workouts,
};

const lowerBodyWarmUpKeys = [
    "Lower Body 1 (Option 1)",
    "Lower Body 1 (Option 2)",
    "Lower Body 2 (Option 1)",
    "Lower Body 2 (Option 2)",
];

export default function HyroxDetails({ route }) {
    const navigation = useNavigation();
    const { setIsBouncerLoading } = useLoader(); // Access loader functions
    const { selectedTime, division, selectedFinish, complexity } = route.params;
    const { workoutData, fetchWorkoutData, isLoading, conditioningData, fetchConditioningData } = useWorkout();
    const [workoutPlans, setWorkoutPlans] = useState([]);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showCalendarModal, setShowCalendarModal] = useState(false); // Track Calendar modal visibility
    const [selectedDate, setSelectedDate] = useState(new Date()); // Track selected date
    const [modalRoute, setModalRoute] = useState('')
    const [selectedMovement, setSelectedMovement] = useState(null); // For video modal

    const [currentWorkout, setCurrentWorkout] = useState(null); // Store the current workout for the modal
    const [filteredWorkoutData, setFilteredWorkoutData] = useState([]); // Store the current workout for the modal

    const flatListRef = useRef(null);

    const [hasSeenAnimation, setHasSeenAnimation] = useState(false);
    const ANIMATION_KEY = 'hasSeenSwipeAnimation';

    // run this animation on first load
    useEffect(() => {
        const checkIfAnimationSeen = async () => {
            // const hasSeen = await AsyncStorage.getItem(ANIMATION_KEY);
            if (!hasSeenAnimation) {
                setTimeout(() => startSwipeAnimation(), 1000); // Delay so everything loads first
            }
        };

        checkIfAnimationSeen();
    }, []);

    // Animation logic
    const startSwipeAnimation = async () => {
        try {
            const ITEM_WIDTH = 300; // Width of each card (customize if different)
            const OFFSET = SCREEN_WIDTH * 0.25; // 25% of the width

            // Scroll to 25% of the second item
            flatListRef.current?.scrollToOffset({ offset: OFFSET, animated: true });

            // Wait for 1 second and then scroll back to 0
            setTimeout(() => {
                flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
            }, 500);

            // Store in AsyncStorage so it only runs once
            // await AsyncStorage.setItem(ANIMATION_KEY, 'true');
            // setHasSeenAnimation(true);
        } catch (error) {
            console.error('Error running swipe animation:', error);
        }
    };

    useEffect(() => {
        if (flatListRef.current && workoutPlans.length > 0) {
            flatListRef.current.scrollToIndex({ index: 0, animated: true });
        }
    }, [workoutPlans]);


    useEffect(() => {
        // 1) Fetch workout data and conditioning data
        //    and then load the filtered movements (all in one shot).
        (async () => {
            setIsBouncerLoading(true);
            try {
                // A) fetchWorkoutData()
                await fetchWorkoutData(); // after this, your workoutData is in context or state

                // B) fetchConditioningData()
                await fetchConditioningData(); // now you have conditioningData

                // C) loadFilteredMovements()
                const stored = await AsyncStorage.getItem("activeEquipmentFilter");
                if (stored) {
                    const { filterId } = JSON.parse(stored);
                    if (filterId) {
                        const url = `${ENV.API_URL}/api/movements/filtered-movements/?filter_id=${filterId}`;
                        console.log("Fetching filtered movements from:", url);
                        const response = await fetch(url);
                        const data = await response.json();

                        // If you actually want to set the real filtered data:
                        setFilteredWorkoutData(data);
                    } else {
                        console.warn("No filterId in active filter data; fallback to all?");
                        setFilteredWorkoutData(workoutData);
                    }
                } else {
                    // No filter, fallback to all
                    setFilteredWorkoutData(workoutData);
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        })();
    }, []);

    useEffect(() => {
        // 2) Once we have both “filteredWorkoutData” and “conditioningData” loaded,
        //    generate the workout plans
        if (filteredWorkoutData.length > 0 && conditioningData.length > 0) {
            generateWorkoutPlans();
            setIsBouncerLoading(false);
        }
    }, [filteredWorkoutData, conditioningData]);



    // Filter workout data for a section
    const filterWorkoutData = (filters, usedExercises = new Set(), workoutType) => {
        if (!filters || !Array.isArray(filters)) {
            console.warn("Invalid filters provided to filterWorkoutData:", filters);
            return [];
        }

        // Normalize a single string (remove parentheses, trim, lower-case).
        // We do NOT split on commas/spaces anymore – substring matching for 'contains'.
        const normalize = (str) => {
            return String(str || "")
                .replace(/[\(\)]/g, "") // remove parentheses
                .trim()
                .toLowerCase();
        };

        // Filter out movements that fail any filter sets
        const filteredMovements = filteredWorkoutData.filter((exercise) => {
            // Build a map of normalized string values for each field
            const exerciseKeyValues = {};
            Object.keys(exercise).forEach((key) => {
                exerciseKeyValues[key] = normalize(exercise[key]);
            });

            // Each item in 'filters' can be a single filter or an array (filterSet).
            // We require *all* filter sets to pass (i.e., AND logic).
            const allFilterSetsPass = filters.every((filterSet) => {
                // If filterSet is not an array, wrap it
                if (!Array.isArray(filterSet)) filterSet = [filterSet];

                // Every condition in this set must pass
                return filterSet.every(({ key, value, operator }) => {
                    const exerciseValue = exerciseKeyValues[key];
                    if (!exerciseValue) return false;

                    // If 'value' is a single string, wrap into an array so we handle multiple values consistently
                    const valueArr = Array.isArray(value) ? value : [value];
                    // Normalize each piece of the filter
                    const filterValues = valueArr.map((v) => normalize(v));

                    // // Debug log
                    // console.log(
                    //     `RowID=${exercise.id} Checking key="${key}" | operator="${operator}" | exerciseValue="${exerciseValue}" | filterValues=${JSON.stringify(filterValues)}`
                    // );

                    if (operator === "contains") {
                        // Return true if ANY filterValue is a substring of exerciseValue
                        return filterValues.some((filterWord) => exerciseValue.includes(filterWord));
                    }

                    if (operator === "equals") {
                        // Return true if EVERY filterValue exactly matches exerciseValue
                        return filterValues.every((filterWord) => exerciseValue === filterWord);
                    }

                    console.warn("Unknown operator:", operator);
                    return false;
                });
            });

            return allFilterSetsPass;
        });

        // console.log(
        //     "Filtered Movements (Pre-Deduplication):",
        //     JSON.stringify(filteredMovements, null, 2)
        // );

        // Deduplicate by 'exercise' name, then shuffle, then exclude used
        const uniqueMovements = Array.from(new Set(filteredMovements.map((m) => m.exercise)));
        console.log("Unique Movements:", JSON.stringify(uniqueMovements, null, 2));

        return uniqueMovements
            .sort(() => Math.random() - 0.5)
            .filter((movement) => !usedExercises.has(movement));
    };




    // Function to handle filtering and random selection for Warm-Up A
    const filterWarmUpA = () => {
        // console.log('common rules ->', commonRules.warmUpA.filters);

        // Flatten filters if they are nested
        const filters = commonRules.warmUpA.filters.flat();

        // Filter exercises matching the Warm-Up A criteria
        const warmUpCandidates = filteredWorkoutData.filter((exercise) => {
            return filters.every(({ key, value, operator }) => {
                if (!exercise[key]) return false;
                if (operator === "contains") return exercise[key].includes(value);
                if (operator === "equals") return exercise[key] === value;
                return false;
            });
        });

        if (warmUpCandidates.length === 0) {
            console.warn("No candidates found for Warm-Up A.");
            return [];
        }

        // Select one random movement from the candidates
        const selectedExercise = warmUpCandidates[Math.floor(Math.random() * warmUpCandidates.length)];
        return [selectedExercise.exercise]; // Return as an array
    };



    // Function to handle filtering and random selection for Warm-Up B (up to 3 movements)
    const filterWarmUpMovements = (usedExercises, type) => {
        const standardizedType = type.toLowerCase();
        const bodyAreaFilter =
            standardizedType === "upper body" ? "upper body" : standardizedType === "lower body" ? "lower body" : null;

        const warmUpMovements = filteredWorkoutData.filter(
            (exercise) =>
                (exercise.advance || "").includes("Warm Up") && // <-- safe fallback
                (!bodyAreaFilter || exercise.body_area?.toLowerCase() === bodyAreaFilter) &&
                !usedExercises.has(exercise.exercise)
        );

        const shuffledMovements = warmUpMovements
            .sort(() => Math.random() - 0.5) // Shuffle the array
            .slice(0, 3) // Select up to 3
            .map((movement) => movement.exercise);

        shuffledMovements.forEach((movement) => usedExercises.add(movement));
        return shuffledMovements;
    };



    // 5) Our "Generate Hyrox Plan" logic
    const generateHyroxPlan = () => {
        // clamp the selectedTime to your valid times [30, 40, 50, 60]
        const allowedTimes = [30, 40, 50, 60];
        const closestTime = allowedTimes.reduce((prev, curr) =>
            Math.abs(curr - selectedTime) < Math.abs(prev - selectedTime) ? curr : prev
        );
        console.log(`Hyrox: Adjusted selectedTime from ${selectedTime} to ${closestTime}`);

        const plan = [];

        // ~~~~~~~~~~~~~~~~~~~~~
        // 1) Always push Warm Up A
        // ~~~~~~~~~~~~~~~~~~~~~
        const warmUpA = filterWarmUpA(); // exactly like your Gym logic
        plan.push({
            partLabel: "Warm Up A",
            movements: warmUpA,
            sectionType: "single"
        });

        // ~~~~~~~~~~~~~~~~~~~~~
        // 2) Always push Warm Up B
        // ~~~~~~~~~~~~~~~~~~~~~
        // pick random from the 4 “Lower Body X (Option Y)” keys
        const randomIndex = Math.floor(Math.random() * lowerBodyWarmUpKeys.length);
        const warmUpKey = lowerBodyWarmUpKeys[randomIndex];
        const warmUpObj = ruleSet[warmUpKey]; // e.g. ruleSet["Lower Body 1 (Option 2)"]

        if (!warmUpObj) {
            console.warn("No Lower Body warm-up found for key:", warmUpKey);
            plan.push({
                partLabel: "Warm Up B",
                movements: [],
                sectionType: "single",
            });
        } else {
            // Convert the object to an array of movements
            // e.g. {movement1: "Wall Deep Squat Rotation", movement2: "..."} => ["Wall Deep Squat Rotation","..."]
            const listedMovements = Object.values(warmUpObj).filter(Boolean);

            // If you want to see if they're in your filtered data, etc.:
            const finalMovements = listedMovements.map((movementName) => {
                const matched = filteredWorkoutData.find((ex) =>
                    (ex.exercise || "").trim().toLowerCase() === movementName.trim().toLowerCase()
                );
                if (!matched) {
                    console.warn(`Movement "${movementName}" not found in DB. Using name only.`);
                    return movementName;
                }
                return matched.exercise;
            });

            plan.push({
                partLabel: "Warm Up B",
                movements: finalMovements,
                sectionType: finalMovements.length > 1 ? "superset" : "single",
            });
        }

        // ~~~~~~~~~~~~~~~~~~~~~
        // 3) Condition-Only Scenario?
        // ~~~~~~~~~~~~~~~~~~~~~
        if (selectedFinish === "Conditioning") {
            // We only want to add a single conditioning block
            const condSection = generateConditioningSection(closestTime);
            plan.push(condSection);
            return plan;
        }

        // ~~~~~~~~~~~~~~~~~~~~~
        // 4) If not condition-only, build from hyroxRulesMap
        // ~~~~~~~~~~~~~~~~~~~~~
        const rules = hyroxRulesMap[closestTime];
        if (!rules) {
            console.error(`No hyrox rules found for ${closestTime} minutes.`);
            return plan;
        }

        // pick a random "option_" key
        const optionKeys = Object.keys(rules);
        if (optionKeys.length === 0) {
            console.error(`No option keys found in hyroxRulesMap for time ${closestTime}`);
            return plan;
        }

        const chosenOption = optionKeys[Math.floor(Math.random() * optionKeys.length)];
        const selectedRules = rules[chosenOption];
        if (!selectedRules || !selectedRules.sections) {
            console.error(`No sections found for chosenOption ${chosenOption}`);
            return plan;
        }

        const usedExercises = new Set();

        // Now for each "section" in the chosen rule, if "Conditioning" => add condition
        selectedRules.sections.forEach((sectionRule) => {
            const { section, filters, duration } = sectionRule;

            if (section === "Conditioning") {
                // We do a separate function to pick a random conditioning workout with "duration"
                const durationToUse = (selectedFinish === "Both")
                    ? duration       // from the rule
                    : closestTime;   // from user’s request

                // Also pass a boolean "isBoth" or "isConditioningOnly"
                const condSection = generateConditioningSection(durationToUse, {
                    isBoth: (selectedFinish === "Both")
                });
                plan.push(condSection);

            } else {
                // It's e.g. "Strong 1", "Build 1", "Pump 1"
                // We'll filter the DB for each filterSet, pick 1 movement
                const finalMovements = [];
                if (filters && Array.isArray(filters)) {
                    filters.forEach((filterSet) => {
                        // We pass filterSet to your "filterWorkoutData"
                        // plus "usedExercises" so we don’t repeat
                        const movementCandidates = filterWorkoutData(filterSet, usedExercises, "Hyrox");
                        if (movementCandidates.length > 0) {
                            const chosenMovement = movementCandidates[
                                Math.floor(Math.random() * movementCandidates.length)
                            ];
                            finalMovements.push(chosenMovement);
                            usedExercises.add(chosenMovement);
                        }
                    });
                }

                plan.push({
                    partLabel: section,
                    movements: finalMovements,
                    sectionType: finalMovements.length > 1 ? "superset" : "single",
                });
            }
        });

        // If the user picked "selectedFinish === 'Conditioning' or 'Both'",
        // you can do extra logic to append or replace a final conditioning,
        // depending on your design.

        return plan;
    };


    // -------------------------- CLAMP FUNCTION --------------------------
    function clampToAllowedTimes(userSelectedTime) {
        // userSelectedTime might be 8, 25, 30, 35, 60, etc.
        if (userSelectedTime < 30) {
            return 20;  // anything < 30 => 20
        } else if (userSelectedTime < 40) {
            return 30;  // 30..39 => 30
        } else {
            return 40;  // 40 or more => 40
        }
    }

    // ------------------ generateConditioningSection ---------------------
    function generateConditioningSection(targetDuration, { isBoth = false } = {}) {
        let valid;

        if (isBoth) {
            // Scenario: The rule says "duration: 20" or "duration: 40", etc.
            // so pick from conditioningData where item.duration === targetDuration
            valid = conditioningData.filter(item => item.duration === targetDuration);

            if (valid.length === 0) {
                console.warn(`No conditioning workouts exactly matching rule of ${targetDuration} mins.`);
                return {
                    partLabel: "Conditioning",
                    movements: [],
                    sectionType: "single",
                };
            }

        } else {
            // Scenario: "Conditioning only" from the user
            // 1) First clamp the user’s targetDuration to [20, 30, 40]
            const finalTime = clampToAllowedTimes(targetDuration);

            // 2) Now pick from conditioningData where item.duration === finalTime
            valid = conditioningData.filter(item => item.duration === finalTime);

            if (valid.length === 0) {
                console.warn(`No conditioning workouts for forced duration ${finalTime} found.`);
                return {
                    partLabel: "Conditioning",
                    movements: [],
                    sectionType: "single",
                };
            }
        }

        // 3) Randomly pick one from valid
        const chosen = valid[Math.floor(Math.random() * valid.length)];
        if (!chosen) {
            return {
                partLabel: "Conditioning",
                movements: [],
                sectionType: "single",
            };
        }

        // 4) Possibly pick an aerobic movement
        const aerobicOptions = ["Bike", "Row", "Ski"];
        const selectedAerobicType = aerobicOptions[Math.floor(Math.random() * aerobicOptions.length)];

        // 5) Build movements array
        const movements = chosen.conditioning_details.map((movement) => {
            let exercise = movement.exercise;
            if (exercise.toLowerCase() === "aerobic") {
                exercise = selectedAerobicType;
            }
            return {
                movementOrder: movement.movement_order,
                exercise,
                detail: movement.detail || "No detail provided",
            };
        });

        return {
            partLabel: "Conditioning",
            workoutId: chosen.id,
            workoutName: chosen.name,
            notes: chosen.notes,
            movements,
            sectionType: movements.length > 1 ? "superset" : "single",
            rest: chosen.rest,
        };
    }






    const toWarmUpKey = (str) => {
        // e.g. "full_body_1" -> "Full Body 1"
        const parts = str.split("_"); // ["full","body","1"]
        if (parts.length < 3) return null;

        const firstPart = parts[0][0].toUpperCase() + parts[0].slice(1);  // "Full"
        const secondPart = parts[1][0].toUpperCase() + parts[1].slice(1); // "Body"
        const thirdPart = parts[2];  // "1" or "2"

        return `${firstPart} ${secondPart} ${thirdPart}`;
        // e.g. "Full Body 1"
    }

    const generateWorkoutPlans = () => {
        const rawPlans = [];
        for (let i = 0; i < 10; i++) {
            rawPlans.push(generateHyroxPlan());
        }

        const uniquePlans = [];
        const planSignatures = new Set();

        for (const plan of rawPlans) {
            const planSignature = JSON.stringify(plan);
            if (!planSignatures.has(planSignature)) {
                planSignatures.add(planSignature);
                uniquePlans.push(plan);
            }
        }

        setWorkoutPlans(uniquePlans);
    };




    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#E87EA1" />
                <Text>Loading workout plans...</Text>
            </View>
        );
    }



    const showModalForWorkout = (workout) => {
        setCurrentWorkout(workout); // Set the workout plan that will be used inside the modal
    };


    const closeModal = () => {
        setCurrentWorkout(null); // Reset the current workout when modal is closed
        setShowDatePicker(false);
    };


    const saveAndStartWorkout = async (workoutPlan) => {
        setIsBouncerLoading(true);
        try {
            const userId = await AsyncStorage.getItem("userId");
            if (!userId) throw new Error("User ID not found in AsyncStorage.");

            const formattedDate = new Date().toISOString().split("T")[0];
            const payload = {
                user_id: userId,
                name: `Hyrox workout`,
                description: "Custom generated workout",
                duration: selectedTime,
                complexity: 3,
                status: "Started",
                scheduled_date: formattedDate,
                activity_type: 'Hyrox',
                sections: workoutPlan.map((section, index) => {
                    if (section.partLabel === "Conditioning") {
                        return {
                            section_name: section.partLabel,
                            section_order: index + 1,
                            section_type: section.sectionType,
                            conditioning_workout: {
                                conditioning_overview_id: section.workoutId,
                                notes: section.notes,
                                comments: null,
                                rpe: null,
                                movements: section.movements.map((movement, movementIndex) => ({
                                    movement_order: movementIndex + 1,
                                    movement_name: movement.exercise,
                                })),
                            },
                        };
                    } else {
                        return {
                            section_name: section.partLabel,
                            section_order: index + 1,
                            section_type: section.sectionType,
                            movements: section.movements.map((movement, movementIndex) => ({
                                movement_name: movement,
                                movement_order: movementIndex + 1,
                            })),
                        };
                    }
                }),
            };

            console.log("Payload for save and start:", JSON.stringify(payload, null, 2));

            // 1️⃣ Save the workout
            const response = await axios.post(`${ENV.API_URL}/api/saved_workouts/save-workout/`, payload);
            console.log("Response from save:", JSON.stringify(response.data, null, 2));

            // Extract the ID of the saved workout
            const savedWorkoutId = response.data?.workout.id;

            if (!savedWorkoutId) {
                console.error("Workout ID is undefined, check API response:", response.data);
                Alert.alert("Error", "Failed to save workout. Please try again.");
                setIsBouncerLoading(false);
                return;
            }

            console.log("New Workout ID ->", savedWorkoutId);

            // 2️⃣ Fetch workout details and movement history
            const workoutDetailsResponse = await axios.get(
                `${ENV.API_URL}/api/saved_workouts/get-single-workout/${savedWorkoutId}/`,
                { params: { user_id: userId } }
            );

            const { workout, movement_history, conditioning_history } = workoutDetailsResponse.data;
            console.log("Workout details ->", workout);
            console.log("Movement history ->", movement_history);
            console.log("Movement history ->", conditioning_history);

            setIsBouncerLoading(false);

            // 3️⃣ Navigate directly to CompleteWorkout with all the data
            navigation.navigate("Training", {
                screen: "CompleteWorkout",
                params: {
                    workout: workout,
                    movementHistory: movement_history,
                    conditioningHistory: conditioning_history,
                },
            });
        } catch (error) {
            console.error("Error saving and starting workout:", error?.response?.data || error.message);
            Alert.alert("Error", "There was an error starting your workout. Please try again.");
            setIsBouncerLoading(false);
        }
    };


    const findMovementByExercise = (exerciseName) => {
        return filteredWorkoutData.find((movement) => movement.exercise === exerciseName);
    };

    const findConditioningByExercise = (movement) => {
        return workoutData.find((data) =>
            (data.exercise || "").trim().toLowerCase() === (movement.exercise || "").trim().toLowerCase()
        );
    };


    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.scrollContainer}>
                <View style={styles.header}>
                    <View style={styles.topSection}>
                        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                            <Ionicons name="arrow-back" size={24} color="black" />
                        </TouchableOpacity>
                        <Text style={styles.headingText}>Hyrox workouts</Text>
                    </View>
                </View>
                <FlatList
                    ref={flatListRef}
                    data={[...workoutPlans, { reload: true }]}
                    horizontal
                    pagingEnabled
                    keyExtractor={(_, index) => index.toString()}
                    showsHorizontalScrollIndicator={false}
                    renderItem={({ item }) =>
                        item.reload ? (
                            <View style={styles.reloadContainer}>
                                <Text style={styles.reloadText}>Not what you were looking for?</Text>
                                <TouchableOpacity
                                    style={styles.reloadButton}
                                    onPress={generateWorkoutPlans}
                                >
                                    <Text style={styles.reloadButtonText}>Load more</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <>
                                <View style={styles.workoutCard}>
                                    <View style={styles.workoutOverview}>
                                        <View
                                            style={[
                                                styles.colorStrip,
                                                { backgroundColor: Colours.hyroxColour },
                                            ]}
                                        />
                                        <View style={styles.overviewBox}>
                                            <View style={styles.overviewHeader}>
                                                <View>
                                                    <Text style={styles.workoutTitle}>Hyrox session</Text>
                                                    <View style={styles.workoutOverviewTime}>
                                                        <Ionicons name="time-outline" size={24} color="black" />
                                                        <Text style={styles.timeText}>{selectedTime} mins</Text>
                                                    </View>
                                                </View>
                                                <TouchableOpacity
                                                    style={styles.profileButton}
                                                    onPress={() => showModalForWorkout(item)} // Set modal for current workout
                                                >
                                                    <Ionicons name="ellipsis-vertical-outline" color={'black'} size={24} />
                                                </TouchableOpacity>
                                            </View>
                                            <View style={styles.workoutSummaryArray}>
                                                {/* <Text style={styles.workoutSummaryButton}>Intermediate</Text> */}
                                                <Text style={styles.workoutSummaryButton}>Hyrox session</Text>
                                                {/* <Text style={styles.workoutSummaryButton}>{workoutPlans.length} sections</Text> */}
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
                                    {/* <Text style={styles.workoutActivity}>Workout Summary</Text> */}
                                    <ScrollView style={styles.workoutList}>
                                        {item.map((section, index) => (
                                            <View key={index} style={styles.sectionContainer}>
                                                {/* Check if the section is "Conditioning" */}
                                                {section.partLabel === "Conditioning" ? (
                                                    <>
                                                        <Text style={styles.sectionTitle}>
                                                            Conditioning: {section.workoutName || "Unnamed Conditioning Workout"}
                                                        </Text>
                                                        <View style={styles.movementsContainer}>
                                                            {[...section.movements]
                                                                .sort((a, b) => a.movementOrder - b.movementOrder)
                                                                .map((movement, i) => {
                                                                    const movementFilter = findConditioningByExercise(movement);
                                                                    return (
                                                                        <View key={i} style={styles.movementRow}>
                                                                            <View style={styles.movementLeft}>
                                                                                <Text style={styles.movementValue}>{`${movement.movementOrder}: `}</Text>
                                                                                <Text style={styles.movementDetail}>
                                                                                    {`${movement.detail} `}
                                                                                </Text>
                                                                                <Text style={styles.movementDetail}>{movement.exercise || "Unknown Movement"}</Text>
                                                                            </View>
                                                                            <TouchableOpacity onPress={() => {
                                                                                setSelectedMovement(movementFilter);
                                                                            }}>
                                                                                <Ionicons name="play-circle" size={24} color={Colours.buttonColour} />
                                                                            </TouchableOpacity>
                                                                        </View>
                                                                    );
                                                                })}
                                                            {section.rest > 0 && (
                                                                <View style={styles.movementRow}>
                                                                    <Text style={styles.restDetail}>
                                                                        Rest for {section.rest} seconds between rounds
                                                                    </Text>
                                                                </View>
                                                            )}
                                                        </View>
                                                    </>
                                                ) : (
                                                    <>
                                                        {/* Render non-conditioning sections */}
                                                        <Text style={styles.sectionTitle}>{section.partLabel}</Text>
                                                        {section.movements.map((movement, i) => {
                                                            const movementFilter = findMovementByExercise(movement);
                                                            return (
                                                                <View key={i} style={styles.movementRow}>
                                                                    <View style={styles.movementLeft}>
                                                                        <Text style={styles.movementValue}>{`${i + 1}: `}</Text>
                                                                        <Text style={styles.movementDetail}>{movement}</Text>
                                                                    </View>
                                                                    <TouchableOpacity onPress={() => {
                                                                        setSelectedMovement(movementFilter);
                                                                    }}>
                                                                        <Ionicons name="play-circle" size={24} color={Colours.buttonColour} />
                                                                    </TouchableOpacity>
                                                                </View>
                                                            );
                                                        })}
                                                        <View style={styles.dividerLine}></View>
                                                    </>
                                                )}
                                            </View>
                                        ))}
                                    </ScrollView>


                                    <View style={styles.buttonContainer}>
                                        <TouchableOpacity
                                            style={styles.submitButton}
                                            onPress={() => saveAndStartWorkout(item)}
                                        >
                                            <Text style={styles.submitButtonText}>Start workout</Text>
                                            <View style={styles.submitArrow}>
                                                <Ionicons name="arrow-forward" size={24} color="black" />
                                            </View>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </>
                        )
                    }
                />
                {currentWorkout && (
                    <Modal
                        animationType="slide"
                        transparent={true}
                        visible={!!currentWorkout}
                        onRequestClose={closeModal}
                    >
                        <SaveWorkoutModal
                            currentWorkout={currentWorkout} // Pass the workout object
                            onClose={closeModal} // Pass the close function
                            selectedTime={selectedTime} // Pass the selected time
                            selectedWorkout={'Hyrox workout'} // Pass the selected workout name
                            workoutPlan={currentWorkout} // Pass the current workout plan
                            closeModal={closeModal} // Close function for modal
                            frequency={"Sometimes"}
                            modalRoute={'Discovery'}
                            workoutType="Hyrox"
                        />
                    </Modal>
                )}
                {selectedMovement && (
                    <VideoModal
                        visible={!!selectedMovement}
                        movement={selectedMovement}
                        onClose={() => setSelectedMovement(null)}
                    />
                )
                }
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
        width: 50,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
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
        backgroundColor: Colours.secondaryColour,
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
        flexDirection: 'row'
    },
    overviewBox: {
        width: '94%',
        padding: 10,
        backgroundColor: Colours.primaryBackground,
        borderTopRightRadius: 20,
        borderBottomRightRadius: 20,
        justifyContent: 'space-between',
        height: 175,
    },
    overviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    colorStrip: {
        width: 20,
        borderTopLeftRadius: 100,
        borderBottomLeftRadius: 100,
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
        backgroundColor: Colours.secondaryColour,
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
        marginHorizontal: 20,
        marginVertical: 10,
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
        paddingHorizontal: 20,
        paddingBottom: 20,
        height: 390,
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
    partLabel: {
        fontWeight: 600,
    },
    movementRow: {
        marginVertical: 5, // Space between rows
        flexDirection: 'row',
        paddingLeft: 10,
        alignItems: 'center',
        // justifyContent: 'space-between',
    },
    movementLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '90%',
        paddingRight: 10,
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
        color: 'black',
        fontWeight: "500",
        lineHeight: 24,
        // width: '30%',
    },
    movementDetail: {
        fontSize: 16,
        color: 'black', // Example color for movement details
    },
    movementDescription: {
        fontSize: 16,
        color: "#555",
        lineHeight: 24, // Match the label line height for alignment
        paddingBottom: 5,
        paddingRight: 5,
    },
    buttonContainer: {
        marginVertical: 0,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
        marginTop: 10,
    },
    submitButton: {
        backgroundColor: Colours.buttonColour,
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