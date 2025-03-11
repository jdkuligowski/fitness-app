import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, FlatList, Dimensions, Button } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Slider from '@react-native-community/slider';
import { Colours } from '@/app/src/components/styles';
import EquipmentFilterModal from '../../modalScreens/GymEquipmentFilter';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SLIDER_WIDTH = Dimensions.get('window').width;
const ITEM_WIDTH = 20; // Width of each slider item


export default function GymSession() {
  const navigation = useNavigation();
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [selectedFinish, setSelectedFinish] = useState(null);
  const [selectedValue, setSelectedValue] = useState(50); // Default selected value
  const data = Array.from({ length: 80 }, (_, i) => i); // Minutes from 0 to 60
  const flatListRef = useRef(null); // Reference to FlatList
  const [equipmentModalVisible, setEquipmentModalVisible] = useState(false);
  const [activeFilterSet, setActiveFilterSet] = useState(null);
  const [complexity, setComplexity] = useState("Advanced");

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

  // Example: after user saves
  const handleSaveEquipmentSet = ({ name, equipmentIds }) => {
    console.log("Saving set:", name, equipmentIds);
    // do something with it (send to backend, store locally, etc.)
    setEquipmentModalVisible(false);
  };


  // Ensure selectedFinish is "Conditioning" when selectedValue >= 68
  useEffect(() => {
    if (selectedValue >= 68) {
      setSelectedFinish('Conditioning');
    }
  }, [selectedValue]);


  // Handler called when user picks or updates a filter set from FilterSetPicker
  const handleFilterSetChosen = (filterSet) => {
    setActiveFilterSet(filterSet);
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
              <Text style={styles.workoutTitle}>Find a strength workout</Text>
            </View>

            <TouchableOpacity style={styles.profileButton}>
              <Ionicons name="notifications-outline" color={'black'} size={20} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Options */}
        <View style={styles.workoutInfo}>
          <View style={styles.workoutInfoDetails}>
            <Text style={styles.workoutSubtitle}>What kind of strength session do you want to do?</Text>
            <View style={styles.workoutType}>
              {['Full body', 'Upper body', 'Lower body'].map((option, index) => (
                // {['Full body', 'Upper Body', 'Lower Body', 'Push', 'Pull', 'Back & bis', 'Chest & tris', 'Vanity'].map((option, index) => (
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
          <View style={styles.workoutInfoDetails}>
            <Text style={styles.workoutSubtitle}>Do you want to finish your workout with a pump or conditioning?</Text>
            <View style={styles.workoutType}>
              {['Pump', 'Conditioning'].map((option, index) => (
                // {['Full body', 'Upper Body', 'Lower Body', 'Push', 'Pull', 'Back & bis', 'Chest & tris', 'Vanity'].map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.optionButton,
                    selectedFinish === option && styles.selectedOption,
                  ]}
                  onPress={() => selectedValue < 68 && setSelectedFinish(option)}
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
            {selectedValue > 68 ? <Text style={styles.conditioningMessage}>This workout length will always finish with conditioning</Text> : null}

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
            <Text style={styles.workoutSubtitle}>Include what equipment you have</Text>
            {activeFilterSet ? (
              <>
                <View>
                  <TouchableOpacity
                    style={styles.currentFilterButton}
                  >
                    <Text>Current filter: {activeFilterSet.filterName}</Text>
                  </TouchableOpacity>
                </View>
                <View>
                  <TouchableOpacity
                    style={styles.filterButton}
                    onPress={() => setEquipmentModalVisible(true)}
                  >
                    <Text>Create new filter</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <View>
                <TouchableOpacity
                  style={styles.filterButton}
                  onPress={() => setEquipmentModalVisible(true)}
                >
                  <Text>Select equipment</Text>
                </TouchableOpacity>
              </View>
            )}


          </View>

          {selectedWorkout ?
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.submitButton}
                onPress={() =>
                  navigation.navigate("WorkoutDetails", {
                    selectedTime: selectedValue,
                    selectedFinish,
                    selectedWorkout,
                    frequency: 'Sometimes',
                    complexity: complexity,
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
            onSave={handleSaveEquipmentSet}
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
  workoutSubtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
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
    backgroundColor: '#DEF3F4',
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
    backgroundColor: 'black',
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
});
