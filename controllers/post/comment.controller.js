import { STATUS_FAIL, STATUS_SUCCESS } from '../../common/constant.js';
import Doctor from '../../models/doctor/doctor.model.js';
import Patient from '../../models/patient/patient.model.js';
import Person from '../../models/person.model.js';
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
    const post = await Post.findById(id);

    if (post) {
        try {
            const { doc, error } = await BaseController.createAndReturnObject(
                Comment
            )(req, res, next);

            if (doc) {
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
                        const __comment = await Comment.findById(
                            doc._id
                        ).populate('patient_id');

                        const comment_person_info = await Person.findById(
                            __comment['patient_id']['person']
                        );
                        __comment['patient_id']['person'] = comment_person_info;
                        _comment = __comment;
                    }
                    if (doc.doctor_id) {
                        const __comment = await Comment.findById(
                            doc._id
                        ).populate('doctor_id');

                        const comment_person_info = await Person.findById(
                            __comment['doctor_id']['person']
                        );

                        __comment['doctor_id']['person'] = comment_person_info;
                        _comment = __comment;
                    }
                    return res.status(201).json({
                        status: STATUS_SUCCESS,
                        data: _comment,
                    });
                }
            }
            return next(
                new AppError(
                    400,
                    STATUS_FAIL,
                    `Tạo bình luận thất bại - > ${JSON.stringify(error)}`
                ),
                req,
                res,
                next
            );
        } catch (error) {
            console.error('error in create comment', error);
            return next(
                new AppError(401, STATUS_FAIL, 'Tạo bình luận thất bại'),
                req,
                res,
                next
            );
        }
    } else {
        return next(
            new AppError(
                404,
                STATUS_FAIL,
                `Không tìm thấy bài viết với id = ${id}`
            ),
            req,
            res,
            next
        );
    }
};

const getCommentListByPostId = async (req, res, next) => {
    const { id } = req.params;

    const comments = await Comment.find({ post_id: id })
        .populate('doctor_id')
        .populate('patient_id')
        .sort({
            createdAt: -1,
        });

    const _comments = await Promise.all(
        comments.map(async (comment) => {
            if (comment?.patient_id) {
                const patient = await Patient.findById(
                    comment.patient_id
                ).populate('person');
                comment['patient_id'] = patient;
            }

            if (comment?.doctor_id) {
                const doctor = await Doctor.findById(
                    comment.doctor_id
                ).populate('person');
                comment['doctor_id'] = doctor;
            }

            return comment;
        })
    );
    res.status(200).json({
        data: _comments,
    });
};
export default { createComment, getCommentListByPostId };
