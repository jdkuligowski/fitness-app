import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  SafeAreaView,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  StatusBar,
  Platform,
  Keyboard,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ENV from '../../../../env';
import { Colours } from '../../components/styles';

export default function EditPreferencesScreen({ navigation, route }) {
  const { userData, getUser } = route.params; // destructure from params if needed

  // State to store the user’s preferences
  const [formData, setFormData] = useState({
    fitnessGoal: '',
    exerciseFrequency: '',
    exerciseExclusions: [],
    five_k_mins: '',
    five_k_secs: '',
  });

  // For multi-select exclusions, store all possible options
  const [availableExclusions] = useState([
    'Running',
    'Rowing',
    'Ski',
    'HIIT',
  ]);
  const [availableGoals] = useState([
    'Get stronger',
    'Get fitter',
    'Get more lean',
    'Get bigger',
  ]);

  // We'll load user ID from async storage or context
  const [userId, setUserId] = useState(null);

  // Example: If you want to load userData from route params into formData:
  useEffect(() => {
    (async () => {
      const storedId = await AsyncStorage.getItem('userId');
      if (storedId) setUserId(storedId);
    })();

    if (userData) {
      // Map the server field names to your local state
      // e.g. server => "fitness_goals" => local => "fitnessGoal"
      const existingGoal = userData.fitness_goals || '';
      const existingFreq = userData.exercise_regularity
        ? userData.exercise_regularity.toString()
        : '';

      // Parse non_negotiable_dislikes as a comma-separated string => array
      const existingExclusions = userData.non_negotiable_dislikes
        ? userData.non_negotiable_dislikes
            .split(',')
            .map((ex) => ex.trim())
            .filter(Boolean)
        : [];

      setFormData({
        fitnessGoal: existingGoal,
        exerciseFrequency: existingFreq,
        exerciseExclusions: existingExclusions,
        five_k_mins: userData.five_k_mins?.toString() || '',
        five_k_secs: userData.five_k_secs?.toString() || '',
      });
    }
  }, [userData]);

  // Toggle the single “fitnessGoal” since it's not multi-select – 
  // or adapt if you do want multiple
  const handleGoalSelect = (goal) => {
    setFormData((prev) => ({
      ...prev,
      fitnessGoal: prev.fitnessGoal === goal ? '' : goal,
    }));
  };

  // Multi-select for "exerciseExclusions"
  const handleExclusionToggle = (item) => {
    setFormData((prev) => {
      const { exerciseExclusions } = prev;
      if (exerciseExclusions.includes(item)) {
        // remove it
        return {
          ...prev,
          exerciseExclusions: exerciseExclusions.filter((ex) => ex !== item),
        };
      }
      // add it
      return {
        ...prev,
        exerciseExclusions: [...exerciseExclusions, item],
      };
    });
  };

  const handleSave = async () => {
    try {
      if (!userId) {
        Alert.alert('Error', 'No user ID found. Unable to update preferences.');
        return;
      }
      if (!formData.fitnessGoal || !formData.exerciseFrequency) {
        Alert.alert('Error', 'Please complete your fitness goal and frequency.');
        return;
      }

      const payload = {
        fitnessGoal: formData.fitnessGoal,
        exerciseFrequency: parseInt(formData.exerciseFrequency, 10) || 0,
        five_k_mins: parseInt(formData.five_k_mins, 10) || 0,
        five_k_secs: parseInt(formData.five_k_secs, 10) || 0,
        // For multi-select exclusions, join with commas
        exerciseExclusions: formData.exerciseExclusions.join(','),
      };

      const response = await axios.put(
        `${ENV.API_URL}/api/auth/onboarding/${userId}/`,
        payload
      );
      if (response.status === 200) {
        navigation.goBack();
        Alert.alert('Success', 'Your preferences have been updated.');
      } else {
        Alert.alert('Error', 'Failed to update preferences. Please try again.');
      }
    } catch (error) {
      console.error('handleSave error:', error);
      Alert.alert('Error', 'An error occurred while saving your preferences.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F6F3DC" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView style={styles.container}>
            <View style={styles.profilePageContainer}>

              {/* Header */}
              <View style={styles.header}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => navigation.goBack()}
                >
                  <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.headingText}>Edit Preferences</Text>
              </View>

              {/* Content Container */}
              <View style={styles.content}>
                {/* Fitness Goal */}
                <Text style={styles.label}>Fitness Goal</Text>
                <View style={styles.goalContainer}>
                  {availableGoals.map((goal) => {
                    const isSelected = formData.fitnessGoal === goal;
                    return (
                      <TouchableOpacity
                        key={goal}
                        style={[
                          styles.selectableBox,
                          isSelected ? styles.boxSelected : styles.boxUnselected,
                        ]}
                        onPress={() => handleGoalSelect(goal)}
                      >
                        <Text style={styles.selectableBoxText}>{goal}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Exercise Frequency */}
                <Text style={styles.label}>Exercise frequency (days/week)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 3"
                  value={String(formData.exerciseFrequency)}
                  onChangeText={(val) => {
                    if (/^\d*$/.test(val)) {
                      setFormData((prev) => ({ ...prev, exerciseFrequency: val }));
                    }
                  }}
                  keyboardType="numeric"
                />

                {/* Exclusions (multi-select) */}
                <Text style={styles.label}>Exercise Exclusions (pick any)</Text>
                <View style={styles.exclusionsContainer}>
                  {availableExclusions.map((item) => {
                    const isSelected = formData.exerciseExclusions.includes(item);
                    return (
                      <TouchableOpacity
                        key={item}
                        style={[
                          styles.selectableBox,
                          isSelected ? styles.boxSelected : styles.boxUnselected,
                        ]}
                        onPress={() => handleExclusionToggle(item)}
                      >
                        <Text style={styles.selectableBoxText}>{item}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* 5k Time */}
                <Text style={styles.label}>Current 5k Time (Optional)</Text>
                <View style={styles.timeRow}>
                  <TextInput
                    style={[styles.input, styles.timeInputLeft]}
                    placeholder="Min"
                    value={formData.five_k_mins}
                    onChangeText={(val) => {
                      if (/^\d*$/.test(val)) {
                        setFormData((prev) => ({ ...prev, five_k_mins: val }));
                      }
                    }}
                    keyboardType="numeric"
                    maxLength={2}
                  />
                  <TextInput
                    style={[styles.input, styles.timeInputRight]}
                    placeholder="Sec"
                    value={formData.five_k_secs}
                    onChangeText={(val) => {
                      if (/^\d*$/.test(val)) {
                        setFormData((prev) => ({ ...prev, five_k_secs: val }));
                      }
                    }}
                    keyboardType="numeric"
                    maxLength={2}
                  />
                </View>

                {/* Save Button */}
                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>

              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colours.primaryBackground,
  },
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  profilePageContainer: {
    flexGrow: 1,
    backgroundColor: Colours.primaryBackground,
  },
  header: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
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
  headingText: {
    fontSize: 20,
    fontWeight: '600',
    color: 'black',
    marginLeft: 10,
  },

  content: {
    margin: 20,
  },
  label: {
    fontSize: 14,
    color: '#7B7C8C',
    fontWeight: Platform.OS === 'ios' ? '600' : 'bold',
    marginBottom: 8,
  },

  // Goals and Exclusions
  goalContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  exclusionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  selectableBox: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 15,
    marginRight: 8,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    width: 130,
  },
  boxSelected: {
    backgroundColor: '#F3F3FF',
    borderColor: 'black',
    borderRightWidth: 4, 
    borderBottomWidth: 4,
    borderWidth: 1,
  },
  boxUnselected: {
    backgroundColor: 'white',
    borderColor: '#A9A9C7',
  },
  selectableBoxText: {
    color: '#000',
  },

  // Frequency + 5K Time
  input: {
    backgroundColor: 'white',
    borderColor: '#A9A9C7',
    borderWidth: 1,
    padding: 15,
    borderRadius: 16,
    marginBottom: 16,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  timeInputLeft: {
    width: 80,
    marginRight: 8,
  },
  timeInputRight: {
    width: 80,
    marginLeft: 8,
  },

  // Save button
  saveButton: {
    backgroundColor: 'black',
    borderRadius: 30,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: Platform.OS === 'ios' ? '600' : 'bold',
  },
});
