import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, Image, TouchableOpacity, StatusBar, SafeAreaView, Modal,
    TextInput, Keyboard, TouchableWithoutFeedback, ScrollView, Alert, FlatList, Dimensions, RefreshControl
} from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
// import { format, toZonedTime } from 'date-fns-tz'; // Import date-fns and date-fns-tz
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../../context/AuthContext'
import { format, addWeeks, startOfWeek, endOfWeek } from 'date-fns';
import SaveWorkoutModal from '../../modalScreens/SaveWorkoutModal';
import { useLoader } from '@/app/src/context/LoaderContext';
import ENV from '../../../../../env'
import { Colours } from '@/app/src/components/styles';

const SCREEN_WIDTH = Dimensions.get("window").width;


export default function TrainingOverview() {
    const navigation = useNavigation();
    const { setIsBouncerLoading } = useLoader(); // Access loader functions

    const [isLoading, setIsLoading] = useState(false)
    const [selectedView, setSelectedView] = useState('Daily'); // Initialize with 'Daily'
    const [selectedDate, setSelectedDate] = useState(new Date()); // Currently selected date
    const [dates, setDates] = useState([]); // List of dates for the calendar
    const [currentMonth, setCurrentMonth] = useState(new Date()); // Month currently displayed
    const [currentWeek, setCurrentWeek] = useState(new Date()); // Track the start of the current week
    const [workouts, setWorkouts] = useState([]); // All workouts
    const [refreshing, setRefreshing] = useState(false); // State for pull-to-refresh
    const [dailyWorkouts, setDailyWorkouts] = useState([]);
    const [weeklyWorkouts, setWeeklyWorkouts] = useState([]);
    const [savedWorkouts, setSavedWorkouts] = useState([]); // Separate state for saved workouts
    const [filters, setFilters] = useState({
        workout: '',
        type: '',
        level: '',
        time: null
    });
    const workoutOptions = ['Gym session', 'Running', 'Mobility'];
    // const workoutOptions = ['Gym session', 'Running', 'Rowing', 'Mobility', 'Bodyweight'];
    const typeOptions = ['Full body', 'Lower body', 'Upper body'];
    // const levelOptions = ['Beginner', 'Intermediate', 'Advanced'];
    const [isFilterModalVisible, setIsFilterModalVisible] = useState(false); // Modal visibility state
    const flatListRef = useRef(null); // Ref for the FlatList
    const [currentWorkout, setCurrentWorkout] = useState(null); // Store the current workout for the modal
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [modalRoute, setModalRoute] = useState('')


    const isSelected = (view) => selectedView === view;


    useEffect(() => {
        // Find the index of the current date
        const today = new Date();
        const currentIndex = dates.findIndex(
            (date) => new Date(date).toDateString() === today.toDateString()
        );

        // Scroll to the current date index when the component mounts
        if (currentIndex !== -1 && flatListRef.current) {
            setTimeout(() => {
                flatListRef.current.scrollToIndex({ index: currentIndex, animated: true });
            }, 100);
        }
    }, [dates]);


    // Generate an array of dates based on the current month
    useEffect(() => {
        const generateDatesForMonth = () => {
            const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
            const lastDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
            const datesArray = [];
            for (let day = firstDayOfMonth; day <= lastDayOfMonth; day.setDate(day.getDate() + 1)) {
                datesArray.push(new Date(day));
            }
            setDates(datesArray);
        };
        generateDatesForMonth();
    }, [currentMonth]);

    // Change the displayed month (Previous or Next)
    const changeMonth = (direction) => {
        const newMonth = new Date(currentMonth);
        newMonth.setMonth(currentMonth.getMonth() + (direction === "next" ? 1 : -1));
        setCurrentMonth(newMonth);
    };

    // Handle date selection
    const onDateSelect = (date) => {
        setSelectedDate(date);
        console.log("Selected Date:", date.toISOString().split("T")[0]); // ISO format (YYYY-MM-DD)
    };

    // Render a single date item
    const renderDateItem = ({ item }) => {
        const isSelected = selectedDate.toDateString() === item.toDateString();
        return (
            <TouchableOpacity
                style={[styles.dateItem, isSelected && styles.selectedDate]}
                onPress={() => onDateSelect(item)}
            >
                <Text style={[styles.dateText, isSelected && styles.selectedDateText]}>
                    {item.getDate()}
                </Text>
                <Text style={[styles.dayText, isSelected && styles.selectedDateText]}>
                    {item.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase()}
                </Text>
            </TouchableOpacity>
        );
    };

    // Fetch all workouts

    const fetchWorkouts = async () => {
        setRefreshing(true);
        try {
            const userId = await AsyncStorage.getItem('userId');
            const response = await axios.get(`${ENV.API_URL}/api/saved_workouts/get-all-workouts/`, {
                params: { user_id: userId }
            });
            setWorkouts(response.data);
            setRefreshing(false)
        } catch (error) {
            console.error('Error fetching workouts:', error.message);
        }
    };


    // Handle refresh logic
    const onRefresh = () => {
        fetchWorkouts();
    };

    // Simulate initial data fetch
    useEffect(() => {
        fetchWorkouts();
    }, []);

    // Re-filter workouts whenever the current week changes or when workouts are updated
    useEffect(() => {
        filterWorkoutsForWeek();
    }, [currentWeek, workouts]);



    // Update filtered workouts when the selected date changes
    useEffect(() => {
        const filterWorkoutsByDate = () => {
            const selectedDateString = selectedDate.toISOString().split('T')[0]; // Format: YYYY-MM-DD
            const filtered = workouts.filter(workout => workout.scheduled_date === selectedDateString);
            setDailyWorkouts(filtered);
        };

        filterWorkoutsByDate();
    }, [selectedDate, workouts]);


    /**
    * Filter workouts for the selected week based on the start and end of the week.
    */
    const filterWorkoutsForWeek = () => {
        const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Week starts on Monday
        const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });

        const filtered = workouts.filter(workout => {
            const workoutDate = new Date(workout.scheduled_date);
            return workoutDate >= weekStart && workoutDate <= weekEnd;
        });
        setWeeklyWorkouts(filtered);
    };

    /**
     * Move to the previous or next week.
     * @param {string} direction - "prev" or "next"
     */
    const changeWeek = (direction) => {
        const newWeek = direction === 'prev' ? addWeeks(currentWeek, -1) : addWeeks(currentWeek, 1);
        setCurrentWeek(newWeek);
    };


    const groupedWorkouts = weeklyWorkouts.reduce((acc, workout) => {
        const date = workout.scheduled_date; // Format: YYYY-MM-DD
        if (!acc[date]) acc[date] = [];
        acc[date].push(workout);
        return acc;
    }, {});


    useEffect(() => {
        if (selectedView === 'Saved') {
            // Filter from all workouts to ensure unique workout IDs
            const uniqueWorkouts = workouts.reduce((acc, workout) => {
                const isDuplicate = acc.some(savedWorkout => savedWorkout.workout_number === workout.workout_number);
                if (!isDuplicate) {
                    acc.push(workout);
                }
                return acc;
            }, []);

            setSavedWorkouts(uniqueWorkouts);
        }
    }, [selectedView, workouts]);



    const filterMapping = {
        "Full Body": "Full body Workout",
        "Lower Body": "Lower Body Workout",
        "Upper Body": "Upper Body Workout",
    };

    const complexityFilterMapping = {
        "Beginner": 1,
        "Intermediate": 2,
        "Advanced": 3,
    };

    const applyFilters = () => {
        const filtered = workouts.filter(workout => {
            const selectedFilterName = filterMapping[filters.type]; // Map filter to actual workout name
            const selectedFilterComplexity = complexityFilterMapping[filters.level]; // Map filter to actual workout name
            const matchesType = !filters.type || workout.name === selectedFilterName;
            const matchesComplexity = !filters.level || workout.complexity === selectedFilterComplexity;

            return matchesType && matchesComplexity;
        });

        setSavedWorkouts(filtered);
        setIsFilterModalVisible(false); // Close modal after applying filters
    };

    useEffect(() => {
        if (flatListRef.current) {
            const today = new Date();
            const index = dates.findIndex(date => date.toDateString() === today.toDateString());
            if (index !== -1) {
                setTimeout(() => {
                    flatListRef.current.scrollToIndex({ index, animated: true });
                }, 100);
            }
        }
    }, [dates]);

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <Image
                    source={require('../../../../../assets/images/bouncing-ball-loader-white.gif')} // Make sure this path is correct
                    style={styles.loadingImage}
                />
            </View>
        );
    }


    const showModalForWorkout = (workout) => {
        setCurrentWorkout(workout); // Set the workout plan that will be used inside the modal
    };


    const closeModal = () => {
        setCurrentWorkout(null); // Reset the current workout when modal is closed
        setShowDatePicker(false);
        fetchWorkouts()
    };



    const getItemLayout = (data, index) => ({
        length: 70, // Width of each item
        offset: 70 * index, // Total width of items before this one
        index,
    });

    /**
     * Handles failures when attempting to scroll to an index (e.g., if the list hasn't rendered yet).
     */
    const onScrollToIndexFailed = (info) => {
        console.warn('Failed to scroll to index:', info.index);
        setTimeout(() => {
            flatListRef.current?.scrollToIndex({ index: info.index, animated: true });
        }, 100);
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor="#F6F3DC" />
            <ScrollView contentContainerStyle={styles.container}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }>
                <View style={styles.trainingViewBlock}>
                    <View style={styles.trainingViewSelect}>
                        <TouchableOpacity
                            style={[
                                styles.button,
                                isSelected('Daily') ? styles.activeDailyButton : styles.inactiveButton,
                            ]}
                            onPress={() => setSelectedView('Daily')}>
                            <Text
                                style={[
                                    styles.buttonText,
                                    isSelected('Daily') ? styles.activeText : styles.inactiveText,
                                ]}>Daily
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.button,
                                isSelected('Weekly') ? styles.activeWeeklyButton : styles.inactiveButton,
                            ]}
                            onPress={() => setSelectedView('Weekly')}>
                            <Text
                                style={[
                                    styles.buttonText,
                                    isSelected('Weekly') ? styles.activeText : styles.inactiveText,
                                ]}>Weekly
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.button,
                                isSelected('Saved') ? styles.activeSavedButton : styles.inactiveButton,
                            ]}
                            onPress={() => setSelectedView('Saved')}>
                            <Text
                                style={[
                                    styles.buttonText,
                                    isSelected('Saved') ? styles.activeText : styles.inactiveText,
                                ]}>Saved
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
                {selectedView === 'Daily' && (
                    <>
                        <View style={styles.monthNavigation}>
                            <TouchableOpacity onPress={() => changeMonth("prev")} style={styles.monthChange}>
                                <Text style={styles.navButton}>{"<"}</Text>
                            </TouchableOpacity>
                            <Text style={styles.monthText}>
                                {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                            </Text>
                            <TouchableOpacity onPress={() => changeMonth("next")} style={styles.monthChange}>
                                <Text style={styles.navButton}>{">"}</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.calendarContainer}>
                            <FlatList
                                data={dates}
                                ref={flatListRef}
                                horizontal
                                keyExtractor={(item) => item.toISOString()}
                                renderItem={renderDateItem}
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.calendarContent}
                                getItemLayout={getItemLayout}
                                onScrollToIndexFailed={onScrollToIndexFailed}
                            />
                        </View>
                        <View style={styles.workoutList}>
                            {dailyWorkouts.length > 0 ? (
                                dailyWorkouts.map((item, index) => (
                                    <TouchableOpacity
                                        key={item.id || index}
                                        style={styles.workoutOverview}
                                        onPress={() =>
                                            navigation.navigate('TrainingDetails', { workoutId: item.id, activityType: item.activity_type })
                                        }
                                    >
                                        <View
                                            style={[
                                                styles.overviewBox,
                                                {
                                                    backgroundColor:
                                                        item.activity_type === 'Gym'
                                                            ? '#EFE8FF'
                                                            : item.activity_type === 'Running'
                                                                ? '#D2E4EA'
                                                                : item.activity_type === 'Mobility'
                                                                    ? '#FFDDDE'
                                                                    : item.activity_type === 'Hiit'
                                                                        ? '#FFFFEF'
                                                                        : 'black'
                                                },
                                            ]}
                                        >
                                            <View style={styles.overviewHeader}>
                                                <View>
                                                    <Text style={styles.workoutTitle}>{item.name}</Text>
                                                    <View style={styles.workoutOverviewTime}>
                                                        <Ionicons name="time-outline" size={24} color="black" />
                                                        <Text style={styles.timeText}>{item.duration} mins</Text>
                                                    </View>
                                                </View>
                                                <TouchableOpacity
                                                    style={styles.profileButton}
                                                    onPress={() => showModalForWorkout(item)}
                                                >
                                                    <Ionicons name="heart" color={'#B8373B'} size={20} />
                                                </TouchableOpacity>
                                            </View>
                                            <View style={styles.workoutSummaryArray}>
                                                {/* <Text style={styles.workoutSummaryButton}>Intermediate</Text> */}
                                                <Text style={styles.workoutSummaryButton}>{item.activity_type}</Text>
                                                {/* <Text style={styles.workoutSummaryButton}> sections</Text> */}
                                            </View>
                                            <View style={styles.trainerDetails}>
                                                <Image
                                                    style={styles.trainerImage}
                                                    source={require('../../../../../assets/images/gus_image.jpeg')} />
                                                <View style={styles.trainerDetailsBox}>
                                                    <Text style={styles.trainerName}>Gus Barton</Text>
                                                    <Text style={styles.trainerTitle}>Head Trainer at Burst</Text>
                                                </View>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                ))
                            ) : (
                                <Text style={styles.noWorkouts}>You don&apos;t have any workouts saved for this day yet</Text>
                            )}
                        </View>
                    </>
                )}
                {selectedView === 'Weekly' && (
                    <>
                        <View style={styles.monthNavigation}>
                            <TouchableOpacity onPress={() => changeWeek('prev')} style={styles.monthChange}>
                                <Text style={styles.navButton}>{'<'}</Text>
                            </TouchableOpacity>
                            <Text style={styles.monthText}>
                                {format(startOfWeek(currentWeek, { weekStartsOn: 1 }), 'MMM d')}
                                {' - '}
                                {format(endOfWeek(currentWeek, { weekStartsOn: 1 }), 'MMM d')}
                            </Text>
                            <TouchableOpacity onPress={() => changeWeek('next')} style={styles.monthChange}>
                                <Text style={styles.navButton}>{'>'}</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.workoutList}>
                            {groupedWorkouts && Object.keys(groupedWorkouts).length > 0 ? (
                                Object.entries(groupedWorkouts).map(([date, workouts]) => (
                                    <View key={date}>
                                        <View style={styles.dayHeadingContainer}>
                                            <Text style={styles.dayHeading}>
                                                {new Date(date).toLocaleDateString("en-US", { weekday: 'long', month: 'short', day: 'numeric' })}
                                            </Text>
                                            <View style={styles.line} />
                                        </View>

                                        {workouts.map((item, index) => (
                                            <TouchableOpacity
                                                key={item.id || index}
                                                style={styles.workoutOverview}
                                                onPress={() =>
                                                    navigation.navigate('TrainingDetails', { workoutId: item.id, activityType: item.activity_type })
                                                }
                                            >
                                                <View
                                                    style={[
                                                        styles.overviewBox,
                                                        {
                                                            backgroundColor:
                                                                item.activity_type === 'Gym'
                                                                    ? '#EFE8FF'
                                                                    : item.activity_type === 'Running'
                                                                        ? '#D2E4EA'
                                                                        : item.activity_type === 'Mobility'
                                                                            ? '#FFDDDE'
                                                                            : item.activity_type === 'Hiit'
                                                                                ? '#FFFFEF'
                                                                                : 'black'
                                                        },
                                                    ]}
                                                >
                                                    <View style={styles.overviewHeader}>
                                                        <View>
                                                            <Text style={styles.workoutTitle}>{item.name}</Text>
                                                            <View style={styles.workoutOverviewTime}>
                                                                <Ionicons name="time-outline" size={24} color="black" />
                                                                <Text style={styles.timeText}>{item.duration} mins</Text>
                                                            </View>
                                                        </View>
                                                        <TouchableOpacity
                                                            style={styles.profileButton}
                                                            onPress={() => showModalForWorkout(item)}
                                                        >
                                                            <Ionicons name="heart" color={'#B8373B'} size={20} />
                                                        </TouchableOpacity>
                                                    </View>
                                                    <View style={styles.workoutSummaryArray}>
                                                        {/* <Text style={styles.workoutSummaryButton}>Intermediate</Text> */}
                                                        <Text style={styles.workoutSummaryButton}>{item.activity_type}</Text>
                                                        {/* <Text style={styles.workoutSummaryButton}> sections</Text> */}
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
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                ))
                            ) : (
                                <Text style={styles.noWorkouts}>You don&apos;t have any workouts saved for this week yet</Text>
                            )}
                        </View>
                    </>
                )}

                {selectedView === 'Saved' && (
                    <>
                        <View style={styles.savedHeader}>
                            <Text style={styles.savedNumber}>{savedWorkouts ? savedWorkouts.length : ''} saved workouts</Text>
                            <TouchableOpacity
                                style={styles.filterButton}
                                onPress={() => setIsFilterModalVisible(true)}
                            >
                                <Ionicons name="filter-outline" size={14} color="black" />
                                <Text style={styles.filterText}>Filter</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.workoutList}>
                            {savedWorkouts.length > 0 ? (
                                savedWorkouts.map((item, index) => (
                                    <TouchableOpacity
                                        key={item.id || index}
                                        style={styles.workoutOverview}
                                        onPress={() =>
                                            navigation.navigate('TrainingDetails', { workoutId: item.id, activityType: item.activity_type })
                                        }
                                    >
                                        <View
                                            style={[
                                                styles.overviewBox,
                                                {
                                                    backgroundColor:
                                                        item.activity_type === 'Gym'
                                                            ? '#EFE8FF'
                                                            : item.activity_type === 'Running'
                                                                ? '#D2E4EA'
                                                                : item.activity_type === 'Mobility'
                                                                    ? '#FFDDDE'
                                                                    : item.activity_type === 'Hiit'
                                                                        ? '#FFFFEF'
                                                                        : 'black'
                                                },
                                            ]}
                                        >
                                            <View style={styles.overviewHeader}>
                                                <View>
                                                    <Text style={styles.workoutTitle}>{item.name}</Text>
                                                    <View style={styles.workoutOverviewTime}>
                                                        <Ionicons name="time-outline" size={24} color="black" />
                                                        <Text style={styles.timeText}>{item.duration} mins</Text>
                                                    </View>
                                                </View>
                                                <TouchableOpacity
                                                    style={styles.profileButton}
                                                    onPress={() => showModalForWorkout(item)}
                                                >
                                                    <Ionicons name="heart" color={'#B8373B'} size={20} />
                                                </TouchableOpacity>
                                            </View>
                                            <View style={styles.workoutSummaryArray}>
                                                {/* <Text style={styles.workoutSummaryButton}>Intermediate</Text> */}
                                                <Text style={styles.workoutSummaryButton}>{item.activity_type}</Text>
                                                {/* <Text style={styles.workoutSummaryButton}> sections</Text> */}
                                            </View>
                                            <View style={styles.trainerDetails}>
                                                <Image
                                                    style={styles.trainerImage}
                                                    source={require('../../../../../assets/images/gus_image.jpeg')} />
                                                <View style={styles.trainerDetailsBox}>
                                                    <Text style={styles.trainerName}>Gus Barton</Text>
                                                    <Text style={styles.trainerTitle}>Head Trainer at Burst</Text>
                                                </View>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                ))
                            ) : (
                                <Text style={styles.noWorkouts}>You don&apos;t have any workouts saved for yet</Text>
                            )}
                        </View>
                    </>
                )}
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={isFilterModalVisible}
                    onRequestClose={() => setIsFilterModalVisible(false)}
                >
                    <View style={styles.modalBackdrop}>
                        <TouchableOpacity style={styles.modalBackdrop} onPress={() => setIsFilterModalVisible(false)} />
                        <View style={styles.modalContent}>
                            {/* <ScrollView> */}
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Filter</Text>
                                <Ionicons name="close-outline" color={'black'} size={26} onPress={() => setIsFilterModalVisible(false)} style={{ padding: 10 }} />
                            </View>
                            {/* Workout Filters */}
                            <View style={styles.modalSubHeader}>
                                <Text style={styles.filterLabel}>Workout</Text>
                                <View style={styles.line} />
                            </View>
                            <View style={styles.filterContainer}>
                                {workoutOptions.map((item) => (
                                    <TouchableOpacity
                                        key={item}
                                        style={[
                                            styles.filterOption,
                                            filters.workout === item && styles.selectedFilterOption
                                        ]}
                                        onPress={() => setFilters((prev) => ({ ...prev, workout: item }))}
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

                            {/* Workout Type Filters */}
                            <View style={styles.modalSubHeader}>
                                <Text style={styles.filterLabel}>Workout type</Text>
                                <View style={styles.line} />
                            </View>
                            <View style={styles.filterContainer}>
                                {typeOptions.map((item) => (
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

                            {/* Level Filters */}
                            {/* <View style={styles.modalSubHeader}>
                                <Text style={styles.filterLabel}>Level</Text>
                                <View style={styles.line} />
                            </View>
                            <View style={styles.filterContainer}>
                                {levelOptions.map((item) => (
                                    <TouchableOpacity
                                        key={item}
                                        style={[
                                            styles.filterOption,
                                            filters.level === item && styles.selectedFilterOption
                                        ]}
                                        onPress={() => setFilters((prev) => ({ ...prev, level: item }))}
                                    >
                                        <Text
                                            style={[
                                                styles.filterOptionText,
                                                filters.level === item && styles.selectedFilterText
                                            ]}
                                        >
                                            {item}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View> */}


                            {/* Apply Filters Button */}
                            <View style={styles.filterActions}>
                                <TouchableOpacity
                                    style={styles.resetButton}
                                    onPress={() =>
                                        setFilters({ workout: '', type: '', level: '', time: null })
                                    }
                                >
                                    <Ionicons name="refresh" color={'white'} size={20} />
                                    {/* <Text style={styles.resetButtonText}>Reset</Text> */}
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
                                    <Text style={styles.applyButtonText}>Apply</Text>
                                </TouchableOpacity>
                            </View>
                            {/* </ScrollView> */}
                        </View>
                    </View>
                </Modal>

                {/* Modal for resaving the workout */}
                {currentWorkout && (
                    <Modal
                        animationType="slide"
                        transparent={true}
                        visible={!!currentWorkout}
                        onRequestClose={closeModal}
                    >
                        <TouchableWithoutFeedback onPress={closeModal}>
                            <SaveWorkoutModal
                                currentWorkout={currentWorkout} // Pass the workout object
                                setCurrentWorkout={setCurrentWorkout}
                                onClose={closeModal} // Pass the close function
                                selectedTime={currentWorkout.duration} // Pass the selected time
                                selectedWorkout={currentWorkout.name} // Pass the selected workout name
                                workoutPlan={currentWorkout} // Pass the current workout plan
                                closeModal={closeModal} // Close function for modal
                                frequency={'Sometimes'}
                                modalRoute={'Resave'}
                                fetchWorkouts={fetchWorkouts}
                                // isLoading={isLoading}
                                setIsBouncerLoading={setIsBouncerLoading}

                            />
                        </TouchableWithoutFeedback>
                    </Modal>
                )}

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Colours.primaryBackground,
    },
    container: {
        flexGrow: 1,
        backgroundColor: Colours.primaryBackground,
        // paddingBottom: 100,
    },
    trainingViewBlock: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 20,
    },
    trainingViewSelect: {
        borderWidth: 1,
        borderColor: '#BBBBCB',
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '80%',
        padding: 7.5,
        borderRadius: 15,
        backgroundColor: 'white',
    },
    button: {
        width: '30%',
        textAlign: 'center',
        padding: 10,
        borderRadius: 10,
    },
    activeDailyButton: {
        backgroundColor: '#DFD7F3', // Daily active color
    },
    activeWeeklyButton: {
        backgroundColor: '#D6F7F4', // Weekly active color
    },
    activeSavedButton: {
        backgroundColor: '#FFF4F4', // Saved active color
    },
    inactiveButton: {
        backgroundColor: 'white', // Inactive button background color
    },
    buttonText: {
        fontWeight: '500',
        fontSize: 14,
        color: 'black',
        textAlign: 'center',
    },
    activeText: {
        color: 'black', // Active text color
    },
    inactiveText: {
        color: '#8E8E8E', // Inactive text color
    },
    // Month Navigation
    monthNavigation: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        // marginBottom: 20,
    },
    navButton: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#6B6BF7",
    },
    monthText: {
        fontSize: 16,
        fontWeight: "bold",
        color: "black",
        margin: 20,
    },
    monthChange: {
        padding: 10,
    },

    calendarContainer: {
        marginBottom: 20,
        marginLeft: 20,
    },
    calendarContent: {
        alignItems: "center",
    },
    dateItem: {
        alignItems: "center",
        justifyContent: "center",
        padding: 10,
        marginHorizontal: 5,
        borderRadius: 10,
        backgroundColor: "white",
        borderWidth: 1,
        borderColor: "#DDD",
        width: 60,
    },
    selectedDate: {
        backgroundColor: "#FFE0E1",
        borderColor: 'black',
        // backgroundColor: "#FFE0E1",
        // borderRightColor: "black",
        // borderBottomColor: "black",
        borderRightWidth: 2,
        borderBottomWidth: 2,
    },
    dateText: {
        fontSize: 18,
        fontWeight: "bold",
        color: "black",
    },
    dayText: {
        fontSize: 12,
        color: "#888",
    },
    selectedDateText: {
        color: "black",
    },
    workoutList: {
        marginLeft: 20,
        marginRight: 20,
        paddingBottom: 100,
    },
    workoutOverview: {
        marginBottom: 20,
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
    overviewBox: {
        width: '100%',
        padding: 15,
        backgroundColor: '#EFE8FF',
        borderRadius: 20,
        justifyContent: 'space-between',
        height: 175,
        borderWidth: 1,
        borderRightWidth: 5,
        borderBottomWidth: 5,
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
    noWorkouts: {
        paddingLeft: 20,
    },
    dayHeadingContainer: {
        flexDirection: 'row', // Row layout
        alignItems: 'center', // Center content vertically
        marginVertical: 10, // Add spacing above and below the heading
    },
    dayHeading: {
        fontSize: 14,
        fontWeight: 500,
        color: 'rgba(0,0,0,0.7)',
        marginRight: 10, // Space between the text and the line
    },
    line: {
        flex: 1, // Take up remaining space
        height: 1, // Thickness of the line
        backgroundColor: 'rgba(0,0,0,0.1)',
    },
    savedHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginLeft: 20,
        marginRight: 20,
        marginVertical: 20,
    },
    savedNumber: {
        fontWeight: 700,
    },
    filterButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F5EAB7',
        paddingHorizontal: 10,
        paddingVertical: 2,
        borderWidth: 1,
        borderRadius: 5,
    },
    filterText: {
        fontSize: 14,
        marginLeft: 5,
        fontWeight: 500,
    },
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
        fontSize: 18,
        fontWeight: 'bold',
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
        backgroundColor: 'white',
        borderColor: '#6B6BF7',
    },
    filterOptionText: {
        fontSize: 14,
        textAlign: 'center',
    },
    selectedFilterText: {
        color: '#6B6BF7',
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
    loadingContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        zIndex: 9999,
        justifyContent: 'center',
        alignItems: 'center',
        // // position: 'absolute',
        // width: '100%',
        // height: '100%',
        ...StyleSheet.absoluteFillObject, // Ensures it takes up the ENTIRE SCREEN

    },
    loadingImage: {
        width: 100,
        height: 100,
    },
});