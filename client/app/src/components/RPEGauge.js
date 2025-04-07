import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import { Colours } from './styles';

const RPEGauge = ({ score }) => {
    return (
        <View style={styles.container}>
            <AnimatedCircularProgress
                size={65}
                width={7}
                fill={(score / 10) * 100} // Ensure the score is between 0 and 100
                tintColor={Colours.buttonColour}
                backgroundColor={Colours.primaryBackground}
                rotation={-120}
                arcSweepAngle={240}
                lineCap="round"
            >
                {() => (
                    <View style={styles.innerContent}>
                        <Text style={styles.scoreText}>{score}</Text>
                        <Text style={styles.label}>RPE</Text>
                    </View>
                )}
            </AnimatedCircularProgress>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    innerContent: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scoreText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    label: {
        fontSize: 12,
        color: '#9E9E9E',
    },
});

export default RPEGauge;
