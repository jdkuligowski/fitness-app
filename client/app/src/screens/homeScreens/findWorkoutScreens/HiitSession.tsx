import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, FlatList, Dimensions, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Slider from '@react-native-community/slider';
import { Colours } from '@/app/src/components/styles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ENV from '../../../../../env';
import EquipmentFilterModal from '../../modalScreens/GymEquipmentFilter';
import HiitInfoModal from '../../modalScreens/InfoModals/HiitWorkoutInfo';


const SLIDER_WIDTH = Dimensions.get('window').width;
const ITEM_WIDTH = 20; // Width of each slider item


export default function HiitSession() {
    const navigation = useNavigation();
    const [selectedWorkout, setSelectedWorkout] = useState(null);
    const [selectedValue, setSelectedValue] = useState(10); // Default selected value
    const data = Array.from({ length: 45 }, (_, i) => i); // Minutes from 0 to 60
    const flatListRef = useRef(null); // Reference to FlatList
    const [equipmentModalVisible, setEquipmentModalVisible] = useState(false);
    const [activeFilterSet, setActiveFilterSet] = useState(null);
    const [allFilters, setAllFilters] = useState([]);  // <-- to store all user filters
    const [isEditMode, setIsEditMode] = useState(false);
    const [filterToEdit, setFilterToEdit] = useState(null);
    const [infoModalVisible, setInfoModalVisible] = useState(false);


    useEffect(() => {
        // Automatically scroll to the default value
        if (flatListRef.current) {
            flatListRef.current.scrollToIndex({ index: selectedValue, animated: true });
        }
    }, []);

    useEffect(() => {
        const loadActiveFilter = async () => {
            try {
                const storedFilter = await AsyncStorage.getItem("activeEquipmentFilter");
                if (storedFilter) {
                    const parsedFilter = JSON.parse(storedFilter);
                    setActiveFilterSet(parsedFilter);
                    console.log('Filter: ', parsedFilter)
                }
            } catch (error) {
                console.error("Error loading active equipment filter:", error);
            }
        };
        loadActiveFilter();
    }, []);


    // Fetch ALL filters from the server
    useEffect(() => {
        const fetchUserFilters = async () => {
            try {
                const userId = await AsyncStorage.getItem("userId");
                if (!userId) return;
                const url = `${ENV.API_URL}/api/equipment_filters/get_all?user_id=${userId}`;
                console.log("Fetching all filters from:", url);
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`Error ${response.status}`);
                }
                const data = await response.json();
                setAllFilters(data); // data is an array of filter objects
                console.log('filter list: ', data)
            } catch (err) {
                console.error("Error fetching user filters:", err);
                Alert.alert("Error", "Could not load your saved filters.");
            }
        };
        fetchUserFilters();
    }, []);

    // 4) Mark filter as active if user taps the radio circle
    const selectFilterAsActive = async (filter) => {
        const filterToStore = {
            filterId: filter.id,
            filterName: filter.filter_name,
            equipment: filter.equipment, // or however your serializer returns it
        };
        setActiveFilterSet(filterToStore);
        await AsyncStorage.setItem("activeEquipmentFilter", JSON.stringify(filterToStore));
    };


    // 5) Delete filter
    const deleteFilter = async (filter) => {
        try {
            // confirm the user wants to delete
            Alert.alert(
                "Delete Filter",
                `Are you sure you want to delete "${filter.filter_name}"?`,
                [
                    { text: "Cancel", style: "cancel" },
                    {
                        text: "Delete",
                        style: "destructive",
                        onPress: async () => {
                            const userId = await AsyncStorage.getItem("userId");
                            const url = `${ENV.API_URL}/api/equipment_filters/${filter.id}/delete?user_id=${userId}`;
                            const res = await fetch(url, { method: 'DELETE' });
                            if (res.ok) {
                                // remove from local list
                                setAllFilters((prev) => prev.filter((f) => f.id !== filter.id));
                                // if it was active, clear it
                                if (activeFilterSet?.filterId === filter.id) {
                                    setActiveFilterSet(null);
                                    await AsyncStorage.removeItem("activeEquipmentFilter");
                                }
                            } else {
                                Alert.alert("Error", "Failed to delete filter");
                            }
                        },
                    },
                ]
            );
        } catch (error) {
            console.error("Error deleting filter:", error);
            Alert.alert("Error", "Something went wrong while deleting.");
        }
    };


    // For creating a new filter
    const openCreateModal = () => {
        setIsEditMode(false);
        setFilterToEdit(null);
        setEquipmentModalVisible(true);
    };

    // For editing an existing filter
    const openEditModal = (filter) => {
        setIsEditMode(true);
        setFilterToEdit({
            filterId: filter.id,
            filterName: filter.filter_name,
            equipment: filter.equipment, // array of {id, equipment_name} or however your data looks
        });
        setEquipmentModalVisible(true);
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

    const renderFilterItem = ({ item }) => {
        // check if it's the active one
        const isActive = (activeFilterSet && activeFilterSet.filterId === item.id);

        return (
            <View style={[styles.filterCard, isActive && styles.filterCardActive]}>
                {/* Left side: the radio circle and Filter name + subtext */}
                <TouchableOpacity
                    style={styles.filterLeft}
                    onPress={() => selectFilterAsActive(item)}
                    activeOpacity={0.7}
                >
                    {/* The circle */}
                    <View style={[styles.radioCircle, isActive && styles.radioCircleSelected]}>
                        {/* {isActive && <Ionicons name="checkmark" size={16} color="white" />} */}
                    </View>

                    <View style={styles.filterTextContainer}>
                        <Text style={styles.filterTitle}>{item.filter_name}</Text>
                        <Text style={styles.filterSubtitle}>
                            {item.equipment_count || item.equipment?.length || 0} Equipment Selected
                        </Text>
                    </View>
                </TouchableOpacity>

                {/* Right side: Eye + Trash */}
                <View style={styles.filterRight}>
                    <TouchableOpacity style={styles.iconButton} onPress={() => openEditModal(item)}>
                        <Ionicons name="eye-outline" size={20} color="#4D4D4D" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconButton} onPress={() => deleteFilter(item)}>
                        <Ionicons name="trash-outline" size={20} color="#D30000" />
                    </TouchableOpacity>
                </View>
            </View>
        );
    };



    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.scrollContainer}>

                <View style={styles.header}>
                    <View style={styles.topSection}>
                        <View style={styles.leftSection}>

                            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                                <Ionicons name="arrow-back" size={24} color="white" />
                            </TouchableOpacity>
                            <Text style={styles.workoutTitle}>Find a hiit workout</Text>
                        </View>

                        <TouchableOpacity style={styles.profileButton}>
                            <Ionicons name="notifications-outline" color={'black'} size={20} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Options */}
                <View style={styles.workoutInfo}>
                    <View style={styles.workoutInfoDetails}>
                        <View style={styles.sessionBlock}>
                            <Text style={styles.workoutSubtitle}>What kind of hiit session do you want to do?</Text>
                            <Ionicons name="information-circle-outline" size={24} color="black" style={{ marginBottom: 10 }} onPress={() => setInfoModalVisible(true)} />
                        </View>

                        <View style={styles.workoutType}>
                            {['Tabata', 'AMRAP', 'EMOM', '30/30', "I don't mind"].map((option, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[
                                        styles.optionButton,
                                        selectedWorkout === option && styles.selectedOption,
                                    ]}
                                    onPress={() => setSelectedWorkout(option)}
                                >
                                    <View style={[
                                        styles.optionText,
                                        selectedWorkout === option && styles.selectedOptionText,
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

                    {/* Equipment filter section */}
                    <View style={styles.workoutInfoDetails}>
                        <Text style={styles.workoutSubtitle}>Include what equipment you have</Text>
                        <View style={styles.savedFiltersTextBlock}>
                            <Text style={styles.savedFiltersText}>Saved filters</Text>
                            <View style={styles.subDividerLine}></View>
                        </View>
                        <View style={styles.filterSummarySection}>
                            {allFilters && allFilters.length === 0 ?
                                <Text style={styles.savedFiltersText}>No filters</Text>
                                : allFilters.length === 1 ?
                                    <Text style={styles.savedFiltersText}>{allFilters && allFilters.length} filter</Text>
                                    :
                                    <Text style={styles.savedFiltersText}>{allFilters && allFilters.length} filters</Text>
                            }
                            <TouchableOpacity style={styles.createFilterButton} onPress={openCreateModal}>
                                <View style={styles.addCircle} >
                                    <Ionicons name='add-outline' size={14} color="#7B7C8C" />
                                </View>
                                <Text style={styles.createFilterText}>Create new filter</Text>
                            </TouchableOpacity>
                        </View>
                        {allFilters.length > 0 ? (

                            allFilters.map((f) =>
                                renderFilterItem({ item: f }))
                        ) : ''}
                    </View>

                    {selectedWorkout && activeFilterSet ?
                        <View style={styles.buttonContainer}>
                            <TouchableOpacity
                                style={styles.submitButton}
                                onPress={() =>
                                    navigation.navigate("HiitSessionDetails", {
                                        selectedTime: selectedValue,
                                        selectedWorkout,
                                    })
                                }
                            >
                                <Text style={styles.submitButtonText}>Find a Workout</Text>
                                <View style={styles.submitArrow}>
                                    <Ionicons name="arrow-forward" size={24} color="black" />
                                </View>
                            </TouchableOpacity>
                        </View>
                        : ''}

                    <EquipmentFilterModal
                        visible={equipmentModalVisible}
                        onClose={() => setEquipmentModalVisible(false)}
                        isEdit={isEditMode}
                        existingFilter={filterToEdit}
                        onSave={(newFilter) => {
                            console.log("New filter created:", newFilter);

                            // 1) Add to allFilters
                            setAllFilters((prev) => [...prev, newFilter]);

                            // 2) Make it active
                            const filterToStore = {
                                filterId: newFilter.id,
                                filterName: newFilter.filter_name,
                                equipment: newFilter.equipment,
                            };
                            setActiveFilterSet(filterToStore);
                            AsyncStorage.setItem("activeEquipmentFilter", JSON.stringify(filterToStore));

                            // 3) Close modal
                            setEquipmentModalVisible(false);
                        }}
                        onUpdate={(updatedFilter) => {
                            console.log("Filter updated:", updatedFilter);

                            // 1) Update this filter in allFilters
                            setAllFilters((prev) =>
                                prev.map((f) => (f.id === updatedFilter.id ? updatedFilter : f))
                            );

                            // 2) Make updated filter active
                            const filterToStore = {
                                filterId: updatedFilter.id,
                                filterName: updatedFilter.filter_name,
                                equipment: updatedFilter.equipment,
                            };
                            setActiveFilterSet(filterToStore);
                            AsyncStorage.setItem("activeEquipmentFilter", JSON.stringify(filterToStore));

                            // 3) Close modal
                            setEquipmentModalVisible(false);
                        }}
                    />
                    <HiitInfoModal
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
        backgroundColor: Colours.secondaryColour,
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
    workoutSubtitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
        paddingRight: 5, 
    },
    sessionBlock: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginRight: 20,
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
        backgroundColor: Colours.buttonColour,
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
