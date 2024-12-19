
import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';


export default function ExploreScreen() {
  const navigation = useNavigation();


  return (
    <View style={styles.container}>

      <Text style={styles.headingText}>Explore data will be shown here.</Text>

    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#F0F0F0', // Background color for the whole screen
    padding: '5%', // Padding around the main container
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '100%',
    height: '100%',
    maxWidth: 400, // Optional: limit width on larger screens for a clean look
    backgroundColor: 'white', // Background for inner container
    // borderRadius: 10,
    padding: 20, // Internal padding for content spacing
    shadowColor: '#000', // Optional: shadow for visual depth
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3, // Shadow for Android
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 60,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
    borderColor: '#207696',
    borderWidth: 1,
  },
  headingText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#207696',
    width: '80%',
  },
  activityArray: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
  },
  activity: {
    width: '100%',
    height: '10%',
    backgroundColor: '#207696',
    fontSize: 20,
    borderRadius: 20,
    justifyContent: 'center',
    marginBottom: '5%',
  },
  activityText: {
    color: 'white',
    fontSize: 20,
    marginLeft: '5%',
    fontWeight: 'bold',
  },
});