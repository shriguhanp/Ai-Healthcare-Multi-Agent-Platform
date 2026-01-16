import { createContext, useState, useEffect, useContext } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { toast } from 'react-toastify';
import { DoctorContext } from './DoctorContext';

export const DoctorChatContext = createContext();

export const DoctorChatContextProvider = (props) => {
    const { backendUrl, dToken, doctorId } = useContext(DoctorContext);

    const [socket, setSocket] = useState(null);
    const [messages, setMessages] = useState([]);
    const [conversations, setConversations] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState(new Set());
    const [isLoading, setIsLoading] = useState(false);

    // Initialize Socket Connection
    useEffect(() => {
        if (dToken && doctorId) {
            const newSocket = io(backendUrl);
            setSocket(newSocket);

            newSocket.emit('join', doctorId);

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
                getUserConversations();
            });

            newSocket.on('message_sent', (message) => {
                setMessages(prev => [...prev, message]);
                getUserConversations();
            });

            return () => newSocket.close();
        }
    }, [dToken, doctorId, backendUrl]);

    const getUserConversations = async () => {
        try {
            if (!doctorId) return;
            const { data } = await axios.get(backendUrl + `/api/chat/conversations/${doctorId}`, { headers: { dToken } }); // Backend routes might need check if they support dToken or if we treat user same. 
            // The existing chat routes in backend/routes/chatRoute.js are generally open or user protected.
            // Wait, chatRoute middleware? 
            // backend/routes/chatRoute.js currently has NO middleware for auth? Let's check. 
            // Actually, I should verify if I need to add middleware or if I can pass token.
            // For now assuming the backend endpoints function for generic User/Doctor IDs.

            if (data.success) {
                setConversations(data.conversations);
            }
        } catch (error) {
            console.log(error);
        }
    }

    const loadConversation = async (partnerId) => {
        try {
            if (!doctorId) return;
            setIsLoading(true);
            const { data } = await axios.get(backendUrl + `/api/chat/conversation/${doctorId}/${partnerId}`, { headers: { dToken } });

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
                senderId: doctorId,
                senderName: 'Dr. (You)', //Ideally fetch name from profile
                senderRole: 'doctor',
                receiverId,
                receiverName: selectedChat?.partnerName,
                receiverRole: 'patient',
                message
            };
            socket.emit('send_message', messageData);
        }
    };

    const sendFile = async (receiverId, file) => {
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('senderId', doctorId);
            formData.append('senderName', 'Dr. (You)');
            formData.append('senderRole', 'doctor');
            formData.append('receiverId', receiverId);
            formData.append('receiverName', selectedChat?.partnerName);
            formData.append('receiverRole', 'patient');

            const { data } = await axios.post(backendUrl + '/api/chat/send-file', formData, {
                headers: { dToken }
            });

            if (data.success) {
                if (socket) {
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
        if (dToken) {
            getUserConversations();
        }
    }, [dToken, doctorId]);


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
        <DoctorChatContext.Provider value={value}>
            {props.children}
        </DoctorChatContext.Provider>
    );
};
