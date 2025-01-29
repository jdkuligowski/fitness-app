import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, FlatList, Dimensions, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Slider from '@react-native-community/slider';
import ENV from '../../../../../env'
import { Colours } from '@/app/src/components/styles';


const SLIDER_WIDTH = Dimensions.get('window').width;
const ITEM_WIDTH = 20; // Width of each slider item


export default function WorkoutCategories({ route }) {
  const navigation = useNavigation();

  const exerciseData = [
    { name: 'Gym', icon: 'barbell-outline', colour: '#EFE8FF' },

    { name: 'Running', icon: 'heart-outline', colour: '#D2E4EA' },
    // { name: 'Rowing', icon: 'boat-outline', colour: '#E0F4DE' },
    { name: 'Mobility', icon: 'person-outline', colour: '#FFDDDE' },
    // { name: 'HIIT', icon: 'flash-outline', colour: '#DEF3F4' },
  ];

  // Get initials from the user's name
  const getUserInitials = () => {
    if (!userData) return '';
    const firstInitial = userData.first_name?.charAt(0) || '';
    const lastInitial = userData.last_name?.charAt(0) || '';
    return `${firstInitial}${lastInitial}`;
  };


  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>

        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <Text style={styles.headingText}>What kind of workout do you fancy?</Text>
        </View>
        <View style={styles.exerciseTypeArray}>

          {exerciseData.map((exercise, index) => (

            <TouchableOpacity
              key={index}
              style={[
                styles.exerciseType,
                { backgroundColor: exercise.colour }, // Dynamic background color
              ]}
              onPress={() => navigation.navigate(exercise.name)}
            >
              <Text style={styles.exerciseTitle}>{exercise.name}</Text>
              <View style={styles.exerciseCornerBox}>
                <View
                  style={[
                    styles.exerciseIconBox,
                    { backgroundColor: exercise.colour },
                  ]}>
                  <Ionicons name={exercise.icon} color="black" size={20} />
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>


      </ScrollView>
    </SafeAreaView >
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
  },
  header: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    height: 100,
    width: '100%',
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
    fontSize: 20,
    fontWeight: '600',
    color: 'black',
    marginLeft: 10,
    width: '90%',
  },
  exerciseTypeArray: {
    marginTop: 0,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    width: '100%',
  },
  exerciseType: {
    width: '47.5%',
    height: 150,
    borderWidth: 0,
    borderRadius: 30,
    marginBottom: 10,
    // padding: 20,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  exerciseCornerBox: {
    backgroundColor: 'white',
    width: '60%',
    height: '60%',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 30,
    borderTopLeftRadius: 80,
    padding: 20,
  },
  exerciseTitle: {
    alignSelf: 'flex-start',
    padding: 20,
    fontWeight: '500',
    fontSize: 16,
  },
  exerciseIconBox: {
    borderWidth: 1,
    borderRadius: 10,
    height: 40,
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 20,
    right: 20,
    borderBottomWidth: 2,
    borderRightWidth: 2,
  }
});
