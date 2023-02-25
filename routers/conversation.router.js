import express from 'express';
import Conversation from '../controllers/utils/conversation.controller.js';
const router = express.Router();

router
    .route('/')
    .post(Conversation.createConversation)
    .get(Conversation.getAllConversation);
router.route('/patient/:id').get(Conversation.getConversationListByPatientId);
router.route('/doctor/:id').get(Conversation.getConversationListByDoctorId);

export default router;
