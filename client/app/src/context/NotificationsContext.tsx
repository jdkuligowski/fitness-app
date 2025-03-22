import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import ENV from '../../../env'; // Adjust the path to your env
import { Alert } from 'react-native';

export const NotificationsContext = createContext();

export const NotificationsProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch all notifications from the backend
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) return; // If no userId, skip
  
      const response = await axios.get(
        `${ENV.API_URL}/api/notifications/list/?user_id=${userId}`
      );
      // if notifications are in response.data.notifications
      const rawNotifications = response.data.notifications || [];
  
      // Filter out any that haven't been sent
      const sentNotifications = rawNotifications.filter(n => n.sent);
  
      setNotifications(sentNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };
  

  // Clear all notifications for the user
  const clearNotifications = async () => {
    try {
      setLoading(true);
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) return;
      await axios.post(`${ENV.API_URL}/api/notifications/clear/`, {
        user_id: userId,
      });
      // If successful, set local state to empty
      setNotifications([]);
    } catch (error) {
      console.error('Error clearing notifications:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Where you trigger "Clear All"
  const confirmClearNotifications = () => {
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to remove all notifications?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: clearNotifications, // calls the real clear function
        },
      ],
      { cancelable: true }
    );
  };

  // Fetch on mount
  useEffect(() => {
    fetchNotifications();
  }, []);

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        loading,
        fetchNotifications,
        confirmClearNotifications,
        clearNotifications
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};
