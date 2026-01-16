import { Server } from 'socket.io';
import chatModel from './models/chatModel.js';

let io;

// Initialize Socket.io server
export const initializeSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: ["http://localhost:5173", "http://localhost:5174"],
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    // Store online users
    const onlineUsers = new Map();

    io.on('connection', (socket) => {
        console.log('✅ User connected:', socket.id);

        // User joins with their ID
        socket.on('join', (userId) => {
            onlineUsers.set(userId, socket.id);
            socket.join(userId);
            console.log(`User ${userId} joined with socket ${socket.id}`);

            // Broadcast online status to all
            io.emit('user_online', userId);
        });

        // Send message event
        socket.on('send_message', async (data) => {
            try {
                const { senderId, senderName, senderRole, receiverId, receiverName, receiverRole, message } = data;

                const conversationId = [senderId, receiverId].sort().join('_');

                const chatData = {
                    conversationId,
                    senderId,
                    senderName,
                    senderRole,
                    receiverId,
                    receiverName,
                    receiverRole,
                    message
                };

                const newMessage = new chatModel(chatData);
                await newMessage.save();

                // Send to receiver if online
                const receiverSocketId = onlineUsers.get(receiverId);
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit('receive_message', newMessage);
                }

                // Send back to sender as confirmation
                socket.emit('message_sent', newMessage);

            } catch (error) {
                console.error('Error sending message:', error);
                socket.emit('message_error', { error: error.message });
            }
        });

        // Typing indicator
        socket.on('typing', (data) => {
            const { senderId, receiverId } = data;
            const receiverSocketId = onlineUsers.get(receiverId);
            if (receiverSocketId) {
                io.to(receiverSocketId).emit('typing_indicator', { userId: senderId });
            }
        });

        // Stop typing indicator
        socket.on('stop_typing', (data) => {
            const { senderId, receiverId } = data;
            const receiverSocketId = onlineUsers.get(receiverId);
            if (receiverSocketId) {
                io.to(receiverSocketId).emit('stop_typing_indicator', { userId: senderId });
            }
        });

        // Mark messages as read
        socket.on('mark_read', async (data) => {
            try {
                const { conversationId, receiverId } = data;

                await chatModel.updateMany(
                    { conversationId, receiverId, isRead: false },
                    { $set: { isRead: true } }
                );

                // Notify sender that messages were read
                const senderId = conversationId.replace(receiverId, '').replace('_', '');
                const senderSocketId = onlineUsers.get(senderId);
                if (senderSocketId) {
                    io.to(senderSocketId).emit('messages_read', { conversationId });
                }

            } catch (error) {
                console.error('Error marking as read:', error);
            }
        });

        // Handle disconnection
        socket.on('disconnect', () => {
            console.log('❌ User disconnected:', socket.id);

            // Find and remove user from online users
            for (let [userId, socketId] of onlineUsers.entries()) {
                if (socketId === socket.id) {
                    onlineUsers.delete(userId);
                    io.emit('user_offline', userId);
                    console.log(`User ${userId} went offline`);
                    break;
                }
            }
        });
    });

    console.log('✅ Socket.io server initialized');
    return io;
};

// Get Socket.io instance
export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized');
    }
    return io;
};
