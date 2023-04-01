import { STATUS_SUCCESS } from '../../common/constant.js';
import Doctor from '../../models/doctor/doctor.model.js';
import Patient from '../../models/patient/patient.model.js';
import Person from '../../models/person.model.js';
import Post from '../../models/post/post.model.js';
import AppError from '../../utils/error.util.js';
import BaseController from '../utils/base.controller.js';

const createNewPost = async (req, res, next) => {
    const { files } = req;

    const images = files.map((file) => file.path);
    req.body.images = images;
    // req.body.comments = [];
    return BaseController.createOne(Post)(req, res, next);
};

const getAllPost = async (req, res, next) => {
    const posts = await Post.find({}).populate('author').populate('comments');

    const post_list = await Promise.all(
        posts.map(async (post) => {
            let author = post['author'];
            const person = await Person.findById(author.person);
            author['person'] = person;

            post['author'] = author;

            post['comments'] = await Promise.all(
                post['comments'].map(async (comment) => {
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
            return post;
        })
    );

    return res.status(200).json({
        status: STATUS_SUCCESS,
        data: await post_list,
    });
};

const getPostById = async (req, res, next) => {
    const { id } = req.params;

    const post = await Post.findById(id).populate('author');
    if (post) {
        let author = post['author'];
        const person = await Person.findById(author.person);
        post['author']['person'] = person;
        return res.status(200).json({
            status: STATUS_SUCCESS,
            data: post,
        });
    }

    return next(
        AppError(404, STATUS_FAIL, `Không tìm thấy bài viết với id = ${id}`),
        req,
        res,
        next
    );
};

// const likePost = async (req, res, next) => {
//     const { id } = req.params;
//     const { user_id } = req.body;
// };

export default { createNewPost, getAllPost, getPostById };
