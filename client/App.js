import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Welcome to My Simple Page</Text>
      <Text style={styles.paragraph}>
        This is a simple page built entirely in React Native.
      </Text>
      <Button
        title="Click Me"
        onPress={() => alert("Hello from React Native!")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  paragraph: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
});
