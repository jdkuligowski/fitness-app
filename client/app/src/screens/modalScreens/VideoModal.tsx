import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Video } from 'expo-av';
import Ionicons from '@expo/vector-icons/Ionicons';

const VideoModal = ({ visible, movement, onClose }) => {


    return (
        <Modal
            animationType="slide"
            transparent={false}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.modalContainer}>
                {movement?.portrait_video_url ? (
                    <Video
                        source={{ uri: movement.portrait_video_url }}
                        style={styles.fullScreenVideo}
                        resizeMode="contain"
                        useNativeControls
                        shouldPlay
                        onError={(error) => console.error("Video Error:", error)}
                    />
                ) : (
                    <Text style={styles.noVideoText}>Video coming soon</Text>
                )}
                <TouchableOpacity
                    style={styles.closeButton}
                    onPress={onClose}
                >
                    <Ionicons name="close" size={30} color="white" />
                </TouchableOpacity>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        backgroundColor: "black",
        justifyContent: "center",
        alignItems: "center",
    },
    fullScreenVideo: {
        width: "100%",
        height: "100%",
    },
    noVideoText: {
        fontSize: 14,
        color: "gray",
    },
    closeButton: {
        position: "absolute",
        top: 40,
        right: 20,
        backgroundColor: "rgba(0,0,0,0.5)",
        borderRadius: 20,
        padding: 10,
    },
});

export default VideoModal;
