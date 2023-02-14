import express from 'express';
import Conversation from '../controllers/utils/conversation.controller.js';
const router = express.Router();

router.route('/').post(Conversation.createConversation);

export default router;
