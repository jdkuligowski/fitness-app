import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { useLoader } from '../context/LoaderContext'; // Import useLoader hook

export default function BouncingLoader() {
    const { isBouncerLoading } = useLoader(); // Access the global loading state

    if (!isBouncerLoading) return null; // Do not render loader if not loading

    return (
        <View style={styles.loadingContainer}>
            <Image
                source={require('../../../assets/images/bouncing-ball-loader-white.gif')} // Replace with your loader GIF
                style={styles.loadingImage}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        ...StyleSheet.absoluteFillObject, // Take up the entire screen
        backgroundColor: 'rgba(0, 0, 0, 0.6)', // Dark transparent background
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999, // Ensure it sits on top of everything
    },
    loadingImage: {
        width: 100,
        height: 100,
    },
});
