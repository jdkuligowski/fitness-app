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
import strengthRules30 from '../../../components/workoutRules/strengthRules30'
import strengthRules40 from '../../../components/workoutRules/strengthRules40'
import strengthRules50 from '../../../components/workoutRules/strengthRules50'
import strengthRules60 from '../../../components/workoutRules/strengthRules60'
import strengthRules75 from '../../../components/workoutRules/strengthRules60'
import commonRules from '../../../components/workoutRules/commonRules'
import ruleSet from '../../../components/workoutRules/warmupBRules'
import { Video } from 'expo-av';
import VideoModal from "../../modalScreens/VideoModal";

const SCREEN_WIDTH = Dimensions.get("window").width;

const strengthRulesMap = {
    30: strengthRules30,
    40: strengthRules40,
    50: strengthRules50,
    60: strengthRules60,
    75: strengthRules60,
};

export default function WorkoutScreen({ route }) {
    const navigation = useNavigation();
    const { setIsBouncerLoading } = useLoader(); // Access loader functions
    const { selectedTime, selectedWorkout, frequency, selectedFinish, complexity, userData } = route.params;
    const { workoutData, fetchWorkoutData, isLoading, conditioningData, fetchConditioningData } = useWorkout();
    const [workoutPlans, setWorkoutPlans] = useState([]);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showCalendarModal, setShowCalendarModal] = useState(false); // Track Calendar modal visibility
    const [selectedDate, setSelectedDate] = useState(new Date()); // Track selected date
    const [modalRoute, setModalRoute] = useState('')
    const [selectedMovement, setSelectedMovement] = useState(null); // For video modal

    const [currentWorkout, setCurrentWorkout] = useState(null); // Store the current workout for the modal
    const [filteredWorkoutData, setFilteredWorkoutData] = useState([]); // Store the current workout for the modal
    const [didShowNoPlanAlert, setDidShowNoPlanAlert] = useState(false);

    const flatListRef = useRef(null);

    const [hasSeenAnimation, setHasSeenAnimation] = useState(false);
    const ANIMATION_KEY = 'hasSeenSwipeAnimation';
    const hasGeneratedOnce = useRef(false);

    // run this animation on first load
    // useEffect(() => {
    const checkIfAnimationSeen = async () => {
        // const hasSeen = await AsyncStorage.getItem(ANIMATION_KEY);
        if (!hasSeenAnimation) {
            setTimeout(() => startSwipeAnimation(), 1000); // Delay so everything loads first
        }
    };

    //     checkIfAnimationSeen();
    // }, []);

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

    const loadFilteredMovements = async () => {
        try {
            setIsBouncerLoading(true);

            const stored = await AsyncStorage.getItem("activeEquipmentFilter");
            if (!stored) {
                console.warn("No stored filter found; fallback to all movements?");
                // Optionally fetch all movements or do nothing
                return;
            }
            const parsed = JSON.parse(stored);
            const filterId = parsed.filterId; // e.g. 12
            if (!filterId) {
                console.warn("No filterId in active filter data; fallback?");
                return;
            }

            const url = `${ENV.API_URL}/api/movements/filtered-movements/?filter_id=${filterId}`;
            console.log("Fetching filtered movements from:", url);
            const response = await fetch(url);
            const data = await response.json();

            setFilteredWorkoutData(data);  // "data" will be an array of Movement objects 
            console.log('Filtered movements: ', data)
        } catch (error) {
            console.error("Error fetching filtered movements:", error);
        } finally {
            setIsBouncerLoading(false);
        }
    };



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


    // Generate a single workout plan
    const generateWorkoutPlan = () => {
        const allowedTimes = [30, 40, 50, 60, 75];
        const closestTime = allowedTimes.reduce((prev, curr) =>
            Math.abs(curr - selectedTime) < Math.abs(prev - selectedTime) ? curr : prev
        );
        console.log(`Adjusted selectedTime from ${selectedTime} to ${closestTime}`);

        const rules = strengthRulesMap[closestTime];
        if (!rules) {
            console.error(`No rules found for ${closestTime} minutes.`);
            return [];
        }

        const workoutKeyBase = selectedWorkout.toLowerCase().replace(/\s/g, "_");
        const workoutKeys = Object.keys(rules).filter((key) => key.startsWith(workoutKeyBase));
        if (workoutKeys.length === 0) {
            console.error(`No workout keys found for type: ${selectedWorkout}`);
            return [];
        }

        const selectedKey = workoutKeys[Math.floor(Math.random() * workoutKeys.length)];
        const selectedRules = rules[selectedKey];
        if (!selectedRules) {
            console.error(`No rules found for selected workout key: ${selectedKey}`);
            return [];
        }

        // Key Swap for "advanced_movements" based on user’s complexity
        // E.g. if user is "Intermediate", we want to replace "advanced_movements" with "inter_movements"
        const complexityKey = (complexity === "Intermediate")
            ? "inter_movements"
            : "advanced_movements"; // or you can handle "Beginner" or "Advanced" differently

        // traverse each section’s filters, swap advanced->inter
        selectedRules.sections.forEach((section) => {
            section.filters.forEach((filterSet) => {
                filterSet.forEach((f) => {
                    if (f.key === "advanced_movements") {
                        f.key = complexityKey;
                    }
                });
            });
        });

        const usedExercises = new Set();
        const plan = [];

        // Add Warm-Up A Section (1 movement)
        const warmUpA = filterWarmUpA();
        plan.push({
            partLabel: commonRules.warmUpA.section,
            movements: warmUpA,
            sectionType: "single",
            filters: commonRules.warmUpA.filters, // Attach filters for Warm-Up A
        });

        // // Add Warm-Up B Section (up to 3 movements)
        // const warmUpB = filterWarmUpMovements(usedExercises, selectedWorkout);
        // plan.push({
        //     partLabel: commonRules.warmUpB.section,
        //     movements: warmUpB,
        //     sectionType: "superset",
        //     filters: "Warm-Up Filter Logic", // Example for Warm-Up B
        // });

        // 1) Convert "full_body_1" to "Full Body 1" 
        // (the same key you used for synergy but now we treat it as warm-up logic)
        const warmUpBase = toWarmUpKey(selectedKey);
        if (!warmUpBase) {
            console.warn("Could not parse warm-up key from", selectedKey, "– skipping Warm Up B");
        } else {
            // 2) Randomly pick Option 1 or Option 2
            const randomOption = Math.random() < 0.5 ? "Option 1" : "Option 2";
            const warmUpKey = `${warmUpBase} (${randomOption})`;
            // e.g. "Full Body 1 (Option 1)"

            // 3) Grab from your new ruleSet
            const warmUpObj = ruleSet[warmUpKey];
            if (!warmUpObj) {
                console.warn("No Warm Up B ruleSet entry for", warmUpKey, "– skipping Warm Up B");
                plan.push({
                    partLabel: commonRules.warmUpB.section, // "Warm up B"
                    movements: [],
                    sectionType: "single",
                });
            } else {
                // warmUpObj => { movement1: "...", movement2: "...", movement3: "...", movement4: "..." }
                const listedMovements = Object.values(warmUpObj).filter(Boolean);
                // e.g. ["Couch w. Rotation","Banded Dislocate","HK Rotation","Counterbalance Squat"]

                // 4) For each warm-up movement, find the actual DB entry in filteredWorkoutData
                //    so you can reference its ID or other fields. If you only need the name, you can skip this step.
                const finalWarmUpMovements = listedMovements.map((name) => {
                    // Attempt to find in filteredWorkoutData by matching .exercise
                    const matched = filteredWorkoutData.find((ex) =>
                        (ex.exercise || "").trim().toLowerCase() === name.trim().toLowerCase()
                    );
                    if (!matched) {
                        console.warn(`Movement "${name}" not found in filteredWorkoutData. Using name only.`);
                        return name;
                    }
                    // If found, you can store the entire object or just ex.exercise
                    return matched.exercise; // or matched
                });

                // 5) Add to usedExercises if you want to block duplicates
                finalWarmUpMovements.forEach((mov) => usedExercises.add(mov));

                // 6) Push it onto the plan
                plan.push({
                    partLabel: commonRules.warmUpB.section,
                    movements: finalWarmUpMovements,
                    sectionType: finalWarmUpMovements.length > 1 ? "superset" : "single",
                });
            }
        }


        // Add Main Workout Sections
        selectedRules.sections.forEach((sectionRule, sectionIndex) => {
            const movements = [];
            const sectionFilters = []; // Track filters applied in this section

            sectionRule.filters.forEach((filterSet, index) => {
                console.log(`Applying filters for section: ${sectionRule.section}, FilterSet ${index}:`, filterSet);

                const movementCandidates = filterWorkoutData(filterSet, usedExercises, selectedWorkout);
                console.log(`Movement Candidates for FilterSet ${index}:`, movementCandidates);

                if (movementCandidates.length > 0) {
                    const selectedMovement =
                        movementCandidates[Math.floor(Math.random() * movementCandidates.length)];
                    console.log(`Selected Movement for FilterSet ${index}:`, selectedMovement);

                    movements.push(selectedMovement);
                    usedExercises.add(selectedMovement);
                    sectionFilters.push(filterSet); // Store applied filters
                }
            });

            // // Ensure "Back Squat" appears in the first section
            // if (sectionIndex === 0 && !movements.includes("Back Squat")) {
            //     console.log("Ensuring Back Squat is in the first section.");
            //     movements.unshift("Back Squat"); // Add Back Squat to the beginning of the movements array
            //     usedExercises.add("Back Squat");
            // }

            plan.push({
                partLabel: sectionRule.section,
                movements,
                sectionType: movements.length > 1 ? "superset" : "single",
                filters: sectionFilters, // Attach filters to this section
            });
        });

        // Add or Replace Conditioning Section
        if (selectedFinish === "Conditioning") {
            const conditioningSection = generateConditioningSection(usedExercises);

            if (closestTime === 75) {
                // Append conditioning as an additional section
                plan.push(conditioningSection);
            } else {
                // Replace the last section with conditioning
                plan[plan.length - 1] = conditioningSection;
            }
        }


        return plan.slice(0, 9);
    };

    const generateConditioningSection = (usedExercises) => {
        // 1) Filter data so only those with duration === 8
        const eightMinuteConditioning = conditioningData.filter(
            (item) => item.duration === 8
        );

        // 2) Fallback: If no eight-minute items, use entire conditioningData
        const sourceData = eightMinuteConditioning.length > 0
            ? eightMinuteConditioning
            : conditioningData;

        // 3) Pick a random from the (filtered or fallback) list
        const randomConditioningWorkout =
            sourceData[Math.floor(Math.random() * sourceData.length)];

        // 4) Select an aerobic type
        const aerobicOptions = ["Bike", "Row", "Ski"];
        const selectedAerobicType = aerobicOptions[Math.floor(Math.random() * aerobicOptions.length)];

        // 5) Map movements
        const movements = randomConditioningWorkout.conditioning_details.map((movement) => {
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

        // 6) Return the structured section
        return {
            partLabel: "Conditioning",
            workoutId: randomConditioningWorkout.id,
            workoutName: randomConditioningWorkout.name,
            notes: randomConditioningWorkout.notes,
            movements,
            sectionType: movements.length > 1 ? "superset" : "single",
            rest: randomConditioningWorkout.rest,
        };
    };



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


    // Generate multiple workout plans
    const generateWorkoutPlans = async () => {
        setIsBouncerLoading(true);

        const candidatePlans = [];
        for (let i = 0; i < 10; i++) {
            const plan = generateWorkoutPlan();
            // plan is either an array of sections or possibly empty
            candidatePlans.push(plan);
        }

        // Filter out any plan that has an empty or missing section
        // i.e. we only keep the plan if every section has movements
        const validPlans = candidatePlans.filter((plan) => {
            if (!plan || !plan.length) return false; // no sections at all => discard

            // Check if ANY section is empty => discard
            return plan.every((section) => section.movements && section.movements.length > 0);
        });




        const equipmentFilter = await AsyncStorage.getItem("activeEquipmentFilter");
        const userEmail = userData.email

        if (validPlans.length === 0 && !didShowNoPlanAlert) {
            Alert.alert(
                "No workout generated",
                "We couldn't find any workouts that satisfy your equipment/filters. Please adjust and try again.",
                [
                    {
                        text: "OK",
                        onPress: () => {
                            navigation.goBack(); // Return user to the previous screen
                        },
                    },
                ]
            );
            setDidShowNoPlanAlert(true);
            try {
                const payload = {
                    selectedWorkout,
                    selectedTime,
                    complexity,
                    selectedFinish,
                    equipmentFilter,
                    candidatePlans,
                    userEmail
                };
                await axios.post(`${ENV.API_URL}/api/movements/no-plan-email/`, payload);
                console.log("No-plan email posted successfully");
            } catch (error) {
                console.warn("Failed to send no-plan email:", error);
            }
            // } else if (validPlans.length > 0) {
            //     try {
            //         const storePayload = {
            //             selectedWorkout,
            //             selectedTime,
            //             complexity,
            //             selectedFinish,
            //             equipmentFilter,
            //             candidatePlans: validPlans, // only store the valid ones
            //             userEmail
            //         };
            //         // Make a POST to your new endpoint
            //         const resp = await axios.post(
            //             `${ENV.API_URL}/api/movement_workout_tracking/store-plans/`,
            //             storePayload
            //         );
            //         console.log("Plans stored successfully:", resp.data);
            //     } catch (error) {
            //         console.warn("Failed to store workout plans:", error);
            //     }
        }
        setWorkoutPlans(validPlans);
        console.log(`Found ${validPlans.length} valid plans (out of 10).`);
        setIsBouncerLoading(false);

    };


    // Fetch data and generate workout plans
    useEffect(() => {
        fetchWorkoutData();
        fetchConditioningData();
        loadFilteredMovements();
        checkIfAnimationSeen();

    }, []);



    // useEffect(() => {
    //     if (filteredWorkoutData.length > 0 && conditioningData.length > 0 && workoutData) {
    //         generateWorkoutPlans();
    //     }
    // }, [filteredWorkoutData, conditioningData, workoutData]);

    useEffect(() => {
        // If we've already generated, skip
        if (hasGeneratedOnce.current) {
            return;
        }

        if (
            filteredWorkoutData.length > 0 &&
            conditioningData.length > 0 &&
            workoutData.length > 0
        ) {
            generateWorkoutPlans();
            hasGeneratedOnce.current = true;
        }
    }, [filteredWorkoutData, conditioningData, workoutData]);

    // if (isLoading) {
    //     return (
    //         <View style={styles.loadingContainer}>
    //             <ActivityIndicator size="large" color="#E87EA1" />
    //             <Text>Loading workout plans...</Text>
    //         </View>
    //     );
    // }



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
                name: `${selectedWorkout}`,
                description: "Custom generated workout",
                duration: selectedTime,
                complexity: frequency === "Rarely" ? 1 : frequency === "Sometimes" ? 2 : 3,
                status: "Started",
                scheduled_date: formattedDate,
                activity_type: 'Gym',
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
                        <Text style={styles.headingText}>Strength workouts</Text>
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
                                                { backgroundColor: Colours.gymColour },
                                            ]}
                                        />
                                        <View style={styles.overviewBox}>
                                            <View style={styles.overviewHeader}>
                                                <View>
                                                    <Text style={styles.workoutTitle}>{selectedWorkout} session</Text>
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
                                                <Text style={styles.workoutSummaryButton}>Strength session</Text>
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
                                                            {section.movements.map((movement, i) => {
                                                                const movementFilter = findConditioningByExercise(movement);
                                                                return (
                                                                    <View key={i} style={styles.movementRow}>
                                                                        <View style={styles.movementLeft}>
                                                                            <Text style={styles.movementValue}>{`${movement.movementOrder}: `}</Text>
                                                                            <Text style={styles.movementDetail}>
                                                                                {movement.detail && movement.detail !== "No detail provided" ? `${movement.detail} ` : ""}
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
                            selectedWorkout={selectedWorkout} // Pass the selected workout name
                            workoutPlan={currentWorkout} // Pass the current workout plan
                            closeModal={closeModal} // Close function for modal
                            frequency={frequency}
                            modalRoute={'Discovery'}
                            workoutType="Gym"
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
        backgroundColor: 'white',
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
        flexDirection: 'row',

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
        padding: 20,
        paddingTop: 0,
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
        color: 'black',
        fontWeight: "500",
        lineHeight: 24,
        // width: '30%',
    },
    movementDetail: {
        fontSize: 16,
        color: 'black', // Example color for movement details
        width: '90%',
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