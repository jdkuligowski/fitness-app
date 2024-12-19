import React, { createContext, useContext, useState } from 'react';
import axios from 'axios';
import ENV from '../../../env'

const WorkoutContext = createContext();

export const WorkoutProvider = ({ children }) => {
  const [workoutData, setWorkoutData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchWorkoutData = async () => {
    setIsLoading(true);
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
        setIsLoading(false);
        console.log("Finished fetchWorkoutData. Loading state set to false.");
      }, 0); 
    }
  };

  return (
    <WorkoutContext.Provider value={{ workoutData, setWorkoutData, fetchWorkoutData, isLoading }}>
      {children}
    </WorkoutContext.Provider>
  );
};

export const useWorkout = () => useContext(WorkoutContext);
