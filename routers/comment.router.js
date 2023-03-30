import express from 'express';
import UploadCloud from '../configs/cloudinary.config.js';
import CommentController from '../controllers/post/comment.controller.js';
const router = express.Router();

router
    .route('/:id')
    .post(
        UploadCloud.uploadCloud.array('image', 5),
        CommentController.createComment
    );
export default router;
