import { STATUS_FAIL, STATUS_SUCCESS } from '../../common/constant.js';
import Comment from '../../models/post/comment.model.js';
import Post from '../../models/post/post.model.js';
import AppError from '../../utils/error.util.js';
import BaseController from '../utils/base.controller.js';

const createComment = async (req, res, next) => {
    const { id } = req.params;
    const { files } = req;

    const images = files.map((file) => file.path);
    req.body.images = images;
    req.body.post_id = id;

    try {
        const { doc, error } = await BaseController.createAndReturnObject(
            Comment
        )(req, res, next);

        if (doc) {
            const post = await Post.findById(id);
            const comments = post.comments;
            comments.push(doc._id);
            const postUpdated = await Post.findByIdAndUpdate(
                id,
                { comments: comments },
                { new: true }
            );

            if (postUpdated) {
                let _comment = null;
                if (doc.patient_id) {
                    const __comment = await Comment.findById(doc._id).populate(
                        'patient_id'
                    );
                    _comment = __comment;
                }
                if (doc.doctor_id) {
                    const __comment = await Comment.findById(doc._id).populate(
                        'doctor_id'
                    );
                    _comment = __comment;
                }
                return res.status(201).json({
                    status: STATUS_SUCCESS,
                    data: _comment,
                });
            }
        }

        return next(
            AppError(400, STATUS_FAIL, 'Tạo bình luận thất bại'),
            req,
            res,
            next
        );
    } catch (error) {
        console.error('error in create comment', error);
        return next(
            AppError(401, STATUS_FAIL, 'Tạo bình luận thất bại'),
            req,
            res,
            next
        );
    }
};

export default { createComment };
