import React, { createContext, useContext, useState } from 'react';
import axios from 'axios';
import ENV from '../../../env'
import { useLoader } from '../context/LoaderContext';
const WorkoutContext = createContext();

export const WorkoutProvider = ({ children }) => {
  const [workoutData, setWorkoutData] = useState([]);
  const [conditioningData, setConditioningData] = useState([]);
  const { setIsBouncerLoading } = useLoader(); // Access loader functions

  const [isLoading, setIsLoading] = useState(false);

  const fetchWorkoutData = async () => {
    setIsBouncerLoading(true);
    console.log("Starting fetchWorkoutData...");
    
    try {
      const url = `${ENV.API_URL}/api/movements/extract-movements/`;
      console.log(`Making request to: ${url}`);
      
      const response = await axios.get(url);
      // console.log("API response received:", response.data);

      setWorkoutData(response.data);
      console.log("Workout data updated in state.");
      
    } catch (error) {
      console.error("Error fetching workout data:");
      console.error("Error message:", error.message);
      if (error.response) {
        console.error("Server responded with status:", error.response.status);
        console.error("Response data:", error.response.data);
      } else if (error.request) {
        console.error("No response received. Request details:", error.request);
      } else {
        console.error("Error setting up request:", error.message);
      }
    } finally {
      setTimeout(() => {
        setIsBouncerLoading(false);
        console.log("Finished fetchWorkoutData. Loading state set to false.");
      }, 0); 
    }
  };

  const fetchConditioningData = async () => {
    setIsLoading(true);
    try {
      const url = `${ENV.API_URL}/api/conditioning_workouts/all/`;
      const response = await axios.get(url);
      setConditioningData(response.data);
      // console.log('conditioning data: ', JSON.stringify(response.data, null, 2))
      
    } catch (error) {
      console.error('Error fetching conditioning data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <WorkoutContext.Provider
      value={{
        workoutData,
        setWorkoutData,
        fetchWorkoutData,
        conditioningData,
        fetchConditioningData,
        isLoading,
      }}
    >
      {children}
    </WorkoutContext.Provider>
  );
};

export const useWorkout = () => useContext(WorkoutContext);