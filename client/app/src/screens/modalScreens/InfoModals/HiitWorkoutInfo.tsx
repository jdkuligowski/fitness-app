import React from 'react';
import { View, Text, Modal, Pressable, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function HiitInfoModal({ visible, onClose }) {
    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose} // Android back button
        >
            {/* Dark overlay so tapping outside closes modal */}
            <Pressable style={styles.overlay} onPress={onClose}>
                {/* Press outside to close */}
            </Pressable>

            <View style={styles.bottomSheet}>
                <View style={styles.header}>
                    <Text style={styles.title}>HIIT Workouts</Text>
                    {/* <Pressable style={styles.closeButton} onPress={onClose}>
                        <Text style={{ color: 'white', fontSize: 16 }}>x</Text>
                    </Pressable> */}
                    <Ionicons onPress={onClose} name="close-circle-outline" size={30} color="#4D4D4D" />

                </View>

                <Text style={styles.subHeader}>Tabata</Text>
                <Text style={styles.info}>
                    20 seconds of intense work followed by 10 seconds of rest repeated for the duration.
                </Text>

                <Text style={styles.subHeader}>EMOM (Every Minute on the Minute)</Text>
                <Text style={styles.info}>
                    Start each exercise at the start of each minute. then rest for the remainder of the time in that minute if there is any.
                </Text>

                <Text style={styles.subHeader}>AMRAP (As Many Rounds as Possible)</Text>
                <Text style={styles.info}>
                    Complete as many rounds or reps as possible in the time limit.
                </Text>

                <Text style={styles.subHeader}>30/30 Workouts</Text>
                <Text style={styles.info}>
                    30 seconds of high-intensity effort followed by 30 seconds of rest, repeated for the duration.
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
