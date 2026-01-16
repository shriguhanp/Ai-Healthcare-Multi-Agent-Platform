import express from 'express';
import {
    sendMessage,
    sendFile,
    getConversation,
    getUserConversations,
    markAsRead,
    deleteMessage
} from '../controllers/chatController.js';
import upload from '../middleware/fileUpload.js';

const chatRouter = express.Router();

// Message routes
chatRouter.post('/send', sendMessage);
chatRouter.post('/send-file', upload.single('file'), sendFile);
chatRouter.get('/conversation/:userId1/:userId2', getConversation);
chatRouter.get('/conversations/:userId', getUserConversations);
chatRouter.post('/mark-read', markAsRead);
chatRouter.delete('/message/:messageId', deleteMessage);

export default chatRouter;
