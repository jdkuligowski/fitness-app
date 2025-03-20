import React from 'react';
import { View, Text, Modal, Pressable, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function RunningInfoModal({ visible, onClose }) {
    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose} // For Android back button
        >
            {/* Dark overlay so tapping outside closes modal */}
            <Pressable style={styles.overlay} onPress={onClose}>
                {/* Press outside to close */}
            </Pressable>

            <View style={styles.bottomSheet}>
                <View style={styles.header}>
                    <Text style={styles.title}>Running Workouts</Text>
                    <Ionicons onPress={onClose} name="close-circle-outline" size={30} color="#4D4D4D" />
                </View>

                <Text style={styles.subHeader}>Intervals</Text>
                <Text style={styles.info}>
                    Short bursts of high-intensity running repeated with periods of rest or low-intensity jogging in between. 
                    Helps build speed, power, and cardiovascular capacity.
                </Text>

                <Text style={styles.subHeader}>Tempo Runs</Text>
                <Text style={styles.info}>
                    A steady run at a challenging (but not all-out) pace. Often a mix of faster and slower paces, helping to improve your stamina and speed endurance.
                </Text>

                <Text style={styles.subHeader}>Easy runs</Text>
                <Text style={styles.info}>
                    Low-intensity runs at a conversational pace. 
                    Used to build aerobic base, aid recovery, and reduce injury risk.
                </Text>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    bottomSheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        padding: 20,
        paddingBottom: 50,

    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
    },
    closeButton: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'black',
        paddingHorizontal: 8,
        paddingVertical: 5,
        borderRadius: 10
    },
    subHeader: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: 10,
        marginBottom: 5,
    },
    info: {
        fontSize: 14,
        color: '#333',
        marginBottom: 10,
        lineHeight: 20
    },
});
