import React from 'react';
import { View, Text, Modal, Pressable, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function HyroxDivisionInfoModal({ visible, onClose }) {
    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            {/* Dark overlay so tapping outside closes modal */}
            <Pressable style={styles.overlay} onPress={onClose}>
                {/* Press outside to close */}
            </Pressable>

            <View style={styles.bottomSheet}>
                {/* Header with close icon */}
                <View style={styles.header}>
                    <Text style={styles.title}>Hyrox Divisions</Text>
                    <Ionicons onPress={onClose} name="close-circle-outline" size={30} color="#4D4D4D" />
                </View>

                {/* Women’s */}
                <Text style={styles.subHeader}>Women’s</Text>
                <View style={styles.divisionSection}>
                    <Text style={styles.bulletPoint}>• Sled Push: 102kg incl. Sled</Text>
                    <Text style={styles.bulletPoint}>• Sled Pull: 78kg incl. Sled</Text>
                    <Text style={styles.bulletPoint}>• Farmer’s Carry: 2×16kg kettlebells</Text>
                    <Text style={styles.bulletPoint}>• Sandbag Lunge: 10kg</Text>
                    <Text style={styles.bulletPoint}>• Wall Balls: 4kg</Text>
                    {/* Add more as needed */}
                </View>

                {/* Women’s Pro */}
                <Text style={styles.subHeader}>Women’s Pro</Text>
                <View style={styles.divisionSection}>
                    <Text style={styles.bulletPoint}>• Sled Push: 152kg incl. Sled</Text>
                    <Text style={styles.bulletPoint}>• Sled Pull: 102kg incl. Sled</Text>
                    <Text style={styles.bulletPoint}>• Farmer’s Carry: 2×24kg kettlebells</Text>
                    <Text style={styles.bulletPoint}>• Sandbag Lunge: 20kg</Text>
                    <Text style={styles.bulletPoint}>• Wall Balls: 6kg</Text>
                    {/* Add more as needed */}
                </View>

                {/* Men’s */}
                <Text style={styles.subHeader}>Men’s</Text>
                <View style={styles.divisionSection}>
                    <Text style={styles.bulletPoint}>• Sled Push: 152kg incl. Sled</Text>
                    <Text style={styles.bulletPoint}>• Sled Pull: 102kg incl. Sled</Text>
                    <Text style={styles.bulletPoint}>• Farmer’s Carry: 2×24kg kettlebells</Text>
                    <Text style={styles.bulletPoint}>• Sandbag Lunge: 20kg</Text>
                    <Text style={styles.bulletPoint}>• Wall Balls: 6kg</Text>
                    {/* Add more as needed */}
                </View>

                {/* Men’s Pro */}
                <Text style={styles.subHeader}>Men’s Pro</Text>
                <View style={styles.divisionSection}>
                    <Text style={styles.bulletPoint}>• Sled Push: 202kg incl. Sled</Text>
                    <Text style={styles.bulletPoint}>• Sled Pull: 152kg incl. Sled</Text>
                    <Text style={styles.bulletPoint}>• Farmer’s Carry: 2×32kg kettlebells</Text>
                    <Text style={styles.bulletPoint}>• Sandbag Lunge: 30kg</Text>
                    <Text style={styles.bulletPoint}>• Wall Balls: 9kg</Text>
                    {/* Add more as needed */}
                </View>
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
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
    },
    subHeader: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: 10,
        marginBottom: 5,
    },
    divisionSection: {
        marginBottom: 10,
        // backgroundColor: '#f9f9f9',
        borderRadius: 8,
        // padding: 10,
    },
    bulletPoint: {
        fontSize: 14,
        color: '#333',
        marginBottom: 4,
        lineHeight: 20,
    },
});
