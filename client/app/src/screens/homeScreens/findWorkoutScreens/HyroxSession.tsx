import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, FlatList, Dimensions, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Slider from '@react-native-community/slider';
import { Colours } from '@/app/src/components/styles';
import EquipmentFilterModal from '../../modalScreens/GymEquipmentFilter';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ENV from '../../../../../env';
import ViewFilterModal from '../../modalScreens/ViewGymFilters';
import axios from 'axios';
import HyroxDivisionInfoModal from '../../modalScreens/InfoModals/HyroxWeightsInfo';
const SLIDER_WIDTH = Dimensions.get('window').width;
const ITEM_WIDTH = 20; // Width of each slider item


export default function HyroxSession({ route }) {
    const { userData } = route.params || {}; // Retrieve userData safely
    const navigation = useNavigation();
    const [selectedWorkout, setSelectedWorkout] = useState(null);
    const [selectedFinish, setSelectedFinish] = useState(null);
    const [selectedValue, setSelectedValue] = useState(50); // Default selected value
    const data = Array.from({ length: 63 }, (_, i) => i); // Minutes from 0 to 60
    const flatListRef = useRef(null); // Reference to FlatList
    const [equipmentModalVisible, setEquipmentModalVisible] = useState(false);
    const [activeFilterSet, setActiveFilterSet] = useState(null);
    const [complexity, setComplexity] = useState("Advanced");
    const [allFilters, setAllFilters] = useState([]);  // <-- to store all user filters
    const [viewFilterModalVisible, setViewFilterModalVisible] = useState(false);
    const [filterToView, setFilterToView] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [filterToEdit, setFilterToEdit] = useState(null);
    const [division, setDivision] = useState(null);
    const [originalDivision, setOriginalDivision] = useState(""); // what the user had in DB
    const [infoModalVisible, setInfoModalVisible] = useState(false);

    useEffect(() => {
        if (userData) {

            // If they already have a division saved, set it; else blank
            if (userData.hyrox_division) {
                setDivision(userData.hyrox_division);
                setOriginalDivision(userData.hyrox_division);
            } else {
                setDivision(null);
                setOriginalDivision("");
            }
        }
    }, [userData]);

    // Then in your useEffect:
    useEffect(() => {
        if (flatListRef.current) {
            const idx = data.findIndex((item) => item === selectedValue);
            // If found, scroll to that index
            if (idx !== -1) {
                flatListRef.current.scrollToIndex({ index: idx, animated: true });
            }
        }
    }, [selectedValue]);

    const handleSaveDivision = async () => {
        try {
            // 1) Grab the userId & token
            const userId = await AsyncStorage.getItem('userId');
            const token = await AsyncStorage.getItem('token');

            // 2) Make sure we have them
            if (!userId || !token) {
                console.log("No userId or token found");
                return;
            }

            // 3) Build the URL
            const url = `${ENV.API_URL}/api/auth/update-hyrox/${userId}/`;

            // 4) Make the PUT request
            const response = await axios.put(
                url,
                {
                    hyrox_division: division, // or other fields
                },
                // {
                //   headers: {
                //     'Authorization': `Bearer ${token}`,
                //     'Content-Type': 'application/json',
                //   },
                // }
            );

            // 5) On success, handle response
            //   Alert.alert('Success', 'Hyrox division updated successfully!');
        } catch (error) {
            console.error('Error updating hyrox division:', error);
            Alert.alert('Error', 'An error occurred while updating your hyrox division. Please try again.');
        }
    };


    const handleFindWorkout = async () => {
        // Save the division if changed, then navigate
        await handleSaveDivision();
        navigation.navigate("HyroxSessionDetails", {
            selectedTime: selectedValue,
            selectedFinish,
            division,
            complexity,
        });
    };


    const renderItem = ({ item, index }) => (
        <View style={styles.tickContainer}>
            {/* Show numbers above ticks for increments of 5 */}
            {item % 5 === 0 && (
                <Text style={[styles.numberText, selectedValue === item && styles.selectedNumberText]}>
                    {item}
                </Text>
            )}
            <View style={[styles.tick, selectedValue === item && styles.selectedTick]} />
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.scrollContainer}>

                <View style={styles.header}>
                    <View style={styles.topSection}>
                        <View style={styles.leftSection}>

                            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                                <Ionicons name="arrow-back" size={24} color="white" />
                            </TouchableOpacity>
                            <Text style={styles.workoutTitle}>Find a hyrox workout</Text>
                        </View>

                        <TouchableOpacity style={styles.profileButton}>
                            <Ionicons name="notifications-outline" color={'black'} size={20} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Options */}
                <View style={styles.workoutInfo}>
                    <View style={styles.workoutInfoDetails}>
                        <Text style={styles.workoutSubtitle}>Do you want to do pure conditioning or a mixture of strength and conditioning?</Text>
                        <View style={styles.workoutType}>
                            {['Both', 'Conditioning'].map((option, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[
                                        styles.optionButton,
                                        selectedFinish === option && styles.selectedOption,
                                    ]}
                                    onPress={() => setSelectedFinish(option)}
                                >
                                    <View style={[
                                        styles.optionText,
                                        selectedFinish === option && styles.selectedOptionText,
                                    ]}
                                    ></View>
                                    <Text>{option}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                    </View>
                    <View style={styles.workoutInfoDetails}>
                        <Text style={styles.workoutSubtitle}>How long do you have?</Text>
                        <Text style={styles.selectedTime}>
                            {selectedValue} <Text style={styles.unitText}>MINS</Text>
                        </Text>

                        {/* Slider */}
                        <View style={styles.sliderContainer}>
                            {/* Center Indicator */}

                            <FlatList
                                data={data}
                                horizontal
                                keyExtractor={(item) => item.toString()}
                                renderItem={renderItem}
                                contentContainerStyle={styles.slider}
                                showsHorizontalScrollIndicator={false}
                                snapToInterval={ITEM_WIDTH}
                                decelerationRate="fast"
                                onScroll={(e) => {
                                    const index = Math.round(e.nativeEvent.contentOffset.x / ITEM_WIDTH);
                                    setSelectedValue(data[index]);
                                }}
                                initialScrollIndex={selectedValue}
                                getItemLayout={(data, index) => ({
                                    length: ITEM_WIDTH,
                                    offset: ITEM_WIDTH * index,
                                    index,
                                })}
                            />
                        </View>
                    </View>


                    <View style={styles.workoutInfoDetails}>
                        <Text style={styles.workoutSubtitle}>Choose your movement difficulty</Text>
                        <View style={styles.workoutType}>
                            {['Simple movements', 'All movements'].map((option, index) => {
                                // Decide which DB value we’ll set
                                const newComplexity = (option === 'Simple movements')
                                    ? 'Intermediate'
                                    : 'Advanced';

                                // Check if this button is “selected”
                                const isSelected = (complexity === newComplexity);

                                return (
                                    <TouchableOpacity
                                        key={index}
                                        style={[
                                            styles.optionButton,
                                            isSelected && styles.selectedOption,
                                        ]}
                                        onPress={() => setComplexity(newComplexity)}
                                    >
                                        {/* Circle indicator */}
                                        <View
                                            style={[
                                                styles.optionText,          // your base circle style
                                                isSelected && styles.selectedOptionText, // highlight circle when selected
                                            ]}
                                        />

                                        {/* Label */}
                                        <Text style={styles.movementDifficulty}>
                                            {option}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                    <View style={styles.workoutInfoDetails}>
                        <View style={styles.sessionBlock}>
                            <Text style={styles.workoutSubtitle}>What division are you in?</Text>
                            <Ionicons name="information-circle-outline" size={24} color="black" style={{ marginBottom: 10 }} onPress={() => setInfoModalVisible(true)} />
                        </View>
                        {/* <Text style={styles.workoutSubtitle}>What division are you in?</Text> */}
                        <View style={styles.workoutType}>
                            {["Women's", "Women's Pro", "Men's", "Men's Pro"].map((option, index) => {
                                // Check if this button is selected
                                const isSelected = (division === option);

                                return (
                                    <TouchableOpacity
                                        key={index}
                                        style={[styles.optionButton, isSelected && styles.selectedOption]}
                                        onPress={() => setDivision(option)}
                                    >
                                        {/* Circle indicator */}
                                        <View
                                            style={[
                                                styles.optionText,
                                                isSelected && styles.selectedOptionText,
                                            ]}
                                        />

                                        {/* Label */}
                                        <Text style={styles.movementDifficulty}>
                                            {option}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>


                    {selectedFinish && division ? (
                        <View style={styles.buttonContainer}>
                            <TouchableOpacity
                                style={styles.submitButton}
                                onPress={handleFindWorkout}
                            >
                                <Text style={styles.submitButtonText}>Find a Workout</Text>
                                <View style={styles.submitArrow}>
                                    <Ionicons name="arrow-forward" size={24} color="black" />
                                </View>
                            </TouchableOpacity>
                        </View>
                    ) : null}
                    <HyroxDivisionInfoModal
                        visible={infoModalVisible}
                        onClose={() => setInfoModalVisible(false)}
                    />

                </View>
            </ScrollView>
        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Colours.primaryHeader,
    },
    scrollContainer: {
        flexGrow: 1,
        backgroundColor: Colours.primaryBackground,
        paddingBottom: 100,
    },
    header: {
        padding: 20,
        backgroundColor: Colours.primaryHeader,
        height: 100,
        borderBottomLeftRadius: 50,
        borderBottomRightRadius: 50,
        width: '100%',
        // zIndex: 1,
    },
    topSection: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    workoutTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: 'white',
        marginLeft: 10,
    },
    backButton: {
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'white',
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    profileButton: {
        backgroundColor: '#FFE0E1',
        width: 50,
        height: 50,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderRightWidth: 3,
        borderBottomWidth: 3,
        borderTopWidth: 1,
        borderLeftWidth: 1,
    },
    headingText: {
        width: '100%',
        fontSize: 20,
        marginTop: 25,
        fontWeight: 'bold',
        color: 'white',
        flex: 1, // Makes the text take remaining space
    },
    workoutInfo: {
        backgroundColor: Colours.primaryBackground,
        padding: 20,
    },
    workoutInfoDetails: {

    },
    sessionBlock: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginRight: 20,
    },
    workoutSubtitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
        paddingRight: 5,
    },
    workoutType: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    optionButton: {
        width: '48%',
        paddingVertical: 15,
        borderWidth: 1,
        borderColor: '#B0B0B0',
        borderRadius: 10,
        alignItems: 'center',
        backgroundColor: 'white',
        marginBottom: 10,
        flexDirection: 'row',
        justifyContent: 'flex-start',
        padding: 20,
    },
    selectedOption: {
        backgroundColor: 'white',
        borderColor: 'black',
        borderTopWidth: 1,
        borderLeftWidth: 1,
        borderBottomWidth: 3,
        borderRightWidth: 3,
    },
    optionText: {
        backgroundColor: 'white',
        width: 30,
        height: 30,
        borderRadius: 15,
        borderWidth: 1,
        marginRight: 15,
    },
    selectedOptionText: {
        backgroundColor: Colours.buttonColour,
    },
    labelText: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
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
    buttonContainer: {
        marginVertical: 30,
        alignItems: 'center',
        justifyContent: 'center',
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
    conditioningMessage: {
        fontSize: 14,
        marginBottom: 20,
    },
    filterButton: {
        width: '100%',
        borderWidth: 1,
        // borderColor: '#B0B0B0',
        borderRadius: 10,
        alignItems: 'center',
        backgroundColor: 'white',
        marginBottom: 10,
        flexDirection: 'row',
        justifyContent: 'center',
        padding: 20,
    },
    currentFilterButton: {
        backgroundColor: '#EFE8FF',
        width: '100%',
        borderWidth: 1,
        // borderColor: '#B0B0B0',
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 10,
        flexDirection: 'row',
        justifyContent: 'center',
        padding: 20,
    },
    movementDifficulty: {
        width: '65%',
    },
    savedFiltersTextBlock: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    savedFiltersText: {
        fontSize: 14,
        fontWeight: '500',
        marginRight: 10,
    },
    subDividerLine: {
        width: '70%',
        borderBottomColor: 'rgba(0, 0, 0, 0.25)',
        borderBottomWidth: 1,
    },
    filterSummarySection: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    createFilterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderWidth: 1,
        borderRadius: 20,
        borderColor: '#7B7C8C',
    },
    addCircle: {
        width: 20,
        height: 20,
        borderRadius: 20,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
        borderColor: '#7B7C8C',

    },
    createFilterText: {
        color: '#7B7C8C',
    },
    filterCard: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#DDD',
        backgroundColor: 'white',
        // marginHorizontal: 16,
        marginBottom: 10,
        borderRadius: 12,
        padding: 12,

    },
    filterCardActive: {
        borderColor: 'black',
        borderTopWidth: 1,
        borderLeftWidth: 1,
        borderRightWidth: 4,
        borderBottomWidth: 4,
    },
    filterLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    radioCircle: {
        width: 30,
        height: 30,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'black',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    radioCircleSelected: {
        backgroundColor: '#DEF3F4',
        // borderColor: '#4CAF50',
    },
    filterTextContainer: {
        flexDirection: 'column',
    },
    filterTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: '#222',
        marginBottom: 5,
    },
    filterSubtitle: {
        fontSize: 12,
        color: '#888',
    },
    filterRight: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 8,
    },
    iconButton: {
        marginLeft: 20,
        borderWidth: 1,
        padding: 5,
        borderRadius: 10,
    },
});
