import { createContext, useState, useEffect, useContext } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AppContext } from './AppContext';

export const ChatContext = createContext();

export const ChatContextProvider = (props) => {
    const { backendUrl, token, userData } = useContext(AppContext);

    const [socket, setSocket] = useState(null);
    const [messages, setMessages] = useState([]);
    const [conversations, setConversations] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState(new Set());
    const [isLoading, setIsLoading] = useState(false);

    // Initialize Socket Connection
    useEffect(() => {
        if (token && userData) {
            const newSocket = io(backendUrl);
            setSocket(newSocket);

            newSocket.emit('join', userData._id);

            newSocket.on('user_online', (userId) => {
                setOnlineUsers(prev => new Set(prev).add(userId));
            });

            newSocket.on('user_offline', (userId) => {
                setOnlineUsers(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(userId);
                    return newSet;
                });
            });

            newSocket.on('receive_message', (message) => {
                setMessages(prev => [...prev, message]);
                // Update conversation list logic to be added
                getUserConversations();
            });

            newSocket.on('message_sent', (message) => {
                setMessages(prev => [...prev, message]);
                getUserConversations();
            });


            return () => newSocket.close();
        }
    }, [token, userData, backendUrl]);

    const getUserConversations = async () => {
        try {
            if (!userData) return;
            const { data } = await axios.get(backendUrl + `/api/chat/conversations/${userData._id}`, { headers: { token } });
            if (data.success) {
                setConversations(data.conversations);
            }
        } catch (error) {
            console.log(error);
        }
    }

    const loadConversation = async (partnerId) => {
        try {
            if (!userData) return;
            setIsLoading(true);
            const { data } = await axios.get(backendUrl + `/api/chat/conversation/${userData._id}/${partnerId}`, { headers: { token } });

            if (data.success) {
                setMessages(data.messages);
            }
            setIsLoading(false);
        } catch (error) {
            console.log(error);
            setIsLoading(false);
        }
    }

    const sendMessage = async (receiverId, message) => {
        if (socket) {
            const messageData = {
                senderId: userData._id,
                senderName: userData.name,
                senderRole: 'patient', // Can be dynamic if we unify doctor/patient apps
                receiverId,
                receiverName: selectedChat?.partnerName,
                receiverRole: 'doctor', // Assuming patient talks to doctor
                message
            };
            socket.emit('send_message', messageData);
        }
    };

    const sendFile = async (receiverId, file) => {
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('senderId', userData._id);
            formData.append('senderName', userData.name);
            formData.append('senderRole', 'patient');
            formData.append('receiverId', receiverId);
            // Need to get receiver details, assume selectedChat has them
            formData.append('receiverName', selectedChat?.partnerName);
            formData.append('receiverRole', 'doctor');

            const { data } = await axios.post(backendUrl + '/api/chat/send-file', formData, {
                headers: { token }
            });

            if (data.success) {
                // Socket will handle the update via message_sent or we can manually add
                if (socket) {
                    // Notify receiver via socket about the file? 
                    // The backend controller usually emits, but in our backend logic we might rely on simple polling or separate socket event. 
                    // Wait, the backend controller just saves to DB. 
                    // We should probably emit a socket event for file too or let the receiver poll. 
                    // Actually, looking at backend/controllers/chatController.js, it just saves.
                    // Ideally backend should emit 'receive_message' after save.
                    // For now, let's just refresh.
                    getUserConversations();
                    loadConversation(receiverId);
                }
            } else {
                toast.error(data.message);
            }

        } catch (error) {
            toast.error(error.message);
        }
    }

    useEffect(() => {
        if (token) {
            getUserConversations();
        }
    }, [token, userData]);


    const value = {
        socket,
        messages,
        setMessages,
        conversations,
        getUserConversations,
        selectedChat,
        setSelectedChat,
        loadConversation,
        sendMessage,
        sendFile,
        onlineUsers,
        isLoading
    };

    return (
        <ChatContext.Provider value={value}>
            {props.children}
        </ChatContext.Provider>
    );
};
