import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, SafeAreaView, StatusBar,
    KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, Image
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import ENV from '../../../../env';
import { Colours } from '../../components/styles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns'; // Import date formatting library

const ChatOverviewScreen = ({ route }) => {
    const navigation = useNavigation();
    const { roomId, userId, userData } = route.params; // Pass room ID from navigation params
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);

    // Fetch messages from the server
    const fetchMessages = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${ENV.API_URL}/api/chat/rooms/${roomId}/messages/`);
            setMessages(response.data); // Replace the message list with the latest data
        } catch (error) {
            console.error('Error fetching messages:', error.response?.data || error.message);
        } finally {
            setLoading(false);
        }
    };

    // Send a new message to the server
    const sendMessage = async () => {
        if (!newMessage.trim()) return;
    
        const userId = await AsyncStorage.getItem("userId"); // Retrieve the user ID from local storage
    
        try {
            const response = await axios.post(
                `${ENV.API_URL}/api/chat/rooms/${roomId}/messages/?user_id=${userId}`,
                { content: newMessage }
            );
    
            // Prepend the new message for inverted FlatList
            const newMessages = [response.data, ...messages];
    
            setMessages(newMessages); // Update state with new messages
            setNewMessage(''); // Clear input field
        } catch (error) {
            console.error('Error sending message:', error.response?.data || error.message);
        }
    };
    
    


    // Periodically reload messages
    useEffect(() => {
        fetchMessages(); // Initial fetch
        const interval = setInterval(() => {
            fetchMessages(); // Reload every 10 seconds
        }, 100000);

        return () => clearInterval(interval); // Clear interval on unmount
    }, [roomId]);


    // Render individual messages with date grouping
    const renderMessage = ({ item, index }) => {
        const isCurrentUser = item.owner.id === userId;

        // Determine if the sender is the same as the previous message
        const isSameSenderAsPrevious =
            index < messages.length - 1 &&
            messages[index + 1].owner.id === item.owner.id &&
            format(new Date(messages[index + 1].timestamp), 'yyyy-MM-dd') ===
            format(new Date(item.timestamp), 'yyyy-MM-dd'); // Same day check

        // Determine if the sender is the same as the next message
        const isSameSenderAsNext =
            index > 0 &&
            messages[index - 1].owner.id === item.owner.id &&
            format(new Date(messages[index - 1].timestamp), 'yyyy-MM-dd') ===
            format(new Date(item.timestamp), 'yyyy-MM-dd'); // Same day check

        // Determine if this is the first message of a new day
        const isNewDay =
            index === messages.length - 1 || // First message in list
            format(new Date(messages[index + 1]?.timestamp), 'yyyy-MM-dd') !==
            format(new Date(item.timestamp), 'yyyy-MM-dd');

        // Determine if this is the last message in the stack
        const isLastInStack = !isSameSenderAsNext;

        const messageTime = format(new Date(item.timestamp), 'HH:mm');

        return (
            <View>
                {/* Date Header */}
                {isNewDay && (
                    <View style={styles.dateHeader}>
                        <Text style={styles.dateHeaderText}>
                            {format(new Date(item.timestamp), 'EEEE, MMM dd')}
                        </Text>
                    </View>
                )}

                {/* Message Group */}
                <View style={styles.messageGroup}>
                    {/* Profile Image or Initials for Other Users */}
                    {!isCurrentUser && (
                        <View style={styles.profileContainer}>
                            {isLastInStack || isNewDay ? (
                                item.owner.profile_image ? (
                                    <Image
                                        source={{ uri: item.owner.profile_image }}
                                        style={styles.profileImage}
                                    />
                                ) : (
                                    <View style={styles.initialsContainer}>
                                        <Text style={styles.initialsText}>
                                            {item.owner.first_name[0]}
                                            {item.owner.last_name[0]}
                                        </Text>
                                    </View>
                                )
                            ) : (
                                <View style={styles.emptyProfileSpace} />
                            )}
                        </View>
                    )}

                    {/* Message Bubble */}
                    <View
                        style={[
                            styles.messageContainer,
                            isCurrentUser ? styles.myMessage : styles.otherMessage,
                        ]}
                    >
                        <View
                            style={[
                                styles.messageBubble,
                                isCurrentUser ? styles.myMessageBubble : styles.otherMessageBubble,
                            ]}
                        >
                            {/* Show the user's name only for the first message in a stack */}
                            {!isCurrentUser && !isSameSenderAsPrevious && (
                                <Text style={styles.messageUser}>
                                    {item.owner.first_name} {item.owner.last_name}
                                </Text>
                            )}
                            <Text style={styles.messageContent}>{item.content}</Text>
                            <Text style={styles.messageTime}>{messageTime}</Text>
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor="#F6F3DC" />
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <KeyboardAvoidingView
                    style={styles.chatPage}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={10} // Adjust for your header height
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => navigation.goBack()}
                        >
                            <Ionicons name="arrow-back" size={24} color="black" />
                        </TouchableOpacity>
                        <Text style={styles.headingText}>Chat with us</Text>
                    </View>

                    {/* Chat Window */}
                    <View style={styles.chatWindow}>
                        <FlatList
                            data={messages}
                            renderItem={renderMessage}
                            keyExtractor={(item, index) => index.toString()}
                            contentContainerStyle={styles.chatResponses}
                            inverted={true}
                            scrollEnabled={true}
                            scrollEventThrottle={16} 
                            keyboardShouldPersistTaps="handled"
                        />
                        <View style={styles.inputBox}>
                            <TextInput
                                style={styles.input}
                                value={newMessage}
                                onChangeText={setNewMessage}
                                placeholder="Type a message..."
                                onSubmitEditing={sendMessage}
                            />
                            <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
                                <Ionicons name="send-outline" size={16} color="white" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Input Box */}

                </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
        </SafeAreaView>
    );
};

export default ChatOverviewScreen;

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Colours.primaryBackground,
    },
    chatPage: {
        flexGrow: 1,
        backgroundColor: Colours.primaryBackground,
    },
    header: {
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'black',
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    headingText: {
        fontSize: 20,
        fontWeight: '600',
        color: 'black',
        marginLeft: 10,
    },
    chatWindow: {
        backgroundColor: 'white',
        marginHorizontal: 20,
        flex: 1,
        borderRadius: 20,
        borderTopWidth: 1,
        borderLeftWidth: 1,
        borderRightWidth: 4,
        borderBottomWidth: 4,
        padding: 10,
    },
    chatResponses: {
        flexGrow: 1,
    },  
    inputBox: {
        margin: 10,
        padding: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '95%',
        borderWidth: 1,
        borderColor: '#A9A9C7',
        borderRadius: 10,
    },
    input: {
        width: '80%',
    },
    sendButton: {
        backgroundColor: 'black',
        padding: 8,
        borderRadius: 20,
    },
    messageGroup: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginVertical: 4,
    },
    dateHeader: {
        alignItems: 'center',
        marginVertical: 10,
    },
    dateHeaderText: {
        fontSize: 14,
        color: '#888',
    },
    profileContainer: {
        marginRight: 0,
        width: 30, // Fixed width to reserve space

    },
    emptyProfileSpace: {
        width: 30, // Fixed width to maintain alignment
    },
    profileImage: {
        width: 25,
        height: 25,
        borderRadius: 20,
    },
    initialsContainer: {
        width: 25,
        height: 25,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#D6D6D6',
    },
    initialsText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: 'white',
    },
    // Message container and alignment
    messageContainer: {
        flex: 1,
    },
    myMessage: {
        alignItems: 'flex-end',
    },
    otherMessage: {
        alignItems: 'flex-start',
    },
    // Message bubble styles
    messageBubble: {
        maxWidth: '75%',
        padding: 10,
        borderRadius: 15,
        marginVertical: 0,
    },
    stackedMessage: {
        marginVertical: 1, // Reduced margin for stacked messages
    },
    myMessageBubble: {
        backgroundColor: '#D6F7F4', // Light green for current user
        borderBottomRightRadius: 0,
    },
    otherMessageBubble: {
        backgroundColor: '#E0DCF6', // Light blue for others
        borderBottomLeftRadius: 0,
    },
    messageContent: {
        fontSize: 14,
    },
    messageTime: {
        fontSize: 10,
        color: '#888',
        marginTop: 2,
        alignSelf: 'flex-end',
    },
    messageUser: {
        fontWeight: 600,
        fontSize: 13,
    },
});
