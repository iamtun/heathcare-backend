import {
    MESSAGE_NO_ENOUGH_IN_4,
    MESSAGE_NO_PERMISSION,
    RULE_ADMIN,
    RULE_DOCTOR,
    RULE_DOCTOR_REMIND,
    STATUS_FAIL,
    STATUS_SUCCESS,
} from '../../common/constant.js';
import Doctor from '../../models/doctor.model.js';
import AppError from '../../utils/error.util.js';
import { createPerson, updatePerson } from '../../utils/person.util.js';
import Base from '../utils/base.controller.js';
import Conversation from '../../models/conversation.model.js';
import Message from '../../models/message.model.js';
import Notification from '../../models/notification.model.js';

const createDoctor = async (req, res, next) => {
    const { rule, account_id, file } = req;
    if (rule === RULE_DOCTOR) {
        const { username, dob, address, gender } = req.body;
        if (username && dob && address && gender && account_id) {
            const person = {
                username,
                dob,
                address,
                gender,
                avatar: file ? file.path : '',
                account: account_id,
            };
            const { personModel, error } = await createPerson(person);
            if (error) {
                return next(
                    new AppError(400, STATUS_FAIL, 'account id exist'),
                    req,
                    res,
                    next
                );
            } else {
                const doctorModel = await Doctor.create({
                    person: personModel._id,
                });

                res.status(201).json({
                    status: STATUS_SUCCESS,
                    data: doctorModel,
                });
            }
        } else {
            return next(
                new AppError(400, STATUS_FAIL, MESSAGE_NO_ENOUGH_IN_4),
                req,
                res,
                next
            );
        }
    } else {
        return next(
            new AppError(403, STATUS_FAIL, MESSAGE_NO_PERMISSION),
            req,
            res,
            next
        );
    }
};

const updateDoctorInfoById = async (req, res, next) => {
    const { rule, file } = req;
    const { id } = req.params;
    if (rule === RULE_DOCTOR) {
        const { username, dob, address, gender } = req.body;
        if ((username || dob || address || gender) && id) {
            try {
                const doctorModel = await Doctor.findById(id);
                const newPerson = {
                    username,
                    dob,
                    address,
                    gender,
                    avatar: file ? file.path : '',
                };
                if (doctorModel) {
                    const { person } = doctorModel;

                    const { oldPerson, error } = await updatePerson(
                        newPerson,
                        person
                    );
                    if (error) {
                        return next(error);
                    }

                    res.status(201).json({
                        status: STATUS_SUCCESS,
                        data: oldPerson,
                    });
                } else {
                    return next(
                        new AppError(
                            404,
                            STATUS_FAIL,
                            `Don't find doctor with id = ${id}`
                        ),
                        req,
                        res,
                        next
                    );
                }
            } catch (error) {
                next(error);
            }
        } else {
            return next(
                new AppError(400, STATUS_FAIL, MESSAGE_NO_ENOUGH_IN_4),
                req,
                res,
                next
            );
        }
    } else {
        return next(
            new AppError(403, STATUS_FAIL, MESSAGE_NO_PERMISSION),
            req,
            res,
            next
        );
    }
};

const findDoctorById = async (req, res, next) => {
    try {
        const id = req.params.id;
        const doctor = await Doctor.findById(id).populate('person');
        if (!doctor) {
            return next(
                new AppError(
                    404,
                    STATUS_FAIL,
                    `Don't find doctor with id = ${id}`
                ),
                req,
                res,
                next
            );
        }

        res.status(200).json({ status: STATUS_SUCCESS, data: doctor });
    } catch (error) {
        next(error);
    }
};

const getAllDoctors = async (req, res, next) => {
    try {
        const doctors = await Doctor.find().populate('person');
        if (doctors.length === 0) {
            return next(
                new AppError(404, STATUS_FAIL, `Don't find list doctor`),
                req,
                res,
                next
            );
        }
        res.status(200).json({ status: STATUS_SUCCESS, data: doctors });
    } catch (error) {
        next(error);
    }
};

const getDoctorListWaitingAccept = async (req, res, next) => {
    try {
        const doctors = await Doctor.find({ isAccepted: false }).populate(
            'person'
        );
        if (doctors.length === 0) {
            return next(
                new AppError(404, STATUS_FAIL, `Don't find list doctor`),
                req,
                res,
                next
            );
        }
        res.status(200).json({ status: STATUS_SUCCESS, data: doctors });
    } catch (error) {
        next(error);
    }
};

const createRemindForPatientById = async (req, res, next) => {
    const { rule } = req;
    if (rule === RULE_DOCTOR) {
        const { id } = req.params;
        const { from, content } = req.body;

        try {
            if (id && from && content) {
                const conversation = await Conversation.findOne({
                    members: [id, from],
                });

                if (conversation) {
                    //create message
                    const message = new Message({
                        conversation: conversation._id,
                        senderId: from,
                        content: `Nhắc nhở: ${content}`,
                    });

                    const _message = await message.save();

                    //update last message
                    const _conversation = await Conversation.findByIdAndUpdate(
                        conversation.id,
                        { last_message: _message._id },
                        { new: true }
                    );

                    //create notification
                    const notification = new Notification({
                        from: from,
                        to: id,
                        content: `Bác sĩ nhắc nhở bạn: ${content}`,
                        rule: RULE_DOCTOR_REMIND,
                    });

                    const _notification = await notification.save();

                    res.status(201).json({
                        status: STATUS_SUCCESS,
                        data: {
                            message: _message,
                            notification: _notification,
                        },
                    });
                } else {
                    return next(
                        new AppError(
                            404,
                            STATUS_FAIL,
                            `Don't find conversation with member = [${id}, ${from}]`
                        ),
                        req,
                        res,
                        next
                    );
                }
            } else {
                return next(
                    new AppError(400, STATUS_FAIL, MESSAGE_NO_ENOUGH_IN_4),
                    req,
                    res,
                    next
                );
            }
        } catch (error) {
            next(error);
        }
    } else {
        return next(
            new AppError(403, STATUS_FAIL, MESSAGE_NO_PERMISSION),
            req,
            res,
            next
        );
    }
};

export default {
    createDoctor,
    findDoctorById,
    getAllDoctors,
    getDoctorListWaitingAccept,
    updateDoctorInfoById,
    createRemindForPatientById,
};
