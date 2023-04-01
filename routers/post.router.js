import express from 'express';
import UploadCloud from '../configs/cloudinary.config.js';
import PostController from '../controllers/post/post.controller.js';
const router = express.Router();

router
    .route('/')
    .post(
        UploadCloud.uploadCloud.array('image', 5),
        PostController.createNewPost
    )
    .get(PostController.getAllPost);

router.route('/:id/like').post(PostController.likePost);
router.route('/:id/dislike').post(PostController.dislikePost);
router.route('/:id').get(PostController.getPostById);
export default router;
