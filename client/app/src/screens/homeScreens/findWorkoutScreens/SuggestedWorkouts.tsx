import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity, Animated, ScrollView } from 'react-native';
import { useWorkout } from '../../../context/WorkoutContext';
import { Ionicons } from '@expo/vector-icons';

export default function WorkoutScreen() {
  const { workoutData, isLoading, fetchWorkoutData, gymFormData } = useWorkout();
  const [filteredWorkoutData, setFilteredWorkoutData] = useState([]);

  // Individual states for each section
  const [stretchingOpen, setStretchingOpen] = useState(false);
  const [warmUp1Open, setWarmUp1Open] = useState(false);
  const [warmUp2Open, setWarmUp2Open] = useState(false);
  const [coreMovementOpen, setCoreMovementOpen] = useState(false);
  const [superset1Open, setSuperset1Open] = useState(false);
  const [superset2Open, setSuperset2Open] = useState(false);

  // Separate animated values for each section
  const stretchingHeight = useRef(new Animated.Value(0)).current;
  const stretchingOpacity = useRef(new Animated.Value(0)).current;

  const warmUp1Height = useRef(new Animated.Value(0)).current;
  const warmUp1Opacity = useRef(new Animated.Value(0)).current;

  const warmUp2Height = useRef(new Animated.Value(0)).current;
  const warmUp2Opacity = useRef(new Animated.Value(0)).current;

  const coreMovementHeight = useRef(new Animated.Value(0)).current;
  const coreMovementOpacity = useRef(new Animated.Value(0)).current;

  const superset1Height = useRef(new Animated.Value(0)).current;
  const superset1Opacity = useRef(new Animated.Value(0)).current;

  const superset2Height = useRef(new Animated.Value(0)).current;
  const superset2Opacity = useRef(new Animated.Value(0)).current;

  // set movements
  const [coreMovement, setCoreMovement] = useState('')
  const [superset1, setSuperset1] = useState({
    exercise1: '',
    exercise2: '',
    exercise3: '',
  })
  const [superset2, setSuperset2] = useState({
    exercise1: '',
    exercise2: '',
    exercise3: '',
  });

  // Fetch workout data on mount
  useEffect(() => {
    fetchWorkoutData();
  }, []);

  useEffect(() => {
    if (workoutData.length > 0) {
      // Filter workout data based on gymFormData
      console.log('Gym form data ->', gymFormData)
      const filterWorkoutData = () => {
        const { frequency, body_area } = gymFormData;

        // Define complexity filter based on frequency
        let maxComplexity: number;
        if (frequency === 'Rarely') {
          maxComplexity = 1;
        } else if (frequency === 'Sometimes') {
          maxComplexity = 2;
        } else if (frequency === 'Often') {
          maxComplexity = 3;
        }

        // Apply filters to workout data
        const filteredData = workoutData
          .filter((exercise) => exercise.complexity <= maxComplexity)
          .filter((exercise) => {
            // Apply body area filter if not full body
            if (body_area === 'Full Body') return true;
            return exercise.body_area === body_area;
          });

        // Select a random core movement where movement_type = 1
        const coreMovements = filteredData.filter((exercise) => exercise.movement_type === 1);
        if (coreMovements.length > 0) {
          const randomCoreMovement = coreMovements[Math.floor(Math.random() * coreMovements.length)];
          setCoreMovement(randomCoreMovement.exercise);
          console.log(randomCoreMovement.exercise)
        }

        // Select three unique exercises for the superset
        const supersetExercises1 = [];
        while (supersetExercises1.length < 3 && filteredData.length > 0) {
          const randomIndex = Math.floor(Math.random() * filteredData.length);
          const selectedExercise = filteredData[randomIndex];

          // Ensure no duplicates in the superset
          if (!supersetExercises1.includes(selectedExercise)) {
            supersetExercises1.push(selectedExercise);
          }
        }

        // Assign exercises to superset1 if three were selected
        if (supersetExercises1.length === 3) {
          setSuperset1({
            exercise1: supersetExercises1[0].exercise,
            exercise2: supersetExercises1[1].exercise,
            exercise3: supersetExercises1[2].exercise,
          });
        }

        // Filter out the exercises already in superset1 for the second superset
        const remainingExercises = filteredData.filter(
          (exercise) =>
            !supersetExercises1.some(
              (supersetExercise) => supersetExercise.id === exercise.id
            )
        );

        // Select three unique exercises for the second superset
        const supersetExercises2 = [];
        while (supersetExercises2.length < 3 && remainingExercises.length > 0) {
          const randomIndex = Math.floor(Math.random() * remainingExercises.length);
          const selectedExercise = remainingExercises[randomIndex];

          // Ensure no duplicates in the second superset
          if (!supersetExercises2.includes(selectedExercise)) {
            supersetExercises2.push(selectedExercise);
          }
        }

        // Assign exercises to superset2 if three were selected
        if (supersetExercises2.length === 3) {
          setSuperset2({
            exercise1: supersetExercises2[0].exercise,
            exercise2: supersetExercises2[1].exercise,
            exercise3: supersetExercises2[2].exercise,
          });
        }

        setFilteredWorkoutData(filteredData);
      };

      filterWorkoutData();
    }
  }, [workoutData, gymFormData]);

  const toggleStretching = () => {
    setStretchingOpen((prev) => !prev);
    if (stretchingOpen) {
      Animated.parallel([
        Animated.timing(stretchingHeight, { toValue: 0, duration: 300, useNativeDriver: false }),
        Animated.timing(stretchingOpacity, { toValue: 0, duration: 150, useNativeDriver: false }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(stretchingHeight, { toValue: 100, duration: 300, useNativeDriver: false }), // Adjust toValue as needed
        Animated.timing(stretchingOpacity, { toValue: 1, duration: 300, useNativeDriver: false }),
      ]).start();
    }
  };

  const toggleWarmUp1 = () => {
    setWarmUp1Open((prev) => !prev);
    if (warmUp1Open) {
      Animated.parallel([
        Animated.timing(warmUp1Height, { toValue: 0, duration: 300, useNativeDriver: false }),
        Animated.timing(warmUp1Opacity, { toValue: 0, duration: 150, useNativeDriver: false }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(warmUp1Height, { toValue: 100, duration: 300, useNativeDriver: false }),
        Animated.timing(warmUp1Opacity, { toValue: 1, duration: 300, useNativeDriver: false }),
      ]).start();
    }
  };

  const toggleWarmUp2 = () => {
    setWarmUp2Open((prev) => !prev);
    if (warmUp2Open) {
      Animated.parallel([
        Animated.timing(warmUp2Height, { toValue: 0, duration: 300, useNativeDriver: false }),
        Animated.timing(warmUp2Opacity, { toValue: 0, duration: 150, useNativeDriver: false }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(warmUp2Height, { toValue: 100, duration: 300, useNativeDriver: false }),
        Animated.timing(warmUp2Opacity, { toValue: 1, duration: 300, useNativeDriver: false }),
      ]).start();
    }
  };

  const toggleCoreMovement = () => {
    setCoreMovementOpen((prev) => !prev);
    if (coreMovementOpen) {
      Animated.parallel([
        Animated.timing(coreMovementHeight, { toValue: 0, duration: 300, useNativeDriver: false }),
        Animated.timing(coreMovementOpacity, { toValue: 0, duration: 150, useNativeDriver: false }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(coreMovementHeight, { toValue: 100, duration: 300, useNativeDriver: false }),
        Animated.timing(coreMovementOpacity, { toValue: 1, duration: 300, useNativeDriver: false }),
      ]).start();
    }
  };

  const toggleSuperset1 = () => {
    setSuperset1Open((prev) => !prev);
    if (superset1Open) {
      Animated.parallel([
        Animated.timing(superset1Height, { toValue: 0, duration: 300, useNativeDriver: false }),
        Animated.timing(superset1Opacity, { toValue: 0, duration: 150, useNativeDriver: false }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(superset1Height, { toValue: 100, duration: 300, useNativeDriver: false }),
        Animated.timing(superset1Opacity, { toValue: 1, duration: 300, useNativeDriver: false }),
      ]).start();
    }
  };

  const toggleSuperset2 = () => {
    setSuperset2Open((prev) => !prev);
    if (superset2Open) {
      Animated.parallel([
        Animated.timing(superset2Height, { toValue: 0, duration: 300, useNativeDriver: false }),
        Animated.timing(superset2Opacity, { toValue: 0, duration: 150, useNativeDriver: false }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(superset2Height, { toValue: 100, duration: 300, useNativeDriver: false }),
        Animated.timing(superset2Opacity, { toValue: 1, duration: 300, useNativeDriver: false }),
      ]).start();
    }
  };

  // if (isLoading) {
  //   return (
  //     <View style={styles.loadingContainer}>
  //       <ActivityIndicator size={50} color="#E87EA1" />
  //       <Text>Loading workout...</Text>
  //     </View>
  //   );
  // }

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>

      <View style={styles.container}>
        <Text style={styles.workoutTitle}>Here's your workout</Text>

        {/* Stretching Section */}
        <TouchableOpacity
          style={[styles.exerciseBlock, stretchingOpen ? styles.exerciseBlockOpen : null]}
          onPress={toggleStretching}
        >
          <Text style={styles.exerciseBlockText}>A: Stretching</Text>
          <Ionicons name={stretchingOpen ? "chevron-up" : "chevron-down"} size={24} color="white" />
        </TouchableOpacity>
        <Animated.View
          style={[
            styles.exerciseDetail,
            { height: stretchingHeight, opacity: stretchingOpacity },
          ]}
        >
          <Text style={styles.exerciseDetailText}>Complete 5 mins of mobility/ stretching.</Text>
        </Animated.View>

        {/* Warm-up Part 1 Section */}
        <TouchableOpacity
          style={[styles.exerciseBlock, warmUp1Open ? styles.exerciseBlockOpen : null]}
          onPress={toggleWarmUp1}
        >
          <Text style={styles.exerciseBlockText}>B: Warm up pt 1</Text>
          <Ionicons name={warmUp1Open ? "chevron-up" : "chevron-down"} size={24} color="white" />
        </TouchableOpacity>
        <Animated.View
          style={[
            styles.exerciseDetail,
            { height: warmUp1Height, opacity: warmUp1Opacity },
          ]}
        >
          <Text style={styles.exerciseDetailText}>Get your heart rate going. Complete a progressive 3-minute build on the ski erg, rower, bike, or assault bike.</Text>
        </Animated.View>

        {/* Warm-up Part 2 Section */}
        <TouchableOpacity
          style={[styles.exerciseBlock, warmUp2Open ? styles.exerciseBlockOpen : null]}
          onPress={toggleWarmUp2}
        >
          <Text style={styles.exerciseBlockText}>C: Warm up pt 2</Text>
          <Ionicons name={warmUp2Open ? "chevron-up" : "chevron-down"} size={24} color="white" />
        </TouchableOpacity>
        <Animated.View
          style={[
            styles.exerciseDetail,
            { height: warmUp2Height, opacity: warmUp2Opacity },
          ]}
        >
          <Text style={styles.exerciseDetailText}></Text>
        </Animated.View>

        {/* Core movement section */}
        <TouchableOpacity
          style={[styles.exerciseBlock, coreMovementOpen ? styles.exerciseBlockOpen : null]}
          onPress={toggleCoreMovement}
        >
          <Text style={styles.exerciseBlockText}>D: Core movement</Text>
          <Ionicons name={coreMovementOpen ? "chevron-up" : "chevron-down"} size={24} color="white" />
        </TouchableOpacity>
        <Animated.View
          style={[
            styles.exerciseDetail,
            { height: coreMovementHeight, opacity: coreMovementOpacity },
          ]}
        >
          <Text style={styles.exerciseDetailText}>{coreMovement ? coreMovement : ''}</Text>
        </Animated.View>


        {/* Superset 1 section */}
        <TouchableOpacity
          style={[styles.exerciseBlock, superset1Open ? styles.exerciseBlockOpen : null]}
          onPress={toggleSuperset1}
        >
          <Text style={styles.exerciseBlockText}>E: Superset 1</Text>
          <Ionicons name={superset1Open ? "chevron-up" : "chevron-down"} size={24} color="white" />
        </TouchableOpacity>
        <Animated.View
          style={[
            styles.exerciseDetail,
            { height: superset1Height, opacity: superset1Opacity },
          ]}
        >
          <Text style={styles.exerciseDetailText}>{superset1 ? superset1.exercise1 : ''}</Text>
          <Text style={styles.exerciseDetailText}>{superset1 ? superset1.exercise2 : ''}</Text>
          <Text style={styles.exerciseDetailText}>{superset1 ? superset1.exercise3 : ''}</Text>
        </Animated.View>

        {/* Superset 2 section */}
        <TouchableOpacity
          style={[styles.exerciseBlock, superset2Open ? styles.exerciseBlockOpen : null]}
          onPress={toggleSuperset2}
        >
          <Text style={styles.exerciseBlockText}>F: Superset 2</Text>
          <Ionicons name={superset2Open ? "chevron-up" : "chevron-down"} size={24} color="white" />
        </TouchableOpacity>
        <Animated.View
          style={[
            styles.exerciseDetail,
            { height: superset2Height, opacity: superset2Opacity },
          ]}
        >
          <Text style={styles.exerciseDetailText}>{superset2 ? superset2.exercise1 : ''}</Text>
          <Text style={styles.exerciseDetailText}>{superset2 ? superset2.exercise2 : ''}</Text>
          <Text style={styles.exerciseDetailText}>{superset2 ? superset2.exercise3 : ''}</Text>
        </Animated.View>

        {/* Action Buttons */}
        <View style={styles.actionButtonGroup}>
          <TouchableOpacity style={[styles.buttonBase, styles.addWorkout]}>
            <Text style={styles.submitButtonText}>Add workout</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.buttonBase, styles.saveWorkout]}>
            <Text style={styles.submitButtonText}>Save for later</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.buttonBase, styles.refreshWorkout]} onPress={() => fetchWorkoutData()}>
            <Text style={styles.submitButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    // padding: 16,
    paddingBottom: 40, // Extra padding to prevent overlap with bottom edge
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    padding: '5%',
  },
  workoutTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'black',
  },
  exerciseBlock: {
    marginTop: 20,
    width: '100%',
    backgroundColor: '#E87EA1',
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '5%',
  },
  exerciseBlockOpen: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  exerciseBlockText: {
    color: 'white',
    fontWeight: 'bold',
  },
  exerciseDetail: {
    backgroundColor: '#E87EA1',
    overflow: 'hidden',
    paddingHorizontal: 15,
    paddingTop: 10,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  exerciseDetailText: {
    fontSize: 16,
    color: 'white',
    paddingBottom: 10,
  },
  actionButtonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  buttonBase: {
    width: '30%',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  addWorkout: {
    backgroundColor: '#E87EA1',
  },
  saveWorkout: {
    backgroundColor: '#207696',
  },
  refreshWorkout: {
    backgroundColor: 'black',
  },
  submitButtonText: {
    color: 'white',
  }
});
