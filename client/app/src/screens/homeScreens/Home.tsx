import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Image, TouchableOpacity, StatusBar, SafeAreaView,
  TextInput, Keyboard, TouchableWithoutFeedback, ScrollView, Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { format, toZonedTime } from 'date-fns-tz'; // Import date-fns and date-fns-tz
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import ENV from '../../../../env'
import { useLoader } from '@/app/src/context/LoaderContext';
import { isToday, isTomorrow, parseISO } from 'date-fns';
import { Colours } from '../../components/styles';

export default function HomeScreen() {
  const navigation = useNavigation();
  const { setIsBouncerLoading, isBouncerLoading } = useLoader(); // Access loader functions
  const [greeting, setGreeting] = useState(''); // State to hold the greeting
  const { setIsAuthenticated } = useAuth();
  const [userData, setUserData] = useState('')
  const [upcomingWorkouts, setUpcomingWorkouts] = useState([]);
  // Get the current date and format it
  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const [isVisible, setIsVisible] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentWorkout, setCurrentWorkout] = useState(null); // Store the current workout for the modal

  // fetch user data function
  const getUser = async () => {
    try {
      const userId = await AsyncStorage.getItem("userId"); // Retrieve the user ID from local storage
      console.log("user_id ->", userId);

      if (!userId) {
        console.error('User ID not found in AsyncStorage.');
        // setIsLoading(false);
        return;
      }

      const { data } = await axios.get(`${ENV.API_URL}/api/auth/profile/${userId}/`);
      console.log('User data ->', data); // Debug log
      setUserData(data);
    } catch (error) {
      console.error('Error fetching user data:', error?.response?.data || error.message);
    }
    // finally {
    //   setIsLoading(false); // Set loading to false after request is complete
    // }
  };

  // 🟢 Load user data on component mount
  useEffect(() => {
    getUser();
  }, []);

  const handleOutsidePress = () => {
    setIsVisible(false); // Set visibility to false when clicking outside
    Keyboard.dismiss(); // Dismiss the keyboard if it's open
  };

  useEffect(() => {
    // Define the user's time zone (you can retrieve this dynamically if needed)
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Get the current time in the user's time zone
    const zonedTime = toZonedTime(new Date(), timeZone);
    const currentHour = parseInt(format(zonedTime, 'H'), 10); // Get the hour in 24-hour format

    // Determine the greeting based on the hour
    if (currentHour < 12) {
      setGreeting('Good Morning');
    } else if (currentHour >= 12 && currentHour < 17) {
      setGreeting('Good Afternoon');
    } else {
      setGreeting('Good Evening');
    }
  }, []);

  const handleLogout = async () => {
    try {
      // Clear the authentication token
      await AsyncStorage.removeItem('token');
      setIsAuthenticated(false);
      Alert.alert('Logged Out', 'You have been logged out successfully.');
    } catch (error) {
      console.error('Error logging out:', error.message);
      Alert.alert('Error', 'An error occurred while logging out. Please try again.');
    }
  };


  // Get initials from the user's name
  const getUserInitials = () => {
    if (!userData) return '';
    const firstInitial = userData.first_name?.charAt(0) || '';
    const lastInitial = userData.last_name?.charAt(0) || '';
    return `${firstInitial}${lastInitial}`;
  };

  // 🔥 Function to Fetch Upcoming Workouts
  const fetchUpcomingWorkouts = async () => {
    try {
      setIsBouncerLoading(true);
      const userId = await AsyncStorage.getItem('userId');
      const response = await axios.get(`${ENV.API_URL}/api/saved_workouts/upcoming-workouts/`, {
        params: {
          user_id: userId,
          upcoming: true,
          limit: 3
        }
      });
      setUpcomingWorkouts(response.data);
    } catch (error) {
      console.error('Error fetching upcoming workouts:', error);
    } finally {
      setIsBouncerLoading(false);
    }
  };

  // 🔥 Load the upcoming workouts when the component mounts
  useEffect(() => {
    fetchUpcomingWorkouts();
  }, []);


  const formatWorkoutDate = (dateString) => {
    const date = parseISO(dateString);
    if (isToday(date)) {
      return 'Today';
    } else if (isTomorrow(date)) {
      return 'Tomorrow';
    } else {
      return format(date, 'dd MMM');
    }
  };




  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F6F3DC" />
      <TouchableWithoutFeedback onPress={handleOutsidePress}>

        {/* Overall Containier */}
        < ScrollView contentContainerStyle={styles.container}>

          {/* Header section */}
          <View style={styles.header}>
            <View style={styles.dateBox}>
              <Ionicons name="calendar-outline" color={'white'} size={20} />
              <Text style={styles.dateText}>{formattedDate}</Text>
            </View>
            <View style={styles.appIntro}>
              <View style={styles.introContainer}>
                <TouchableOpacity
                  onPress={() => navigation.navigate('ProfileStack', {
                    screen: 'ProfilePage'
                  })}>
                  {userData?.profile_image ? (
                    <Image
                      style={styles.profileImage}
                      source={{ uri: userData.profile_image }}
                    />
                  ) : (
                    <View style={styles.initialsContainer}>
                      <Text style={styles.initialsText}>{getUserInitials()}</Text>
                    </View>
                  )}
                </TouchableOpacity>
                <View style={styles.textIntro}>
                  <Text style={styles.headingText}>Hey {userData ? userData.first_name : ''}</Text>
                  <Text style={styles.subHeadingText}>{greeting ? greeting : ''}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.profileButton}>
                <Ionicons name="notifications-outline" color={'black'} size={20} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Search box */}
          {/* <View style={styles.overlayBox}>
            <View style={styles.homeSearchIcon}>
              <Ionicons name="search" size={20} color="#FFFFFF" />
            </View>
            <TextInput
              style={styles.searchInput}
              placeholder="Search for workout"
              placeholderTextColor="#B0B0B0"
            />
          </View> */}

          {/* First block: categoriess */}
          <View style={styles.categoryBlock}>
            <View style={styles.blockHeader}>
              <Text style={styles.blockText}>Categories</Text>
              {/* <TouchableOpacity style={styles.blockButton} onPress={() => navigation.navigate('Workout categories')}>
                <Text>View all</Text>
              </TouchableOpacity> */}
            </View>
            <View style={styles.activityArray}>
              <View style={styles.activity}>
                <TouchableOpacity style={styles.activityButton} onPress={() => navigation.navigate('Gym')}>
                  <Ionicons name="barbell-outline" size={26} color="#897AD3" />
                </TouchableOpacity>
                <Text style={styles.activityText}>Strength</Text>
              </View>
              <View style={styles.activity}>
                <TouchableOpacity style={styles.activityButton} onPress={() => navigation.navigate('Running', { userData })}>
                  <Ionicons name="heart-outline" size={26} color="#D2E4EA" />
                </TouchableOpacity>
                <Text style={styles.activityText}>Running</Text>
              </View>
              <View style={styles.activity}>
                <TouchableOpacity style={styles.activityButton} onPress={() => navigation.navigate('Mobility')}>
                  <Ionicons name="body-outline" size={26} color="#E87EA1" />
                </TouchableOpacity>
                <Text style={styles.activityText}>Mobility</Text>
              </View>
              <View style={styles.activity}>
                <TouchableOpacity style={styles.activityButton} onPress={() => navigation.navigate('Hiit')}>
                  <Ionicons name="flash-outline" size={26} color="#ECE847" />
                </TouchableOpacity>
                <Text style={styles.activityText}>Hiit</Text>
              </View>
              {/* <View style={styles.activity}>
                <TouchableOpacity style={styles.activityButton}>
                  <Ionicons name="boat-outline" size={20} color="#539883" />
                </TouchableOpacity>
                <Text style={styles.activityText}>Rowing</Text>
              </View> */}

            </View>
          </View>

          {/* Second block: Popular workouts */}
          <View style={styles.categoryBlock}>
            <View style={styles.blockHeader}>
              <Text style={styles.blockText}>Upcoming workouts</Text>
              <TouchableOpacity
                style={styles.blockButton}
                onPress={() => navigation.navigate('Training', {
                  screen: 'TrainingOverview'
                })}
              >
                <Text>View all</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.popularWorkouts}
            >
              {upcomingWorkouts.map((workout) => (
                <TouchableOpacity
                  key={workout.id}
                  style={[
                    styles.popularWorkout,
                    {
                      backgroundColor:
                        workout.activity_type === 'Gym'
                          ? '#EFE8FF'
                          : workout.activity_type === 'Running'
                            ? '#D2E4EA'
                            : workout.activity_type === 'Mobility'
                              ? '#FFEEEF'
                              : workout.activity_type === 'Hiit'
                                ? '#FFFFEF'
                                : 'black',
                    },
                  ]}
                  onPress={() =>
                    navigation.navigate('Training', {
                      screen: 'TrainingDetails',
                      params: {
                        workoutId: workout.id,
                        activityType: workout.activity_type
                      }
                    })
                  }
                  activeOpacity={0.7} // Makes the touch more visible
                >
                  <View style={styles.topRow}>
                    <Text style={styles.workoutTitle}>{workout.name}</Text>
                    <Text style={styles.workoutDescription}>{workout.description}</Text>

                  </View>

                  <View style={styles.middleRow}>
                    <Ionicons name="time-outline" size={20} color="black" />
                    <Text style={styles.workoutTime}>
                      {workout?.duration ? `${workout.duration} mins` : 'N/A'}
                    </Text>
                    <Text style={styles.workoutAbility}>
                      {workout?.scheduled_date ? formatWorkoutDate(workout.scheduled_date) : 'No Date'}
                    </Text>
                  </View>

                  <View style={styles.bottomRow}>
                    <Image
                      style={styles.trainerImage}
                      source={workout.trainerImage ? { uri: workout.trainerImage } : require('../../../../assets/images/gus_image.jpeg')}
                    />
                    <Text style={styles.trainerName}>Trainer: {workout.trainerName || 'Gus Barton'}</Text>
                  </View>
                </TouchableOpacity>
              ))}

            </ScrollView>
            {/* )} */}
          </View>
          {/* <View style={styles.categoryBlock}>
            <View style={styles.blockHeader}>
              <Text style={styles.blockText}>Saved workouts</Text>
              <TouchableOpacity style={styles.blockButton}>
                <Text>View all</Text>
              </TouchableOpacity>
            </View>
          </View> */}
        </ScrollView>
      </TouchableWithoutFeedback>
    </SafeAreaView >
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colours.primaryHeader,
  },
  container: {
    flex: 1,
    backgroundColor: Colours.primaryBackground,
    paddingBottom: 50,
  },
  header: {
    padding: 20,
    backgroundColor: Colours.primaryHeader,
    height: 130,
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
  },
  dateBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  dateText: {
    marginLeft: 5,
    color: 'white',
  },
  appIntro: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  introContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    // width: '100%',
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 10,
    marginRight: 15,
  },
  initialsContainer: {
    width: 50,
    height: 50,
    borderRadius: 10,
    marginRight: 15,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFE0E1',
    borderWidth: 1,
  },
  initialsText: {
    fontSize: 18,
    fontWeight: 600,
  },
  headingText: {
    fontSize: 16,
    width: '100%',
    marginTop: 2,
    marginBottom: 2,
    color: 'white',
  },
  subHeadingText: {
    fontSize: 16,
    width: '100%',
    fontWeight: 'bold',
    marginTop: 2,
    marginBottom: 2,
    color: 'white',

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
  overlayBox: {
    marginTop: -45,
    backgroundColor: '#FFFFFF', // Background for the overlay box
    borderRadius: 20,
    marginHorizontal: 20,
    padding: 10,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 5,
    borderBottomWidth: 5,
    flexDirection: 'row', // Align icon and input horizontally
    alignItems: 'center', // Center vertically
  },
  homeSearchIcon: {
    backgroundColor: '#BDD1FF', // Background color for the icon
    padding: 10,
    borderRadius: 10, // Rounded corners
    marginRight: 10, // Space between icon and input
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchInput: {
    flex: 1, // Allow the input to take the remaining space
    padding: 10,
    fontSize: 16,
  },
  categoryBlock: {
    flexDirection: 'column',
    paddingTop: 20,
    paddingBottom: 20,
    marginTop: 10,
  },
  blockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 20,
    paddingLeft: 20,
  },
  blockText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  blockButton: {
    backgroundColor: '#F6F3DC',
    borderWidth: 1,
    borderColor: 'black',
    paddingLeft: 15,
    paddingRight: 15,
    paddingTop: 3,
    paddingBottom: 3,
    borderRadius: 5,
  },
  activityArray: {
    flexDirection: 'row',
    marginTop: 20,
    paddingRight: 20,
    paddingLeft: 20,
  },
  activity: {
    width: 80,
    marginRight: 10,

  },
  activityButton: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 75,
    borderColor: '#BBBBCB',
    borderWidth: 1,
    borderRadius: 15,
    backgroundColor: 'white',
  },
  activityText: {
    color: '#7B7C8C',
    textAlign: 'center',
    marginTop: 5,
  },
  popularWorkouts: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    paddingLeft: 20,
  },
  popularWorkout: {
    width: 250,
    height: 200,
    padding: 20,
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 5,
    borderBottomWidth: 5,
    borderRadius: 30,
    backgroundColor: '#DFD7F3',
    marginRight: 20,
  },
  topRow: {
    // flexDirection: 'row',
    // justifyContent: 'space-between',
    width: '100%',
  },
  workoutDescription: {
    marginTop: 5,
  },
  workoutTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    width: '70%',
  },
  saveButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    backgroundColor: 'white',
  },
  middleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workoutTime: {
    marginLeft: 10,
    paddingRight: 10,
    borderRightWidth: 1,
  },
  workoutAbility: {
    marginLeft: 10,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trainerImage: {
    width: 35,
    height: 35,
    borderRadius: 10,
    marginRight: 10,
    borderWidth: 1,
  }
});
