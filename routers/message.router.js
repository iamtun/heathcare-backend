import express from 'express';
import MessageController from '../controllers/utils/message.controller.js';
import UploadCloud from '../configs/cloudinary.config.js';
const router = express.Router();

router
    .route('/')
    .post(
        UploadCloud.uploadCloud.array('image', 5),
        MessageController.createMessage
    );
router.route('/:id').get(MessageController.getAllMessageByConversationId);

export default router;
