import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, FlatList, Dimensions, Button } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Slider from '@react-native-community/slider';
import ENV from '../../../../../env'


const SLIDER_WIDTH = Dimensions.get('window').width;
const ITEM_WIDTH = 20; // Width of each slider item


export default function RunningScreen() {
  const navigation = useNavigation();

  const exerciseData = [
    { name: 'Running', icon: 'heart-outline', colour: '#E0DCF6' },
    { name: 'Gym', icon: 'barbell-outline', colour: '#FFE0E1' },
    { name: 'Rowing', icon: 'boat-outline', colour: '#E0F4DE' },
    { name: 'Mobility', icon: 'person-outline', colour: '#F5EAE0' },
    { name: 'HIIT', icon: 'flash-outline', colour: '#DEF3F4' },
  ];


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
          <Text style={styles.headingText}>Hey James, what workout do you want to do</Text>
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