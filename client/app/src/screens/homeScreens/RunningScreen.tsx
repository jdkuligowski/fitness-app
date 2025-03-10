import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, FlatList, Dimensions, Button } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Slider from '@react-native-community/slider';


const SLIDER_WIDTH = Dimensions.get('window').width;
const ITEM_WIDTH = 20; // Width of each slider item


export default function RunningScreen() {
  const navigation = useNavigation();
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [selectedValue, setSelectedValue] = useState(50); // Default selected value
  const data = Array.from({ length: 100 }, (_, i) => i); // Minutes from 0 to 60
  const flatListRef = useRef(null); // Reference to FlatList

  useEffect(() => {
    // Automatically scroll to the default value
    if (flatListRef.current) {
      flatListRef.current.scrollToIndex({ index: selectedValue, animated: true });
    }
  }, []);


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
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="black" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.profileButton}>
              <Ionicons name="notifications-outline" color={'black'} size={20} />
            </TouchableOpacity>
          </View>

          {/* Personalized Message */}
          <Text style={styles.headingText}>Hey James, tell us some more details about your running session</Text>
        </View>

        {/* Options */}
        <View style={styles.workoutInfo}>
          <View style={styles.workoutInfoDetails}>
            <Text style={styles.workoutSubtitle}>What kind of running workout do you fancy?</Text>
            <View style={styles.workoutType}>
              {['Intervals', 'Long Run', 'Tempo', 'Not Sure'].map((option, index) => (
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
              {/* <View style={styles.centerIndicator}>
                <View style={styles.indicatorArrow}></View>
              </View> */}
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
          {selectedWorkout ?
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.submitButton}
              // onPress={() => navigation.navigate('FindWorkouts')} // Replace 'FindWorkouts' with the name of your target screen
              >
                <Text style={styles.submitButtonText}>Find a Workout</Text>
                <View style={styles.submitArrow}>
                  <Ionicons name="arrow-forward" size={24} color="black" />
                </View>
              </TouchableOpacity>
            </View>
            : ''}
        </View>
      </ScrollView>
    </SafeAreaView >
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F6F3DC', // Background color for the entire screen
  },
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#F3F3FF',
  },
  header: {
    padding: 20,
    backgroundColor: '#F6F3DC',
    height: 175,
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
    color: 'black',
    flex: 1, // Makes the text take remaining space
  },
  workoutInfo: {
    backgroundColor: '#F3F3FF',
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
});
