import {
    MESSAGE_NO_ENOUGH_IN_4,
    MESSAGE_NO_PERMISSION,
    RULE_DOCTOR,
    RULE_DOCTOR_REMIND,
    RULE_NOTIFICATION_CANCEL_SCHEDULE,
    RULE_NOTIFICATION_REGISTER_SCHEDULE,
    RULE_PATIENT,
    STATUS_FAIL,
    STATUS_SUCCESS,
} from '../../common/constant.js';
import Day from '../../models/day.model.js';
import Patient from '../../models/patient/patient.model.js';
import Person from '../../models/person.model.js';
import Schedule from '../../models/schedule.model.js';
import Notification from '../../models/notification.model.js';
import ScheduleDetailSchema from '../../models/schedule_detail.model.js';
import Shift from '../../models/shift.model.js';
import BMI from '../../models/patient/bmi.model.js';
import Glycemic from '../../models/patient/glycemic.model.js';
import BloodPressure from '../../models/patient/blood_pressures.model.js';
import AppError from '../../utils/error.util.js';
import Base from '../utils/base.controller.js';
import Doctor from '../../models/doctor/doctor.model.js';

import moment from 'moment';
import 'moment/locale/vi.js';
import Conversation from '../../models/conversation.model.js';
import Message from '../../models/message.model.js';
import doctorController from '../doctor/doctor.controller.js';
import { calBMI } from './bmi.controller.js';
moment.locale('vi');

//patient register
const createScheduleDetail = async (req, res, next) => {
    try {
        const { rule, account_id } = req;
        if (rule === RULE_PATIENT) {
            const { content_exam, schedule, day_exam } = req.body;

            const person = await Person.findOne({ account: account_id });

            const patient = await Patient.findOne({
                person: person._id,
            });
            const patient_id = patient.id;
            req.body.patient = patient_id;

            const now = new Date();
            const is_before_one_day = moment(day_exam).diff(now, 'days', true);
            //Lịch khám phải đăng ký trước 1 ngày
            if (Math.round(is_before_one_day) > 0) {
                if (patient) {
                    if (content_exam && schedule && day_exam) {
                        const schedule_details =
                            await ScheduleDetailSchema.find();

                        const schedule_registed = await Schedule.findOne({
                            _id: schedule,
                        });
                        //handle filter schedule detail equal day & month
                        const details_filter = schedule_details.filter(
                            (schedule) => {
                                return (
                                    schedule.day_exam.getDate() ===
                                        new Date(day_exam).getDate() &&
                                    schedule.day_exam.getMonth() ===
                                        new Date(day_exam).getMonth() &&
                                    schedule.doctor.toString() ===
                                        schedule_registed.doctor.toString() &&
                                    schedule.patient.toString() ===
                                        patient._id.toString()
                                );
                            }
                        );

                        //block register three schedule
                        if (details_filter.length > 1) {
                            return next(
                                new AppError(
                                    401,
                                    STATUS_FAIL,
                                    'Mỗi ngày bạn chỉ được đăng ký tối đa hai ca khám!'
                                ),
                                req,
                                res,
                                next
                            );
                        }

                        const _schedule = await Schedule.findById(
                            schedule
                        ).populate('doctor');

                        if (
                            patient['doctor_blood_id'] &&
                            _schedule['doctor'].work_type === 'blood' &&
                            _schedule['doctor']._id.toString() !==
                                patient['doctor_blood_id'].toString()
                        ) {
                            return next(
                                new AppError(
                                    401,
                                    STATUS_FAIL,
                                    'Bạn đã có bác sĩ phụ trách cho nhóm bệnh huyết áp này. Bạn có thể  liên hệ bác sĩ đang phụ trách để  hủy'
                                ),
                                req,
                                res,
                                next
                            );
                        }

                        if (
                            patient['doctor_glycemic_id'] &&
                            _schedule['doctor'].work_type === 'glycemic' &&
                            _schedule['doctor']._id.toString() !==
                                patient['doctor_glycemic_id'].toString()
                        ) {
                            return next(
                                new AppError(
                                    401,
                                    STATUS_FAIL,
                                    'Bạn đã có bác sĩ phụ trách cho nhóm bệnh đường huyết này. Bạn có thể  liên hệ bác sĩ đang phụ trách để  hủy'
                                ),
                                req,
                                res,
                                next
                            );
                        }

                        const schedule_patient_filter = schedule_details.filter(
                            (schedule) =>
                                moment(schedule.day_exam).diff(
                                    day_exam,
                                    'm'
                                ) === 0 &&
                                schedule.doctor.toString() ===
                                    schedule_registed.doctor.toString()
                        );

                        if (schedule_patient_filter.length > 0) {
                            return next(
                                new AppError(
                                    400,
                                    STATUS_FAIL,
                                    'Ca khám này của bác sĩ đã có người đăng ký vui lòng chọn ca khác'
                                ),
                                req,
                                res,
                                next
                            );
                        }

                        req.body.doctor = _schedule.doctor;
                        const { doc, error } = await Base.createAndReturnObject(
                            ScheduleDetailSchema
                        )(req, res, next);

                        //Chưa check chính xác được ca khám vào giờ đó đã được đăng ký
                        if (error) {
                            // console.log(error);
                            return next(
                                new AppError(
                                    401,
                                    STATUS_FAIL,
                                    'Ca khám này của bác sĩ đã có người đăng ký vui lòng chọn ca khác'
                                ),
                                req,
                                res,
                                next
                            );
                        }

                        let schedule_detail =
                            await ScheduleDetailSchema.findById(doc._id)
                                .populate('patient')
                                .populate('schedule')
                                .populate('doctor');

                        const doctor = schedule_detail['doctor'];
                        if (doctor['work_type'] === 'glycemic') {
                            await Patient.findByIdAndUpdate(patient_id, {
                                doctor_glycemic_id: doctor.id,
                            });
                        } else {
                            await Patient.findByIdAndUpdate(patient_id, {
                                doctor_blood_id: doctor.id,
                            });
                        }

                        const _person = await Person.findById(
                            schedule_detail['doctor']['person']
                        );

                        const _person_patient = await Person.findById(
                            schedule_detail['patient']['person']
                        );

                        const time = await Shift.findById(
                            schedule_detail['schedule']['time']
                        );

                        schedule_detail['schedule']['time'] = time;
                        schedule_detail['doctor']['person'] = _person;
                        schedule_detail['patient']['person'] = _person_patient;

                        //create notification
                        const _notification = new Notification({
                            from: patient.id,
                            to: schedule_detail['doctor']._id,
                            content: `Bệnh nhân ${
                                person.username
                            } đã đăng ký lịch khám vào lúc ${moment(
                                day_exam
                            ).format(
                                'llll'
                            )}. Vui lòng tiến hành xác nhận hoặc hủy (nếu bận)`,
                            rule: RULE_NOTIFICATION_REGISTER_SCHEDULE,
                        });

                        const notification = await _notification.save();

                        // const conversation = await Conversation.findOne({
                        //     members: [patient.id, schedule_detail.doctor.id],
                        // });

                        //create conversation
                        // let _conversation = null;
                        // if (!conversation) {
                        //     const __conversation = new Conversation({
                        //         members: [patient.id, schedule_detail.doctor.id],
                        //     });
                        //     _conversation = await __conversation.save();
                        // }

                        res.status(201).json({
                            status: STATUS_SUCCESS,
                            data: {
                                schedule_detail,
                                notification,
                                // conversation: _conversation,
                            },
                        });
                    } else {
                        return next(
                            new AppError(
                                401,
                                STATUS_FAIL,
                                MESSAGE_NO_ENOUGH_IN_4
                            ),
                            req,
                            res,
                            next
                        );
                    }
                } else {
                    return next(
                        new AppError(
                            401,
                            STATUS_FAIL,
                            `Patient with id ${patient_id} not found`
                        ),
                        req,
                        res,
                        next
                    );
                }
            } else {
                return next(
                    new AppError(
                        401,
                        STATUS_FAIL,
                        `Bạn phải đăng ký lịch trước một ngày để bác sĩ có thể duyệt`
                    ),
                    req,
                    res,
                    next
                );
            }
        } else if (rule === RULE_DOCTOR) {
            const { content_exam, schedule, day_exam, patient_id } = req.body;

            const person = await Person.findOne({ account: account_id });

            const doctor = await Doctor.findOne({
                person: person._id,
            });

            if (doctor) {
                if (content_exam && schedule && day_exam && patient_id) {
                    const schedule_details = await ScheduleDetailSchema.find({
                        doctor: doctor._id,
                        status: false,
                    });

                    //handle filter schedule detail equal day & month
                    const details_filter = schedule_details.filter(
                        (schedule) => {
                            return (
                                moment(schedule.day_exam).diff(
                                    day_exam,
                                    'm'
                                ) === 0
                            );
                        }
                    );

                    if (details_filter.length > 0) {
                        return next(
                            new AppError(
                                401,
                                STATUS_FAIL,
                                'Ca khám này bạn đã có lịch'
                            ),
                            req,
                            res,
                            next
                        );
                    }

                    const _schedule = await Schedule.findById(
                        schedule
                    ).populate('doctor');

                    req.body.doctor = _schedule.doctor;
                    req.body.patient = patient_id;
                    const { doc, error } = await Base.createAndReturnObject(
                        ScheduleDetailSchema
                    )(req, res, next);

                    //Chưa check chính xác được ca khám vào giờ đó đã được đăng ký
                    if (error) {
                        return next(
                            new AppError(
                                405,
                                STATUS_FAIL,
                                'Ca này bạn đã có lịch vui lòng chọn ca khác'
                            ),
                            req,
                            res,
                            next
                        );
                    }

                    let schedule_detail = await ScheduleDetailSchema.findById(
                        doc._id
                    )
                        .populate('patient')
                        .populate('schedule')
                        .populate('doctor');

                    const _person = await Person.findById(
                        schedule_detail['doctor']['person']
                    );

                    const _person_patient = await Person.findById(patient_id);

                    const time = await Shift.findById(
                        schedule_detail['schedule']['time']
                    );

                    schedule_detail['schedule']['time'] = time;
                    schedule_detail['doctor']['person'] = _person;
                    schedule_detail['patient']['person'] = _person_patient;

                    //create notification
                    const _notification = new Notification({
                        from: schedule_detail['doctor']._id,
                        to: patient_id,
                        content: `Bác sĩ ${
                            person.username
                        } đã đăng ký lịch tái khám vào lúc ${moment(
                            day_exam
                        ).format(
                            'llll'
                        )}. Vui lòng tiến hành xác nhận hoặc hủy (nếu bận)`,
                        rule: RULE_NOTIFICATION_REGISTER_SCHEDULE,
                    });

                    const notification = await _notification.save();

                    // const conversation = await Conversation.findOne({
                    //     members: [patient.id, schedule_detail.doctor.id],
                    // });

                    //create conversation
                    // let _conversation = null;
                    // if (!conversation) {
                    //     const __conversation = new Conversation({
                    //         members: [patient.id, schedule_detail.doctor.id],
                    //     });
                    //     _conversation = await __conversation.save();
                    // }

                    res.status(201).json({
                        status: STATUS_SUCCESS,
                        data: {
                            schedule_detail,
                            notification,
                            // conversation: _conversation,
                        },
                    });
                } else {
                    return next(
                        new AppError(401, STATUS_FAIL, MESSAGE_NO_ENOUGH_IN_4),
                        req,
                        res,
                        next
                    );
                }
            } else {
                return next(
                    new AppError(
                        401,
                        STATUS_FAIL,
                        `Doctor with id ${patient_id} not found`
                    ),
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
    } catch (error) {
        console.error('error in create schedule detail -> ', error);
    }
};

const updateResultExam = async (req, res, next) => {
    try {
        const { rule } = req;
        const { id } = req.params;
        if (rule === RULE_DOCTOR) {
            const { result_exam, anamnesis, prescription } = req.body;
            if (result_exam) {
                const detailUpdated =
                    await ScheduleDetailSchema.findByIdAndUpdate(
                        id,
                        {
                            result_exam:
                                result_exam +
                                `. Đánh giá: ${
                                    anamnesis === 0
                                        ? 'Bình Thường'
                                        : anamnesis === 1
                                        ? 'Tiểu đường típ 1'
                                        : 'Tiểu đường típ 2'
                                }`,
                            is_exam: false,
                            prescription,
                        },
                        { new: true }
                    );
                const patient_id = detailUpdated.patient;

                const patientUpdated = await Patient.findByIdAndUpdate(
                    patient_id,
                    { anamnesis: anamnesis },
                    { new: true }
                );
                let schedule_detail = await ScheduleDetailSchema.findById(
                    detailUpdated._id
                )
                    .populate('patient')
                    .populate('schedule');

                const day = await Day.findById(
                    schedule_detail['schedule']['day']
                );
                const time = await Shift.findById(
                    schedule_detail['schedule']['time']
                );

                schedule_detail['schedule']['day'] = day;
                schedule_detail['schedule']['time'] = time;

                const doctor_id = detailUpdated.doctor;

                const conversation = await Conversation.findOne({
                    members: [patient_id, doctor_id],
                });
                if (conversation) {
                    //create message
                    const message = new Message({
                        conversation: conversation._id,
                        senderId: doctor_id,
                        content: `Kết quả khám của bạn ${result_exam} \nTình trạng sức khỏe: ${
                            anamnesis === 0
                                ? 'Bình Thường'
                                : anamnesis === 1
                                ? 'Tiểu đường típ 1'
                                : 'Tiểu đường típ 2'
                        }\n${prescription ? `Thuốc ${prescription}` : ''}`,
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
                        from: doctor_id,
                        to: patient_id,
                        content: `Kết quả khám của bạn ${result_exam} \nTình trạng sức khỏe: ${
                            anamnesis === 0
                                ? 'Bình Thường'
                                : anamnesis === 1
                                ? 'Tiểu đường típ 1'
                                : 'Tiểu đường típ 2'
                        }`,
                        rule: RULE_DOCTOR_REMIND,
                    });

                    const _notification = await notification.save();
                    res.status(201).json({
                        status: STATUS_SUCCESS,
                        data: {
                            schedule_detail,
                            notification: {
                                ..._notification._doc,
                                schedule_detail_id: schedule_detail._id,
                            },
                            message: _message,
                        },
                    });
                }
            } else {
                return next(
                    new AppError(401, STATUS_FAIL, MESSAGE_NO_ENOUGH_IN_4),
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
    } catch (error) {
        console.error('error in update schedule detail -> ', error);
    }
};

const findById = Base.getOne(ScheduleDetailSchema);
const getAll = async (req, res, next) => {
    const schedule_details = await ScheduleDetailSchema.find({
        // result_exam: { $ne: null },
        day_exam: { $gte: new Date() },
    });
    return res.status(200).json({
        status: STATUS_SUCCESS,
        size: schedule_details.length,
        data: schedule_details,
    });
};

/**
 * 0: bình thường
 * 1: cảnh báo
 * 2: nguy hiểm
 */
export const handleBMIStatus = (gender, bmi_avg) => {
    if (bmi_avg) {
        switch (gender) {
            case true:
                {
                    if (bmi_avg < 20) {
                        return 1;
                    } else if (bmi_avg < 25) {
                        return 0;
                    } else if (bmi_avg < 30) {
                        return 1;
                    } else if (bmi_avg > 30) {
                        return 2;
                    } else {
                        return -1;
                    }
                }
                break;
            case false:
                {
                    if (bmi_avg < 18) {
                        return 1;
                    } else if (bmi_avg < 23) {
                        return 0;
                    } else if (bmi_avg < 30) {
                        return 1;
                    } else if (bmi_avg > 30) {
                        return 2;
                    } else {
                        return -1;
                    }
                }
                break;
        }
    }
    return -1;
};

export const handleGlycemicStatus = (glycemic = { metric: null, case: 0 }) => {
    const { metric } = glycemic;
    if (glycemic.case) {
        switch (glycemic.case) {
            case 1:
                {
                    if (metric && metric < 100) return 0;
                    else if (metric && metric <= 125) return 1;
                    else if (metric > 126) return 2;
                    else return -1;
                }
                break;
            case 2:
                {
                    if (metric && metric < 140) return 0;
                    else if (metric && metric < 199) return 1;
                    else if (metric && metric > 200) return 2;
                    else return -1;
                }
                break;
            case 3: {
                if (metric && metric < 120) return 0;
                else if (metric && metric > 120) return 1;
                else return -1;
            }
        }
    }

    return -1;
};

/**
 * -1: chưa nhập
 * 0: bình thường
 * 1: tiền cao huyết áp
 * 2: cao huyết áp(giai đoạn 1)
 * 3: cao huyết áp(giai đoạn 2)
 * 4: tăng huyết áp khẩn cấp(báo động)
 */

export const handleBloodPressureStatus = (blood = null) => {
    if (blood === null) return -1;
    if (blood.systolic < 130 && blood.diastole < 85) return 0;
    else if (
        blood.systolic >= 130 &&
        blood.systolic <= 159 &&
        blood.diastole >= 85 &&
        blood.diastole < 99
    )
        return 1;
    else if (
        blood.systolic >= 160 &&
        blood.systolic < 180 &&
        blood.diastole >= 100 &&
        blood.diastole < 109
    )
        return 2;
    else if (blood.systolic >= 180 && blood.diastole >= 110) return 3;
    else if (blood.systolic >= 180 && blood.diastole >= 120) return 4;

    return -2;
};

const handleThreeMetric = (bmi, glycemic, blood) => {
    if (bmi === 0 && glycemic === 0 && blood === 0) {
        return { code: 0, status: 'Bình Thường' };
    }

    if (blood === -1) {
        return { code: -1, status: 'Bạn chưa nhập đầy đủ thông tin' };
    }

    if (blood === -2) {
        return {
            code: 2,
            status: 'Chỉ số huyết áp bạn nhập ngoài tính toán, vui lòng liên hệ bác sĩ',
        };
    }

    switch (blood) {
        case 0:
            {
                if (bmi === 0 && glycemic === 1)
                    return {
                        code: 1,
                        status: 'Tình trạng đường huyết của bạn không được tốt và đang trong giai đoạn tăng huyết áp khẩn cấp',
                    };
                if (bmi === 0 && glycemic === 2)
                    return {
                        code: 2,
                        status: 'Tình trạng đường huyết của bạn đang ở mức báo động',
                    };
                if (bmi === 1 && glycemic === 0)
                    return {
                        code: 1,
                        status: 'Chỉ số  sức khỏe của bạn không được tốt',
                    };
                if (bmi === 1 && glycemic === 2)
                    return {
                        code: 2,
                        status: 'Tình trạng đường huyết của bạn đang ở mức báo động và chỉ số sức khỏe không được tốt',
                    };
                if (bmi === 2 && glycemic === 0)
                    return {
                        code: 2,
                        status: 'Chỉ số sức khỏe của bạn đang ở mức báo động',
                    };
                if (bmi === 1 && glycemic === 1)
                    return {
                        code: 1,
                        status: 'Cả 2 chỉ số sức khỏe không được tốt ',
                    };
                if (bmi === 2 && glycemic === 2)
                    return {
                        code: 2,
                        status: 'Cả 2 chỉ số sức khỏe đang ở mức báo động',
                    };
                if (bmi === -1 || glycemic === -1)
                    return {
                        code: -1,
                        status: 'Vui lòng cập nhật các chỉ số  sức khỏe còn thiếu: BMI hoặc GLYCEMIC ',
                    };
            }
            break;
        case 1:
            {
                if (bmi === 0 && glycemic === 0)
                    return {
                        code: 1,
                        status: 'Bạn đang trong giai đoạn tiền huyết áp',
                    };
                if (bmi === 0 && glycemic === 1)
                    return {
                        code: 1,
                        status: 'Tình trạng đường huyết của bạn không được tốt và đang trong giai đoạn tiền huyết áp',
                    };
                if (bmi === 0 && glycemic === 2)
                    return {
                        code: 2,
                        status: 'Tình trạng đường huyết của bạn đang ở mức báo động và đang trong giai đoạn tiền huyết áp',
                    };
                if (bmi === 1 && glycemic === 2)
                    return {
                        code: 2,
                        status: 'Tình trạng đường huyết của bạn đang ở mức báo động và đang trong giai đoạn cao huyết áp giai tiền huyết áp, chỉ số sức khỏe không được tốt',
                    };
                if (bmi === 1 && glycemic === 0)
                    return {
                        code: 1,
                        status: 'Chỉ số  sức khỏe của bạn không được tốt và đang trong giai đoạn tiền huyết áp',
                    };
                if (bmi === 2 && glycemic === 0)
                    return {
                        code: 2,
                        status: 'Chỉ số sức khỏe của bạn đang ở mức báo động và đang trong giai đoạn tiền huyết áp',
                    };
                if (bmi === 1 && glycemic === 1)
                    return {
                        code: 1,
                        status: 'Cả 2 chỉ số sức khỏe không được tốt và đang trong giai đoạn tiền huyết áp',
                    };
                if (bmi === 2 && glycemic === 2)
                    return {
                        code: 2,
                        status: 'Cả 2 chỉ số sức khỏe đang ở mức báo động và đang trong giai đoạn tiền huyết áp',
                    };
                if (bmi === -1 || glycemic === -1)
                    return {
                        code: -1,
                        status: 'Bạn đang trong giai đoạn tiền huyết áp Vui lòng cập nhật các chỉ số  sức khỏe còn thiếu: BMI hoặc GLYCEMIC',
                    };
            }
            break;
        case 2:
            {
                if (bmi === 0 && glycemic === 0)
                    return {
                        code: 2,
                        status: 'Bạn đang trong giai đoạn cao huyết áp giai đoạn 1',
                    };
                if (bmi === 0 && glycemic === 1)
                    return {
                        code: 2,
                        status: 'Tình trạng đường huyết của bạn không được tốt và đang trong giai đoạn cao huyết áp giai đoạn 1',
                    };
                if (bmi === 0 && glycemic === 2)
                    return {
                        code: 2,
                        status: 'Tình trạng đường huyết của bạn đang ở mức báo động và đang trong giai đoạn cao huyết áp giai đoạn 1',
                    };
                if (bmi === 1 && glycemic === 2)
                    return {
                        code: 2,
                        status: 'Tình trạng đường huyết của bạn đang ở mức báo động và đang trong giai đoạn cao huyết áp giai đoạn 1, chỉ số sức khỏe không được tốt',
                    };
                if (bmi === 1 && glycemic === 0)
                    return {
                        code: 1,
                        status: 'Chỉ số  sức khỏe của bạn không được tốt và đang trong giai đoạn cao huyết áp giai đoạn 1',
                    };
                if (bmi === 2 && glycemic === 0)
                    return {
                        code: 2,
                        status: 'Chỉ số sức khỏe của bạn đang ở mức báo động và đang trong giai đoạn cao huyết áp giai đoạn 1',
                    };
                if (bmi === 1 && glycemic === 1)
                    return {
                        code: 1,
                        status: 'Cả 2 chỉ số sức khỏe không được tốt và đang trong giai đoạn cao huyết áp giai đoạn 1',
                    };
                if (bmi === 2 && glycemic === 2)
                    return {
                        code: 2,
                        status: 'Cả 2 chỉ số sức khỏe đang ở mức báo động và đang trong giai đoạn cao huyết áp giai đoạn 1',
                    };
                if (bmi === -1 || glycemic === -1)
                    return {
                        code: -1,
                        status: 'Vui lòng cập nhật các chỉ số  sức khỏe: BMI & GLYCEMIC và đang trong giai đoạn cao huyết áp giai đoạn 1',
                    };
            }
            break;
        case 3:
            {
                if (bmi === 0 && glycemic === 0)
                    return {
                        code: 2,
                        status: 'Bạn đang trong giai đoạn cao huyết áp giai đoạn 2',
                    };

                if (bmi === 0 && glycemic === 1)
                    return {
                        code: 2,
                        status: 'Tình trạng đường huyết của bạn không được tốt và đang trong giai đoạn cao huyết áp giai đoạn 2',
                    };
                if (bmi === 0 && glycemic === 2)
                    return {
                        code: 2,
                        status: 'Tình trạng đường huyết của bạn đang ở mức báo động và đang trong giai đoạn cao huyết áp giai đoạn 2',
                    };
                if (bmi === 1 && glycemic === 2)
                    return {
                        code: 2,
                        status: 'Tình trạng đường huyết của bạn đang ở mức báo động và đang trong giai đoạn cao huyết áp giai đoạn 2, chỉ số sức khỏe không được tốt',
                    };
                if (bmi === 1 && glycemic === 0)
                    return {
                        code: 2,
                        status: 'Chỉ số  sức khỏe của bạn không được tốt và đang trong giai đoạn cao huyết áp giai đoạn 2',
                    };
                if (bmi === 2 && glycemic === 0)
                    return {
                        code: 2,
                        status: 'Chỉ số sức khỏe của bạn đang ở mức báo động và đang trong giai đoạn cao huyết áp giai đoạn 2',
                    };
                if (bmi === 1 && glycemic === 1)
                    return {
                        code: 2,
                        status: 'Cả 2 chỉ số sức khỏe không được tốt và đang trong giai đoạn cao huyết áp giai đoạn 2',
                    };
                if (bmi === 2 && glycemic === 2)
                    return {
                        code: 2,
                        status: 'Cả 2 chỉ số sức khỏe đang ở mức báo động và đang trong giai đoạn cao huyết áp giai đoạn 2',
                    };
                if (bmi === -1 || glycemic === -1)
                    return {
                        code: -1,
                        status: 'Vui lòng cập nhật các chỉ số  sức khỏe: BMI & GLYCEMIC và đang trong giai đoạn cao huyết áp giai đoạn 2',
                    };
            }
            break;
        case 4: {
            if (bmi === 0 && glycemic === 0)
                return {
                    code: 2,
                    status: 'Bạn đang trong giai tăng huyết áp khẩn cấp',
                };
            if (bmi === 0 && glycemic === 1)
                return {
                    code: 2,
                    status: 'Tình trạng đường huyết của bạn không được tốt và đang trong giai đoạn ',
                };
            if (bmi === 0 && glycemic === 2)
                return {
                    code: 2,
                    status: 'Tình trạng đường huyết của bạn đang ở mức báo động và đang trong giai đoạn tăng huyết áp khẩn cấp',
                };
            if (bmi === 1 && glycemic === 0)
                return {
                    code: 2,
                    status: 'Chỉ số  sức khỏe của bạn không được tốt và đang trong giai đoạn tăng huyết áp khẩn cấp',
                };
            if (bmi === 2 && glycemic === 0)
                return {
                    code: 2,
                    status: 'Chỉ số sức khỏe của bạn đang ở mức báo động và đang trong giai đoạn tăng huyết áp khẩn cấp',
                };
            if (bmi === 1 && glycemic === 1)
                return {
                    code: 2,
                    status: 'Cả 2 chỉ số sức khỏe không được tốt và đang trong giai đoạn tăng huyết áp khẩn cấp',
                };
            if (bmi === 2 && glycemic === 2)
                return {
                    code: 2,
                    status: 'Cả 2 chỉ số sức khỏe đang ở mức báo động và đang trong giai đoạn tăng huyết áp khẩn cấp',
                };
            if (bmi === -1 || glycemic === -1)
                return {
                    code: -1,
                    status: 'Vui lòng cập nhật các chỉ số  sức khỏe: BMI & GLYCEMIC và đang trong giai đoạn tăng huyết áp khẩn cấp',
                };
        }
    }
};

const getAllPatientExamByIdDoctor = async (req, res, next) => {
    const doctorId = req.params.id;
    const schedule_details = await ScheduleDetailSchema.find({
        doctor: doctorId,
    })
        .populate('schedule')
        .populate('doctor');

    const patient_ids = schedule_details.map((detail) =>
        detail.patient.toString()
    );

    const patient_status = schedule_details.map((detail) => {
        return {
            patient_id: detail.patient.toString(),
            status: detail.status,
        };
    });

    const unique_patients_id = [...new Set(patient_ids)];

    const patient_list = await Promise.all(
        unique_patients_id.map(async (id) => {
            const patient_schedule_detail = patient_status.filter(
                (patient) => patient.patient_id === id
            );
            const patient_status_false = patient_status.filter(
                (patient) =>
                    patient.patient_id === id && patient.status === false
            );

            if (
                patient_schedule_detail.length === patient_status_false.length
            ) {
                return null;
            } else {
                const patient = await Patient.findById(id).populate('person');

                const bmis = await BMI.find({ patient: patient.id });
                const last_bmi = bmis[bmis.length - 1];
                const glycemics = await Glycemic.find({ patient: patient.id });
                const glycemic = glycemics[glycemics.length - 1];

                const _avgBMI = bmis.reduce((accumulator, currentValue) => {
                    return (
                        accumulator +
                        calBMI(currentValue.weight, currentValue.height)
                    );
                }, 0);

                const __avgBMI = parseFloat((_avgBMI / bmis.length).toFixed(2));

                const blood_pressures = await BloodPressure.find({
                    patient: patient.id,
                });
                const last_blood_pressures =
                    blood_pressures[blood_pressures.length - 1];

                const status = {
                    bmi: handleBMIStatus(
                        patient.person.gender,
                        __avgBMI ?? null
                    ),
                    glycemic: handleGlycemicStatus(glycemic),
                    blood_pressure:
                        handleBloodPressureStatus(last_blood_pressures),
                    message: handleThreeMetric(
                        handleBMIStatus(
                            patient.person.gender,
                            __avgBMI ?? null
                        ),
                        handleGlycemicStatus(glycemic),
                        handleBloodPressureStatus(last_blood_pressures)
                    ),
                };

                return {
                    patient,
                    bmis,
                    glycemics,
                    blood_pressures,
                    status: status,
                };
            }
        })
    );

    res.status(200).json({
        status: STATUS_SUCCESS,
        data: patient_list.filter((patient) => patient !== null),
    });
};

const getAllScheduleListOfDoctor = async (req, res, next) => {
    const doctorId = req.params.id;
    const { filter } = req.query;

    if (filter === 'view_result_exam') {
        const schedule_details = await ScheduleDetailSchema.find({
            doctor: doctorId,
            status: true,
            result_exam: { $ne: null },
        })
            .populate('schedule')
            .populate('doctor')
            .populate('patient');

        const detail_list_result = await Promise.all(
            schedule_details.map(async (detail) => {
                const doctor_person = await Person.findById(
                    detail.doctor.person
                );
                const patient_person = await Person.findById(
                    detail.patient.person
                );
                const conversation = await Conversation.findOne({
                    members: [detail.patient._id, detail.doctor._id],
                });

                detail['doctor']['person'] = doctor_person;
                detail['patient']['person'] = patient_person;
                return {
                    ...detail._doc,
                    conversation_id: conversation ? conversation._id : null,
                };
            })
        );

        return res.status(200).json({
            status: STATUS_SUCCESS,
            size: detail_list_result.length,
            data: detail_list_result,
        });
    }

    if (filter === 'view_wating_exam') {
        const schedule_details = await ScheduleDetailSchema.find({
            doctor: doctorId,
            status: true,
            result_exam: null,
            day_exam: { $gte: new Date() },
        })
            .populate('schedule')
            .populate('doctor')
            .populate('patient');

        const detail_list_result = await Promise.all(
            schedule_details.map(async (detail) => {
                const doctor_person = await Person.findById(
                    detail.doctor.person
                );
                const patient_person = await Person.findById(
                    detail.patient.person
                );
                const conversation = await Conversation.findOne({
                    members: [detail.patient._id, detail.doctor._id],
                });

                detail['doctor']['person'] = doctor_person;
                detail['patient']['person'] = patient_person;
                return {
                    ...detail._doc,
                    conversation_id: conversation ? conversation._id : null,
                };
            })
        );

        return res.status(200).json({
            status: STATUS_SUCCESS,
            size: detail_list_result.length,
            data: detail_list_result,
        });
    }

    if (filter === 'view_waiting_accept') {
        const schedule_details = await ScheduleDetailSchema.find({
            doctor: doctorId,
            status: false,
            day_exam: { $gte: new Date() },
        })
            .populate('schedule')
            .populate('doctor')
            .populate('patient');

        const detail_list_result = await Promise.all(
            schedule_details.map(async (detail) => {
                const doctor_person = await Person.findById(
                    detail.doctor.person
                );
                const patient_person = await Person.findById(
                    detail.patient.person
                );
                const conversation = await Conversation.findOne({
                    members: [detail.patient._id, detail.doctor._id],
                });

                detail['doctor']['person'] = doctor_person;
                detail['patient']['person'] = patient_person;
                return {
                    ...detail._doc,
                    conversation_id: conversation ? conversation._id : null,
                };
            })
        );

        return res.status(200).json({
            status: STATUS_SUCCESS,
            size: detail_list_result.length,
            data: detail_list_result,
        });
    }

    const schedule_details = await ScheduleDetailSchema.find({
        doctor: doctorId,
    })
        .populate('schedule')
        .populate('doctor')
        .populate('patient');

    const detail_list_result = await Promise.all(
        schedule_details.map(async (detail) => {
            const doctor_person = await Person.findById(detail.doctor.person);
            const patient_person = await Person.findById(detail.patient.person);
            const conversation = await Conversation.findOne({
                members: [detail.patient._id, detail.doctor._id],
            });

            detail['doctor']['person'] = doctor_person;
            detail['patient']['person'] = patient_person;
            return {
                ...detail._doc,
                conversation_id: conversation ? conversation._id : null,
            };
        })
    );

    return res.status(200).json({
        status: STATUS_SUCCESS,
        size: detail_list_result.length,
        data: detail_list_result,
    });
};

const getAllScheduleListWaitingOfDoctor = async (req, res, next) => {
    const doctorId = req.params.id;
    const schedule_details = await ScheduleDetailSchema.find({
        doctor: doctorId,
        status: false,
        day_exam: { $gte: new Date() },
    })
        .populate('schedule')
        .populate('doctor')
        .populate('patient');

    const detail_list_result = await Promise.all(
        schedule_details.map(async (detail) => {
            const doctor_person = await Person.findById(detail.doctor.person);
            const patient_person = await Person.findById(detail.patient.person);
            detail['doctor']['person'] = doctor_person;
            detail['patient']['person'] = patient_person;
            return detail;
        })
    );
    res.status(200).json({
        status: STATUS_SUCCESS,
        data: detail_list_result,
    });
};

const getAllScheduleDetailByPatientId = async (req, res, next) => {
    const patientId = req.params.id;

    const schedule_details = await ScheduleDetailSchema.find({
        patient: patientId,
    })
        .populate('schedule')
        .populate('doctor');

    const details = schedule_details.filter((detail) => !detail.result_exam);

    const detail_list_result = await Promise.all(
        details.map(async (detail) => {
            const { doctor } = detail;
            const _doctor = await Doctor.findById(doctor).populate('person');

            const conversation = await Conversation.findOne({
                members: [detail.patient._id, detail.doctor._id],
            });

            detail['doctor'] = _doctor;
            return {
                ...detail._doc,
                conversation_id: conversation._id,
            };
        })
    );

    res.json({
        data: detail_list_result,
    });
};

const acceptScheduleDetailRegister = async (req, res, next) => {
    const { rule } = req;
    if (rule === RULE_DOCTOR) {
        const schedule_detail = await ScheduleDetailSchema.findById({
            _id: req.params.id,
        })
            .populate('schedule')
            .populate('doctor');

        if (schedule_detail) {
            //create notification

            const schedule_detail =
                await ScheduleDetailSchema.findByIdAndUpdate(
                    { _id: req.params.id },
                    { status: true },
                    { new: true }
                )
                    .populate('schedule')
                    .populate('doctor');
            const _notification = new Notification({
                from: schedule_detail['doctor']._id,
                to: schedule_detail['patient']._id,
                content: `Bác sĩ đã xác nhận lịch khám vào lúc ${moment(
                    schedule_detail['day_exam']
                ).format('llll')}. Bạn vui lòng chuẩn bị trước giờ hẹn 5 phút!`,
                rule: RULE_NOTIFICATION_REGISTER_SCHEDULE,
            });

            const doctor = await Doctor.findById(
                schedule_detail['doctor']._id
            ).populate('person');

            const patient = await Patient.findById(
                schedule_detail['patient']._id
            ).populate('person');
            schedule_detail['doctor'] = doctor;
            schedule_detail['patient'] = patient;
            const notification = await _notification.save();

            const _conversation = await Conversation.findOne({
                members: [
                    schedule_detail['patient']._id,
                    schedule_detail['doctor']._id,
                ],
            });

            if (!_conversation) {
                const { conversation, message } =
                    await doctorController.createConversationAndMessage(
                        schedule_detail['patient']._id,
                        schedule_detail['doctor']._id,
                        `Chào bạn, bạn có đặt lịch khám bệnh với tôi vào lúc ! ${moment(
                            schedule_detail['day_exam']
                        ).format(
                            'llll'
                        )}. Bạn vui lòng chuẩn bị trước giờ hẹn 5 phút!`
                    );

                return res.status(201).json({
                    status: 'success',
                    data: {
                        schedule_detail,
                        notification: {
                            ...notification._doc,
                            schedule_detail_id: schedule_detail._id,
                        },
                        message,
                        conversation,
                    },
                });
            }

            res.status(201).json({
                status: STATUS_SUCCESS,
                data: {
                    schedule_detail,
                    notification: {
                        ...notification._doc,
                        schedule_detail_id: schedule_detail._id,
                    },
                    message: null,
                    conversation: null,
                },
            });
        } else {
            res.status(400).json({
                status: STATUS_FAIL,
                message: `Không tìm thấy lịch đăng ký với id = ${req.params.id} `,
            });
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

const deleteScheduleDetail = async (req, res, next) => {
    const { reason, from } = req.body;
    const { id } = req.params;
    const now = new Date();

    const schedule_detail = await ScheduleDetailSchema.findOne({
        _id: id,
        status: false,
    })
        .populate('patient')
        .populate('doctor');

    if (schedule_detail) {
        const is_before_one_day = moment(schedule_detail.day_exam).diff(
            now,
            'days',
            true
        );

        if (Math.round(is_before_one_day) > 0) {
            if (schedule_detail.patient._id.toString() === from) {
                //create notification
                const person = await Person.findById(
                    schedule_detail['patient'].person
                );
                const _notification = new Notification({
                    from: schedule_detail['patient']._id,
                    to: schedule_detail['doctor']._id,
                    content: `Bệnh nhân ${
                        person.username
                    } đã hủy lịch khám vào lúc ${moment(
                        schedule_detail.day_exam
                    ).format('llll')}. Vì lý do ${reason}`,
                    rule: RULE_NOTIFICATION_CANCEL_SCHEDULE,
                });

                const notification = await _notification.save();

                const doc = await ScheduleDetailSchema.findByIdAndDelete(id);

                return res.status(200).json({
                    status: STATUS_SUCCESS,
                    data: {
                        schedule_detail_id: doc._id,
                        notification: {
                            ...notification._doc,
                            schedule_detail_id: doc._id,
                        },
                    },
                });
            } else if (schedule_detail.doctor._id.toString() === from) {
                //create notification
                const person = await Person.findById(
                    schedule_detail['doctor'].person
                );
                const _notification = new Notification({
                    from: schedule_detail['doctor']._id,
                    to: schedule_detail['patient']._id,
                    content: `Bác sĩ ${
                        person.username
                    } đã hủy lịch khám vào lúc ${moment(
                        schedule_detail.day_exam
                    ).format('llll')}. Vì lý do ${reason}`,
                    rule: RULE_NOTIFICATION_CANCEL_SCHEDULE,
                });

                const notification = await _notification.save();

                const doc = await ScheduleDetailSchema.findByIdAndDelete(id);

                return res.status(200).json({
                    status: STATUS_SUCCESS,
                    data: {
                        schedule_detail_id: doc._id,
                        notification: {
                            ...notification._doc,
                            schedule_detail_id: doc._id,
                        },
                    },
                });
            }
        } else {
            return res.status(400).json({
                status: STATUS_FAIL,
                message: `Bạn phải hủy lịch trước một ngày`,
            });
        }
    } else {
        return res.status(404).json({
            status: STATUS_FAIL,
            message: `Không tìm thấy lịch đăng ký với id = ${id} `,
        });
    }
};

const getAllResultExamByPatientId = async (req, res, next) => {
    const { id } = req.params;
    if (id) {
        const results = await ScheduleDetailSchema.find({
            patient: id,
            result_exam: { $ne: null },
        });
        return res.status(200).json({
            status: STATUS_SUCCESS,
            data: results,
        });
    }

    return res.status(404).json({
        status: STATUS_FAIL,
        error: `Not found results with patient id = ${id}`,
    });
};

const updateStatusExam = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { is_exam } = req.body;
        const schedule_detail = await ScheduleDetailSchema.findByIdAndUpdate(
            { _id: id },
            { is_exam: is_exam },
            { new: true }
        );

        if (schedule_detail) {
            return res.status(200).json({
                status: STATUS_SUCCESS,
                data: {
                    is_exam,
                },
            });
        }

        return res.status(400).json({
            status: STATUS_FAIL,
            data: {
                is_exam,
            },
        });
    } catch (error) {
        next(error);
    }
};

const getAllExamHistoriesById = async (req, res, next) => {
    const { id } = req.params;
    try {
        const schedules = await ScheduleDetailSchema.find({
            patient: id,
            result_exam: { $ne: null },
        });

        const histories = await Promise.all(
            schedules.map(async (schedule) => {
                const doctor = await Doctor.findById(schedule.doctor).populate(
                    'person'
                );

                return {
                    _id: schedule._id,
                    content_exam: schedule.content_exam,
                    result_exam: schedule.result_exam,
                    doctor: {
                        _id: doctor._id,
                        username: doctor.person.username,
                        work_type: doctor.work_type,
                    },
                    createdAt: schedule.updatedAt,
                    created_at: schedule.day_exam,
                };
            })
        );

        return res.status(200).json({
            status: STATUS_SUCCESS,
            results: histories.length,
            data: histories,
        });
    } catch (error) {
        next(error);
    }
};

export default {
    getAll,
    findById,
    createScheduleDetail,
    updateResultExam,
    getAllPatientExamByIdDoctor,
    getAllScheduleListOfDoctor,
    getAllScheduleDetailByPatientId,
    acceptScheduleDetailRegister,
    deleteScheduleDetail,
    handleBMIStatus,
    handleBloodPressureStatus,
    handleGlycemicStatus,
    handleThreeMetric,
    getAllResultExamByPatientId,
    getAllScheduleListWaitingOfDoctor,
    updateStatusExam,
    getAllExamHistoriesById,
};
