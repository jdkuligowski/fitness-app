import React, { useState, useEffect, useRef } from "react";
import { useNavigation } from '@react-navigation/native';
import {
    View, Text, StyleSheet, TouchableOpacity, SafeAreaView, FlatList, ActivityIndicator,
    Image, Dimensions, ScrollView, Modal, TouchableWithoutFeedback, Alert
} from "react-native";
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from "@expo/vector-icons/Ionicons";
// import { useWorkout } from "../../../context/WorkoutContext";
import DateTimePicker from "@react-native-community/datetimepicker";
import ENV from '../../../../env'
import { Colours } from "../../components/styles";

const SCREEN_WIDTH = Dimensions.get("window").width;
const ITEM_WIDTH = 20; // Width of each slider item

export default function SavedWorkoutFilters({ filters, setFilters, setIsFilterModalVisible, isFilterModalVisible, workouts, setSavedWorkouts }) {
    const workoutOptions = ['Gym', 'Running', 'Mobility', 'Hiit'];
    const gymOptions = ['Full body', 'Lower body', 'Upper body'];
    const runOptions = ['Intervals', 'Tempo', 'Easy'];
    const mobilityOptions = ['Full body', 'Lower body', 'Upper body'];
    const hiitOptions = ['EMOM', 'AMRAP', 'Tabata', '30/30'];
    const minutesArray = Array.from({ length: 75 }, (_, i) => i); // 0 to 60
    const flatListRef = useRef(null);

    const filterMapping = {
        "Full Body": "Full body Workout",
        "Lower Body": "Lower Body Workout",
        "Upper Body": "Upper Body Workout",
    };

    useEffect(() => {
        if (flatListRef.current) {
          flatListRef.current.scrollToIndex({ 
            index: filters.duration, 
            animated: false 
          });
        }
      }, [filters.duration]);
      

    function getTypeOptions() {
        switch (filters.workout) {
            case 'Gym':
                return gymOptions;
            case 'Running':
                return runOptions;
            case 'Mobility':
                return mobilityOptions;
            case 'Hiit':
                return hiitOptions;
            default:
                return [];
        }
    }


    const applyFilters = () => {
        const filtered = workouts.filter((workout) => {
            // 1) Check activity_type if filters.workout is chosen
            const matchesWorkout = !filters.workout
                || workout.activity_type === filters.workout;

            // 2) Check workout.name if filters.type is chosen
            const matchesType = !filters.type
                || workout.name === filters.type;

            // 3) Compare duration with "more" or "less"
            let matchesDuration = true;
            if (filters.duration && Number.isFinite(filters.duration)) {
                if (filters.durationComparison === 'more') {
                    matchesDuration = workout.duration >= filters.duration;
                } else if (filters.durationComparison === 'less') {
                    matchesDuration = workout.duration <= filters.duration;
                }
            }

            // Combine all
            return matchesWorkout && matchesType && matchesDuration;
        });

        setSavedWorkouts(filtered);
        setIsFilterModalVisible(false);
    };



    return (
        <View style={styles.modalBackdrop}>
            {/* Pressing outside closes modal */}
            <TouchableOpacity
                style={styles.modalBackdrop}
                onPress={() => setIsFilterModalVisible(false)}
            />

            {/* Actual content */}
            <View style={styles.modalContent}>
                {/* HEADER */}
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Workout filter</Text>
                    <Ionicons
                        name="close-circle-outline"
                        color={'black'}
                        size={26}
                        onPress={() => setIsFilterModalVisible(false)}
                        style={{ padding: 10 }}
                    />
                </View>

                {/* TOP SECTION: WORKOUT & WORKOUT TYPE */}
                <View style={styles.topSection}>
                    {/* Left column: Workout */}
                    <View style={styles.leftColumn}>
                        <Text style={styles.filterSectionTitle}>Workout</Text>
                        <View style={styles.line} />
                        {workoutOptions.map((item) => (
                            <TouchableOpacity
                                key={item}
                                style={[
                                    styles.filterOption,
                                    filters.workout === item && styles.selectedFilterOption
                                ]}
                                onPress={() => setFilters((prev) => ({
                                    ...prev,
                                    workout: item,
                                    type: '' // reset type if user changes workout 
                                }))}
                            >
                                <Text
                                    style={[
                                        styles.filterOptionText,
                                        filters.workout === item && styles.selectedFilterText
                                    ]}
                                >
                                    {item}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Right column: Workout Type */}
                    <View style={styles.rightColumn}>
                        <Text style={styles.filterSectionTitle}>Workout type</Text>
                        {/* <View style={styles.line} /> */}
                        {getTypeOptions().map((item) => (
                            <TouchableOpacity
                                key={item}
                                style={[
                                    styles.filterOption,
                                    filters.type === item && styles.selectedFilterOption
                                ]}
                                onPress={() => setFilters((prev) => ({ ...prev, type: item }))}
                            >
                                <Text
                                    style={[
                                        styles.filterOptionText,
                                        filters.type === item && styles.selectedFilterText
                                    ]}
                                >
                                    {item}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* MIDDLE SECTION: DURATION */}
                <View style={styles.durationSection}>
                    <Text style={styles.filterSectionTitle}>Duration</Text>

                    {/* Toggle "More than" or "Less than" */}
                    <View style={styles.toggleRow}>
                        <TouchableOpacity
                            style={[
                                styles.filterOption,
                                filters.durationComparison === 'more' && styles.selectedFilterOption
                            ]}
                            onPress={() => setFilters((prev) => ({ ...prev, durationComparison: 'more' }))}
                        >
                            <Text
                                style={[
                                    styles.filterOptionText,
                                    filters.durationComparison === 'more' && styles.selectedFilterText
                                ]}
                            >
                                More than
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.filterOption,
                                filters.durationComparison === 'less' && styles.selectedFilterOption
                            ]}
                            onPress={() => setFilters((prev) => ({ ...prev, durationComparison: 'less' }))}
                        >
                            <Text
                                style={[
                                    styles.filterOptionText,
                                    filters.durationComparison === 'less' && styles.selectedFilterText
                                ]}
                            >
                                Less than
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.selectedTime}>
                        {filters.duration} <Text style={styles.unitText}>MINS</Text>
                    </Text>
                    <View style={styles.sliderContainer}>


                        <FlatList
                            data={minutesArray}
                            horizontal
                            keyExtractor={(item) => item.toString()}
                            renderItem={({ item }) => (
                                <View style={styles.tickContainer}>
                                    {item % 5 === 0 && (
                                        <Text
                                            style={[
                                                styles.numberText,
                                                filters.duration === item && styles.selectedNumberText
                                            ]}
                                        >
                                            {item}
                                        </Text>
                                    )}
                                    <View
                                        style={[
                                            styles.tick,
                                            filters.duration === item && styles.selectedTick
                                        ]}
                                    />
                                </View>
                            )}
                            contentContainerStyle={styles.slider}
                            showsHorizontalScrollIndicator={false}
                            snapToInterval={20}
                            decelerationRate="fast"
                            onMomentumScrollEnd={(e) => {
                                const index = Math.round(e.nativeEvent.contentOffset.x / 20);
                                setFilters((prev) => ({ ...prev, duration: minutesArray[index] }));
                            }}
                            initialScrollIndex={filters.duration}
                            getItemLayout={(data, index) => ({
                                length: 20,
                                offset: 20 * index,
                                index
                            })}
                        />
                    </View>
                </View>

                {/* BOTTOM: Apply / Reset */}
                <View style={styles.filterActions}>
                    <TouchableOpacity
                        style={styles.resetButton}
                        onPress={() => setFilters({
                            workout: '',
                            type: '',
                            durationComparison: 'more',
                            duration: 10
                        })}
                    >
                        <Ionicons name="refresh" color={'white'} size={20} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
                        <Text style={styles.applyButtonText}>Apply</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    )
};


const styles = StyleSheet.create({
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.3)', // Semi-transparent background
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: 'white',
        padding: 20,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: 10,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
    },
    filterSectionTitle: {
        fontWeight: '600',
        fontSize: 16,
        marginBottom: 10,
    },
    filterLabel: {
        fontSize: 16,
        fontWeight: '600',
        marginVertical: 10,
        marginRight: 20,
    },
    filterContainer: {
        flexWrap: 'wrap',
        flexDirection: 'row',
    },
    filterOption: {
        padding: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#DDD',
        marginRight: 5,
        marginBottom: 10,
        width: 110,
    },
    selectedFilterOption: {
        backgroundColor: Colours.buttonColour,
        borderColor: Colours.buttonColour,
    },
    filterOptionText: {
        fontSize: 14,
        textAlign: 'center',
    },
    selectedFilterText: {
        color: Colours.secondaryColour,
    },
    filterActions: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginVertical: 20,
    },
    resetButton: {
        padding: 15,
        backgroundColor: 'black',
        borderRadius: 30,
        marginRight: 20,
    },
    resetButtonText: {
        fontSize: 14,
        color: '#6B6BF7',
    },
    applyButton: {
        padding: 15,
        backgroundColor: 'black',
        borderRadius: 25,
        width: 200,

    },
    applyButtonText: {
        fontSize: 16,
        fontWeight: 600,
        color: 'white',
        textAlign: 'center',
    },
    modalSubHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    topSection: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    leftColumn: {
        width: '40%',
    },
    rightColumn: {
        width: '60%',
        backgroundColor: 'white',
    },
    toggleRow: {
        flexDirection: 'row',
    },
    selectedTime: {
        fontSize: 30,
        fontWeight: 'bold',
        color: 'black',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
    },
    unitText: {
        fontSize: 16,
        color: '#B0B0B0',
    },
    sliderContainer: {
        padding: 30,
        height: 100,
        backgroundColor: 'white',
        borderRadius: 30,
        marginTop: 10,
        borderTopWidth: 1,
        borderLeftWidth: 1,
        borderBottomWidth: 3,
        borderRightWidth: 3,
        position: 'relative',
        marginBottom: 30,
    },
    slider: {
        paddingHorizontal: '40%',
        alignItems: 'center',
    },
    tickContainer: {
        width: ITEM_WIDTH,
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    numberText: {
        fontSize: 14,
        width: 30,
        color: '#B0B0B0',
        textAlign: 'center',
    },
    selectedNumberText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#E87EA1',
    },
    tick: {
        width: 2,
        height: 20,
        backgroundColor: '#B0B0B0',
    },
    selectedTick: {
        backgroundColor: '#E87EA1',
        height: 20,
    },
    centerIndicator: {
        position: 'absolute',
        top: -10,
        left: '50%',
        transform: [{ translateX: -10 }],
    },
    indicatorArrow: {
        width: 0,
        height: 0,
        borderLeftWidth: 10,
        borderRightWidth: 10,
        borderBottomWidth: 10,
        borderStyle: 'solid',
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderBottomColor: '#E87EA1',
    },
});