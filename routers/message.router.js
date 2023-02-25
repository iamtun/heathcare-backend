import express from 'express';
import MessageController from '../controllers/utils/message.controller.js';

const router = express.Router();

router.route('/').post(MessageController.createMessage);
router.route('/:id').get(MessageController.getAllMessageByConversationId);

export default router;
