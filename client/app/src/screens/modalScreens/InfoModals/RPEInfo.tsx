import React from 'react';
import { View, Text, Modal, Pressable, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function RPEInfoModal({ visible, onClose }) {
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
                    <Text style={styles.title}>What is RPE?</Text>
                    <Ionicons onPress={onClose} name="close-circle-outline" size={30} color="#4D4D4D" />
                </View>
                <Text style={styles.info}>
                    RPE (Rate of Perceived Exertion) is a subjective measure of how hard
                    you feel you're working during exercise.
                </Text>
                <Text style={styles.info}>

                    It uses a 1–10 scale, where 1 is “extremely easy”
                    and 10 is “maximal effort.”
                </Text>

                <Text style={styles.info}>

                    By monitoring your RPE, you can
                    better adjust intensity based on how challenging it feels to you.
                    Typically to ensure progress you should be working consistently in the 7-9 range.
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
    title: {
        fontSize: 18,
        fontWeight: '700',
    },
    info: {
        fontSize: 14,
        color: '#333',
        marginBottom: 20,
        lineHeight: 20
    },
    closeButton: {
        alignSelf: 'flex-end',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'black',
        paddingHorizontal: 8,
        paddingVertical: 5,
        borderRadius: 10
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10

    },
});
