import {
    MESSAGE_NO_ENOUGH_IN_4,
    MESSAGE_NO_PERMISSION,
    RULE_ADMIN,
    RULE_DOCTOR,
    RULE_DOCTOR_REMIND,
    RULE_SYSTEM,
    STATUS_FAIL,
    STATUS_SUCCESS,
} from '../../common/constant.js';
import Doctor from '../../models/doctor/doctor.model.js';
import AppError from '../../utils/error.util.js';
import { createPerson, updatePerson } from '../../utils/person.util.js';
import Base from '../utils/base.controller.js';
import Conversation from '../../models/conversation.model.js';
import Message from '../../models/message.model.js';
import Notification from '../../models/notification.model.js';
import Patient from '../../models/patient/patient.model.js';
import mongoose from 'mongoose';
import ScheduleDetailSchema from '../../models/schedule_detail.model.js';

const createDoctor = async (req, res, next) => {
    const { rule, account_id, file } = req;
    if (rule === RULE_DOCTOR) {
        const { username, dob, address, gender, work_type } = req.body;
        if (username && dob && address && gender && account_id && work_type) {
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
                    new AppError(
                        400,
                        STATUS_FAIL,
                        'Tài khoản bác sĩ đã tồn tại!'
                    ),
                    req,
                    res,
                    next
                );
            } else {
                const doctorModel = await Doctor.create({
                    person: personModel._id,
                    work_type: work_type,
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
                            `Không tìm thấy bác sĩ với id = ${id}`
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
        const doctor = await Doctor.findById(id)
            .populate('person')
            .populate('ratings');
        if (!doctor) {
            return next(
                new AppError(
                    404,
                    STATUS_FAIL,
                    `Không tìm thấy bác sĩ với id = ${id}`
                ),
                req,
                res,
                next
            );
        }

        if (doctor.ratings.length === 0) doctor['rating'] = 5;
        else {
            const count_rating = doctor.ratings.reduce(
                (accumulator, currentValue) => accumulator + currentValue,
                0
            );

            const avg_count_rating = count_rating / doctor.ratings.length;
            doctor['rating'] = Math.round(avg_count_rating);
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
        const doctors = await Doctor.find({ is_accepted: false }).populate(
            'person'
        );
        if (doctors.length === 0) {
            return next(
                new AppError(404, STATUS_FAIL, `Danh sách bác sĩ trống`),
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
                            `Không tìm thấy cuộc trò chuyện với thành viên = [${id}, ${from}]`
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

const cancelScheduleWithPatientId = async (req, res, next) => {
    const { rule } = req;
    const { id } = req.params;
    const { work_type, doctor_id } = req.body;

    if (id !== null && work_type !== null && doctor_id) {
        if (rule === RULE_DOCTOR) {
            if (work_type === 'blood') {
                const schedule_deleted = await ScheduleDetailSchema.find({
                    patient: id,
                    doctor: doctor_id,
                    day_exam: { $gte: new Date() },
                });

                await Promise.all(
                    schedule_deleted.map(async (schedule) => {
                        return ScheduleDetailSchema.findByIdAndDelete(
                            schedule._id
                        );
                    })
                );

                const patient = await Patient.findByIdAndUpdate(
                    id,
                    {
                        doctor_blood_id: null,
                    },
                    { new: true }
                );

                const notification = new Notification({
                    from: doctor_id,
                    to: id,
                    content: `Bác sĩ chịu trách nhiệm về  huyết áp đã dừng theo dõi sức khỏe của bạn, các lịch khám giữa 2 bạn sẽ bị xóa,\nVui lòng đăng ký lịch khám để bác sĩ khác có thể theo dõi sức khỏe của bạn`,
                    rule: RULE_SYSTEM,
                });

                const _notification = await notification.save();

                if (patient) {
                    return res.status(201).json({
                        status: 'success',
                        data: {
                            patient,
                            notification: _notification,
                        },
                    });
                }
            }

            if (work_type === 'glycemic') {
                const schedule_deleted = await ScheduleDetailSchema.find({
                    patient: id,
                    doctor: doctor_id,
                    day_exam: { $gte: new Date() },
                });

                await Promise.all(
                    schedule_deleted.map(async (schedule) => {
                        return ScheduleDetailSchema.findByIdAndDelete(
                            schedule._id
                        );
                    })
                );

                const patient = await Patient.findByIdAndUpdate(
                    id,
                    {
                        doctor_glycemic_id: null,
                    },
                    { new: true }
                ).populate('person');

                const notification = new Notification({
                    from: doctor_id,
                    to: id,
                    content: `Bác sĩ chịu trách nhiệm về  đường huyết đã dừng theo dõi sức khỏe của bạn, các lịch khám giữa 2 bạn sẽ bị xóa,\nVui lòng đăng ký lịch khám để bác sĩ khác có thể theo dõi sức khỏe của bạn`,
                    rule: RULE_SYSTEM,
                });

                const _notification = await notification.save();

                if (patient) {
                    return res.status(201).json({
                        status: 'success',
                        data: {
                            patient,
                            notification: _notification,
                        },
                    });
                }
            }
        }
        return next(
            new AppError(403, STATUS_FAIL, MESSAGE_NO_PERMISSION),
            req,
            res,
            next
        );
    }

    return next(
        new AppError(400, STATUS_FAIL, MESSAGE_NO_ENOUGH_IN_4),
        req,
        res,
        next
    );
};

const createConversationAndMessage = async (patientId, doctorId, content) => {
    try {
        const _conversation = await Conversation.create({
            members: [patientId, doctorId],
        });

        const message = await Message.create({
            conversation: _conversation._id,
            senderId: doctorId,
            content: content,
        });

        const __conversation = await Conversation.findByIdAndUpdate(
            _conversation._id,
            {
                last_message: new mongoose.Types.ObjectId(message.id),
            },
            { new: true }
        ).populate('last_message');

        const _patient = await Patient.findById(
            __conversation.members[0]
        ).populate('person');

        const _doctor = await Doctor.findById(
            __conversation.members[1]
        ).populate('person');

        const conversation_custom = {
            ...__conversation._doc,
            members: [_patient, _doctor],
        };

        return {
            message: message,
            conversation: conversation_custom,
        };
    } catch (error) {
        return {
            message: null,
            conversation: null,
        };
    }
};

const moveDoctorExamPatient = async (req, res, next) => {
    const { rule } = req;
    const { id } = req.params;
    const { work_type, doctor_new_id, doctor_old_id, reason } = req.body;

    if (id !== null && work_type !== null && doctor_new_id && reason) {
        if (rule === RULE_DOCTOR) {
            if (work_type === 'blood') {
                const schedule_deleted = await ScheduleDetailSchema.find({
                    patient: id,
                    doctor: doctor_old_id,
                    day_exam: { $gte: new Date() },
                });

                await Promise.all(
                    schedule_deleted.map(async (schedule) => {
                        return ScheduleDetailSchema.findByIdAndDelete(
                            schedule._id
                        );
                    })
                );
                const patient = await Patient.findByIdAndUpdate(
                    id,
                    {
                        doctor_blood_id: new mongoose.Types.ObjectId(
                            `${doctor_new_id}`
                        ),
                    },
                    { new: true }
                );

                if (patient) {
                    const notification = new Notification({
                        from: doctor_new_id,
                        to: id,
                        content: `Bác sĩ chịu trách nhiệm về  huyết áp đã chuyển bạn cho một bác sĩ khác. Lý do: ${reason}\nVui lòng đăng ký lịch để được bác sĩ mới tư vấn!`,
                        rule: RULE_SYSTEM,
                    });

                    const _notification = await notification.save();

                    const _conversation = await Conversation.findOne({
                        members: [id, doctor_new_id],
                    });

                    if (!_conversation) {
                        const { conversation, message } =
                            await createConversationAndMessage(
                                id,
                                doctor_new_id,
                                'Chào bạn, từ hôm nay tôi sẽ chịu trách nhiệm về việc theo dõi huyết áp và đưa ra lời khuyên cho bạn!'
                            );

                        return res.status(201).json({
                            status: 'success',
                            data: {
                                patient,
                                notification: _notification,
                                message,
                                conversation,
                            },
                        });
                    }

                    return res.status(201).json({
                        status: 'success',
                        data: {
                            patient,
                            notification: _notification,
                            message: null,
                            conversation: null,
                        },
                    });
                }
            }

            if (work_type === 'glycemic') {
                const schedule_deleted = await ScheduleDetailSchema.find({
                    patient: id,
                    doctor: doctor_old_id,
                    day_exam: { $gte: new Date() },
                });

                await Promise.all(
                    schedule_deleted.map(async (schedule) => {
                        return ScheduleDetailSchema.findByIdAndDelete(
                            schedule._id
                        );
                    })
                );
                const patient = await Patient.findByIdAndUpdate(
                    id,
                    {
                        doctor_glycemic_id: new mongoose.Types.ObjectId(
                            `${doctor_new_id}`
                        ),
                    },
                    { new: true }
                ).populate('person');

                if (patient) {
                    const notification = new Notification({
                        from: doctor_new_id,
                        to: id,
                        content: `Bác sĩ chịu trách nhiệm về  đường huyết đã chuyển bạn cho bác sĩ khác. Lý do: ${reason}\nVui lòng đăng ký lịch để được bác sĩ mới tư vấn!`,
                        rule: RULE_SYSTEM,
                    });

                    const _notification = await notification.save();

                    const _conversation = await Conversation.findOne({
                        members: [id, doctor_new_id],
                    });

                    if (!_conversation) {
                        const { conversation, message } =
                            await createConversationAndMessage(
                                id,
                                doctor_new_id,
                                'Chào bạn, từ hôm nay tôi sẽ chịu trách nhiệm về việc theo dõi đường huyết và đưa ra lời khuyên cho bạn!'
                            );

                        return res.status(201).json({
                            status: 'success',
                            data: {
                                patient,
                                notification: _notification,
                                message,
                                conversation,
                            },
                        });
                    }

                    return res.status(201).json({
                        status: 'success',
                        data: {
                            patient,
                            notification: _notification,
                            message: null,
                            conversation: null,
                        },
                    });
                }
            }
        }
        return next(
            new AppError(403, STATUS_FAIL, MESSAGE_NO_PERMISSION),
            req,
            res,
            next
        );
    }

    return next(
        new AppError(400, STATUS_FAIL, MESSAGE_NO_ENOUGH_IN_4),
        req,
        res,
        next
    );
};

export default {
    createDoctor,
    findDoctorById,
    getAllDoctors,
    getDoctorListWaitingAccept,
    updateDoctorInfoById,
    createRemindForPatientById,
    cancelScheduleWithPatientId,
    moveDoctorExamPatient,
    createConversationAndMessage,
};
