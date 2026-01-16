import chatModel from "../models/chatModel.js";
import { v2 as cloudinary } from 'cloudinary';

// Send text message
const sendMessage = async (req, res) => {
    try {
        const { senderId, senderName, senderRole, receiverId, receiverName, receiverRole, message } = req.body;

        // Create conversation ID (sorted IDs to ensure consistency)
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

        res.json({ success: true, message: newMessage });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Upload and send file
const sendFile = async (req, res) => {
    try {
        const { senderId, senderName, senderRole, receiverId, receiverName, receiverRole } = req.body;
        const file = req.file;

        if (!file) {
            return res.json({ success: false, message: "No file uploaded" });
        }

        // Upload to Cloudinary
        const uploadResult = await cloudinary.uploader.upload(file.path, {
            resource_type: 'auto'
        });

        const conversationId = [senderId, receiverId].sort().join('_');

        const chatData = {
            conversationId,
            senderId,
            senderName,
            senderRole,
            receiverId,
            receiverName,
            receiverRole,
            fileUrl: uploadResult.secure_url,
            fileName: file.originalname,
            fileType: file.mimetype
        };

        const newMessage = new chatModel(chatData);
        await newMessage.save();

        res.json({ success: true, message: newMessage });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Get conversation between two users
const getConversation = async (req, res) => {
    try {
        const { userId1, userId2 } = req.params;
        const conversationId = [userId1, userId2].sort().join('_');

        const messages = await chatModel
            .find({ conversationId })
            .sort({ timestamp: 1 })
            .limit(100); // Load last 100 messages

        res.json({ success: true, messages });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Get all conversations for a user
const getUserConversations = async (req, res) => {
    try {
        const { userId } = req.params;

        // Get all unique conversations
        const messages = await chatModel.find({
            $or: [{ senderId: userId }, { receiverId: userId }]
        }).sort({ timestamp: -1 });

        // Extract unique conversation partners
        const conversationMap = new Map();

        messages.forEach(msg => {
            const partnerId = msg.senderId === userId ? msg.receiverId : msg.senderId;
            const partnerName = msg.senderId === userId ? msg.receiverName : msg.senderName;
            const partnerRole = msg.senderId === userId ? msg.receiverRole : msg.senderRole;

            if (!conversationMap.has(partnerId)) {
                conversationMap.set(partnerId, {
                    partnerId,
                    partnerName,
                    partnerRole,
                    lastMessage: msg.message || 'File',
                    lastMessageTime: msg.timestamp,
                    unreadCount: 0
                });
            }

            // Count unread messages
            if (msg.receiverId === userId && !msg.isRead) {
                conversationMap.get(partnerId).unreadCount++;
            }
        });

        const conversations = Array.from(conversationMap.values());

        res.json({ success: true, conversations });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Mark messages as read
const markAsRead = async (req, res) => {
    try {
        const { conversationId, receiverId } = req.body;

        await chatModel.updateMany(
            { conversationId, receiverId, isRead: false },
            { $set: { isRead: true } }
        );

        res.json({ success: true, message: "Messages marked as read" });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Delete message
const deleteMessage = async (req, res) => {
    try {
        const { messageId } = req.params;

        await chatModel.findByIdAndDelete(messageId);

        res.json({ success: true, message: "Message deleted" });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

export {
    sendMessage,
    sendFile,
    getConversation,
    getUserConversations,
    markAsRead,
    deleteMessage
};
