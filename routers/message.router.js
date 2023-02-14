import express from 'express';
import MessageController from '../controllers/utils/message.controller.js';

const router = express.Router();

router.route('/').post(MessageController.createMessage);

export default router;
