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
import SavedWorkoutFilters from '../../modalScreens/SavedWorkoutsFilter';

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
        durationComparison: '',
        duration: 40,
    });
    const minutesArray = Array.from({ length: 75 }, (_, i) => i); // 0 to 60
    const [isFilterModalVisible, setIsFilterModalVisible] = useState(false); // Modal visibility state
    const flatListRef = useRef(null); // Ref for the FlatList
    const [currentWorkout, setCurrentWorkout] = useState(null); // Store the current workout for the modal
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [modalRoute, setModalRoute] = useState('')


    const isSelected = (view) => selectedView === view;

    function parseLocalDate(dateString) {
        // If dateString is missing, return null or some fallback
        if (!dateString) {
            return null;
        }
        const [year, month, day] = dateString.split('-').map(Number);
        return new Date(year, month - 1, day);
    }

    function formatLocalDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }


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
        console.log("Selected Date:", formatLocalDate(date));
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
            const selectedDateString = formatLocalDate(selectedDate);
            const filtered = workouts.filter(
                workout => workout.scheduled_date === selectedDateString
            );
            setDailyWorkouts(filtered);
        };

        filterWorkoutsByDate();
    }, [selectedDate, workouts]);


    /**
    * Filter workouts for the selected week based on the start and end of the week.
    */
    const filterWorkoutsForWeek = () => {
        const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Monday
        const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });

        const filtered = workouts.filter(workout => {
            const workoutDate = parseLocalDate(workout.scheduled_date);  // <-- SHIFTING (UTC)
            return workoutDate >= weekStart && workoutDate <= weekEnd;
        });

        // Sort from earliest to latest
        const sorted = filtered.sort((a, b) => {
            return parseLocalDate(a.scheduled_date) - parseLocalDate(b.scheduled_date);
        });

        setWeeklyWorkouts(sorted);
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
                const isDuplicate = acc.some(savedWorkout => savedWorkout.workout_code === workout.workout_code);
                if (!isDuplicate) {
                    acc.push(workout);
                }
                return acc;
            }, []);

            setSavedWorkouts(uniqueWorkouts);
        }
    }, [selectedView, workouts]);





    const complexityFilterMapping = {
        "Beginner": 1,
        "Intermediate": 2,
        "Advanced": 3,
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
                                {currentMonth.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
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
                                dailyWorkouts.map((item, index) => {
                                    const colorForWorkout =
                                        item.activity_type === 'Gym'
                                            ? Colours.gymColour
                                            : item.activity_type === 'Running'
                                                ? Colours.runningColour
                                                : item.activity_type === 'Mobility'
                                                    ? Colours.mobilityColour
                                                    : item.activity_type === 'Hiit'
                                                        ? Colours.hiitColour
                                                        : item.activity_type === 'Hyrox'
                                                            ? Colours.hyroxColour
                                                            : 'white';

                                    return (
                                        <TouchableOpacity
                                            key={item.id || index}
                                            style={styles.dailyCardOuterContainer}
                                            onPress={() =>
                                                navigation.navigate('TrainingDetails', {
                                                    workoutId: item.id,
                                                    activityType: item.activity_type,
                                                })
                                            }
                                        >
                                            {/* LEFT COLOR STRIP */}
                                            <View style={[styles.dailyColorStrip, { backgroundColor: colorForWorkout }]} />

                                            {/* MAIN CONTENT AREA (white) */}
                                            <View style={styles.dailyCardContent}>
                                                {/* EXACT same child UI as your old “overviewBox” contents, but no longer colored */}
                                                <View style={styles.overviewHeader}>
                                                    <View>
                                                        <Text style={styles.workoutTitle}>{item.name}</Text>
                                                    </View>
                                                    <TouchableOpacity
                                                        style={styles.profileButton}
                                                        onPress={() => showModalForWorkout(item)}
                                                    >
                                                        <Ionicons name="ellipsis-vertical-outline" color={'black'} size={24} />
                                                    </TouchableOpacity>
                                                </View>

                                                <View style={styles.workoutOverviewTime}>
                                                    <Ionicons name="time-outline" size={24} color="black" />
                                                    <Text style={styles.timeText}>{item.duration} mins</Text>
                                                </View>

                                                <View style={styles.workoutSummaryArray}>
                                                    <Text style={styles.workoutSummaryButton}>{item.activity_type}</Text>
                                                    {/* e.g. you could show more tags here */}
                                                </View>

                                                <View style={styles.bottomSection}>
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

                                                    {/* Status boxes (Scheduled / Completed / In progress) */}
                                                    {item.status === "Scheduled" ? (
                                                        <View style={[styles.status, { backgroundColor: 'white', borderWidth: 1, }]}>
                                                            <Ionicons name="play-skip-forward-outline" color={'black'} size={12} />
                                                            <Text style={styles.statusDetail}>Not started</Text>
                                                        </View>
                                                    ) : item.status === "Completed" ? (
                                                        <View style={[styles.status, { backgroundColor: '#B2C93C' }]}>
                                                            <Ionicons name="checkmark-outline" color={'white'} size={14} />
                                                            <Text style={[styles.statusDetail, { color: 'white' }]}>Completed</Text>
                                                        </View>
                                                    ) : (
                                                        <View style={[styles.status, { backgroundColor: '#EFDC73' }]}>
                                                            <Ionicons name="refresh-outline" color={'black'} size={14} />
                                                            <Text style={styles.statusDetail}>In progress</Text>
                                                        </View>
                                                    )}
                                                </View>
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })
                            ) : (
                                <Text style={styles.noWorkouts}>
                                    You don't have any workouts saved for this day yet
                                </Text>
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

                                        {workouts.map((item, index) => {
                                            // Decide color for the left strip
                                            const colorForWorkout =
                                                item.activity_type === 'Gym'
                                                    ? Colours.gymColour
                                                    : item.activity_type === 'Running'
                                                        ? Colours.runningColour
                                                        : item.activity_type === 'Mobility'
                                                            ? Colours.mobilityColour
                                                            : item.activity_type === 'Hiit'
                                                                ? Colours.hiitColour
                                                                : item.activity_type === 'Hyrox'
                                                                    ? Colours.hyroxColour
                                                                    : 'white';

                                            return (
                                                <TouchableOpacity
                                                    key={item.id || index}
                                                    style={styles.dailyCardOuterContainer}
                                                    onPress={() =>
                                                        navigation.navigate('TrainingDetails', {
                                                            workoutId: item.id,
                                                            activityType: item.activity_type,
                                                        })
                                                    }
                                                >
                                                    {/* Left color strip */}
                                                    <View
                                                        style={[styles.dailyColorStrip, { backgroundColor: colorForWorkout }]}
                                                    />

                                                    {/* Main content area (white) */}
                                                    <View style={styles.dailyCardContent}>
                                                        {/* Top row: Title + “options” button */}
                                                        <View style={styles.overviewHeader}>
                                                            <View>
                                                                <Text style={styles.workoutTitle}>{item.name}</Text>
                                                            </View>
                                                            <TouchableOpacity
                                                                style={styles.profileButton}
                                                                onPress={() => showModalForWorkout(item)}
                                                            >
                                                                <Ionicons name="ellipsis-vertical-outline" color="black" size={24} />
                                                            </TouchableOpacity>
                                                        </View>

                                                        {/* Duration row */}
                                                        <View style={styles.workoutOverviewTime}>
                                                            <Ionicons name="time-outline" size={24} color="black" />
                                                            <Text style={styles.timeText}>{item.duration} mins</Text>
                                                        </View>

                                                        {/* Middle row: “activity_type” chip */}
                                                        <View style={styles.workoutSummaryArray}>
                                                            <Text style={styles.workoutSummaryButton}>{item.activity_type}</Text>
                                                        </View>

                                                        {/* Bottom row: trainer info + status */}
                                                        <View style={styles.bottomSection}>
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

                                                            {/* Status boxes (Scheduled / Completed / In progress) */}
                                                            {item.status === 'Scheduled' ? (
                                                                <View style={[styles.status, { backgroundColor: 'white', borderWidth: 1, }]}>
                                                                    <Ionicons name="play-skip-forward-outline" color="black" size={12} />
                                                                    <Text style={styles.statusDetail}>Not started</Text>
                                                                </View>
                                                            ) : item.status === 'Completed' ? (
                                                                <View style={[styles.status, { backgroundColor: '#B2C93C' }]}>
                                                                    <Ionicons name="checkmark-outline" color="white" size={14} />
                                                                    <Text style={[styles.statusDetail, { color: 'white' }]}>
                                                                        Completed
                                                                    </Text>
                                                                </View>
                                                            ) : (
                                                                <View style={[styles.status, { backgroundColor: '#EFDC73' }]}>
                                                                    <Ionicons name="refresh-outline" color="black" size={14} />
                                                                    <Text style={styles.statusDetail}>In progress</Text>
                                                                </View>
                                                            )}
                                                        </View>
                                                    </View>
                                                </TouchableOpacity>
                                            );
                                        })}

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
                                <Ionicons name="filter-outline" size={14} color="white" />
                                <Text style={styles.filterText}>Filter</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.workoutList}>
                            {savedWorkouts.length > 0 ? (

                                savedWorkouts.map((item, index) => {
                                    // Decide the color for the left strip
                                    const colorForWorkout =
                                        item.activity_type === 'Gym'
                                            ? Colours.gymColour
                                            : item.activity_type === 'Running'
                                                ? Colours.runningColour
                                                : item.activity_type === 'Mobility'
                                                    ? Colours.mobilityColour
                                                    : item.activity_type === 'Hiit'
                                                        ? Colours.hiitColour
                                                        : item.activity_type === 'Hyrox'
                                                            ? Colours.hyroxColour
                                                            : 'white';

                                    return (
                                        <TouchableOpacity
                                            key={item.id || index}
                                            style={styles.dailyCardOuterContainer}  // <--- same container style as daily
                                            onPress={() =>
                                                navigation.navigate('TrainingDetails', {
                                                    workoutId: item.id,
                                                    activityType: item.activity_type,
                                                })
                                            }
                                        >
                                            {/* Left color strip */}
                                            <View
                                                style={[styles.dailyColorStrip, { backgroundColor: colorForWorkout }]}
                                            />

                                            {/* White content block */}
                                            <View style={styles.dailyCardContent}>
                                                <View style={styles.overviewHeader}>
                                                    <View>
                                                        <Text style={styles.workoutTitle}>{item.name}</Text>
                                                    </View>
                                                    <TouchableOpacity
                                                        style={styles.profileButton}
                                                        onPress={() => showModalForWorkout(item)}
                                                    >
                                                        <Ionicons name="ellipsis-vertical-outline" color="black" size={24} />
                                                    </TouchableOpacity>
                                                </View>

                                                <View style={styles.workoutOverviewTime}>
                                                    <Ionicons name="time-outline" size={24} color="black" />
                                                    <Text style={styles.timeText}>{item.duration} mins</Text>
                                                </View>

                                                <View style={styles.workoutSummaryArray}>
                                                    <Text style={styles.workoutSummaryButton}>{item.activity_type}</Text>
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
                                    );
                                })

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

                    <SavedWorkoutFilters
                        filters={filters}
                        setFilters={setFilters}
                        setIsFilterModalVisible={setIsFilterModalVisible}
                        isFilterModalVisible={isFilterModalVisible}
                        workouts={workouts}
                        setSavedWorkouts={setSavedWorkouts}
                    />

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
        backgroundColor: Colours.buttonColour,
    },
    activeWeeklyButton: {
        backgroundColor: Colours.buttonColour,
    },
    activeSavedButton: {
        backgroundColor: Colours.buttonColour,
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
        color: 'white', // Active text color
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
        color: "black",
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
        backgroundColor: Colours.buttonColour,
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
        color: "white",
    },


    workoutList: {
        marginLeft: 20,
        marginRight: 20,
        paddingBottom: 100,
    },
    dailyCardOuterContainer: {
        marginBottom: 20,
        width: '100%',
        height: 175,

        borderRadius: 20,
        borderWidth: 1,
        borderRightWidth: 5,
        borderBottomWidth: 5,
        flexDirection: 'row',
        overflow: 'hidden',
    },

    dailyColorStrip: {
        width: 20,
        borderTopLeftRadius: 20,
        borderBottomLeftRadius: 15,
    },

    dailyCardContent: {
        flex: 1,
        backgroundColor: '#FFF',
        padding: 15,
        paddingLeft: 10,
        borderTopRightRadius: 20,
        borderBottomRightRadius: 20,
        justifyContent: 'space-between',
    },


    workoutOverview: {
        marginBottom: 20,
    },
    workoutTitle: {
        fontWeight: 600,
        fontSize: 18,
        // marginBottom: 5
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
    profileButton: {
        width: 50,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
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
    bottomSection: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    status: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        // borderWidth: 1,
        borderRadius: 15,
        paddingVertical: 5,
        paddingHorizontal: 10,
    },
    statusDetail: {
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 5,
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
        backgroundColor: Colours.buttonColour,
        paddingHorizontal: 10,
        paddingVertical: 2,
        borderWidth: 1,
        borderRadius: 5,
    },
    filterText: {
        fontSize: 14,
        marginLeft: 5,
        fontWeight: 500,
        color: Colours.secondaryColour
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