// NotificationsModal.js
import React, { useContext } from 'react';
import { View, Text, Modal, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { NotificationsContext } from '../../context/NotificationsContext'
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colours } from '../../components/styles';

export default function NotificationsModal({ visible, onClose }) {
    const { notifications, clearNotifications, confirmClearNotifications } = useContext(NotificationsContext);

    console.log('Notifications: ', notifications)
    const handleClearAll = async () => {
        await confirmClearNotifications();
        // onClose();
    };

    const renderNotification = ({ item }) => {
        return (
            <View style={styles.notificationItem}>
                <Text style={styles.title}>{item.subtitle}</Text>
                <Text style={styles.body}>{item.body}</Text>
                <Text style={styles.date}>
                    {new Date(item.scheduled_datetime).toLocaleString()}
                </Text>
            </View>
        );
    };

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
            <View style={styles.container}>
                {/* Header row */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Notifications</Text>
                    <View style={styles.rightHeader}>
                    <TouchableOpacity style={styles.clearButton} onPress={handleClearAll}>
                            <Text style={styles.clearButtonText}>Clear</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.closeIcon} onPress={onClose}>
                            <Ionicons name="close-circle-outline" size={26} color="black" />
                        </TouchableOpacity>

                    </View>
                </View>

                {/* Notification list */}
                {notifications.length > 0 ? (
                    <FlatList
                        data={notifications}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={renderNotification}
                        contentContainerStyle={styles.listContent}
                    />
                ) : (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>All clear</Text>
                    </View>
                )}
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colours.primaryBackground,
        paddingTop: 70,
        // marginBottom: 60,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingHorizontal: 16,

    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    clearButton: {
        backgroundColor: 'black',
        padding: 5,
        borderRadius: 10,
        width: 70,
        marginRight: 10,
    },
    clearButtonText: {
        color: '#fff',
        textAlign: 'center',
    },
    closeIcon: {
        marginLeft: 10,
    },
    listContent: {
        paddingHorizontal: 16,
    },
    notificationItem: {
        backgroundColor: '#f9f9f9',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 8,
        marginBottom: 8,
    },
    title: {
        fontWeight: '600',
        fontSize: 16,
        marginBottom: 4,
    },
    body: {
        fontSize: 14,
        color: '#333',
    },
    date: {
        fontSize: 12,
        color: '#666',
        marginTop: 6,
        textAlign: 'right',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        color: '#666',
    },
    rightHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
});
