import mongoose from "mongoose";

const chatSchema = new mongoose.Schema({
    conversationId: { type: String, required: true, index: true },
    senderId: { type: String, required: true },
    senderName: { type: String, required: true },
    senderRole: { type: String, required: true, enum: ['patient', 'doctor'] },
    receiverId: { type: String, required: true },
    receiverName: { type: String, required: true },
    receiverRole: { type: String, required: true, enum: ['patient', 'doctor'] },
    message: { type: String, default: '' },
    fileUrl: { type: String, default: '' },
    fileName: { type: String, default: '' },
    fileType: { type: String, default: '' },
    timestamp: { type: Number, default: Date.now },
    isRead: { type: Boolean, default: false }
}, { minimize: false });

// Index for faster queries
chatSchema.index({ conversationId: 1, timestamp: -1 });
chatSchema.index({ senderId: 1, receiverId: 1 });

const chatModel = mongoose.models.chat || mongoose.model("chat", chatSchema);
export default chatModel;
