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

            req.body.patient = patient.id;

            if (content_exam && schedule && day_exam) {
                const schedule_details = await ScheduleDetailSchema.find({});

                //handle filter schedule detail equal day & month
                const details_filter = schedule_details.filter((schedule) => {
                    return (
                        schedule.day_exam.getDate() ===
                            new Date(day_exam).getDate() &&
                        schedule.day_exam.getMonth() ===
                            new Date(day_exam).getMonth()
                    );
                });

                if (details_filter.length > 1) {
                    return next(
                        new AppError(
                            401,
                            STATUS_FAIL,
                            'Mỗi ngày bạn chỉ được đăng ký tối đa một ca khám!'
                        ),
                        req,
                        res,
                        next
                    );
                }

                const _schedule = await Schedule.findById(schedule);
                req.body.doctor = _schedule.doctor;

                const { doc, error } = await Base.createAndReturnObject(
                    ScheduleDetailSchema
                )(req, res, next);

                if (error) {
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

                let schedule_detail = await ScheduleDetailSchema.findById(
                    doc._id
                )
                    .populate('patient')
                    .populate('schedule')
                    .populate('doctor');

                const _person = await Person.findById(
                    schedule_detail['doctor']['person']
                );

                const time = await Shift.findById(
                    schedule_detail['schedule']['time']
                );

                schedule_detail['schedule']['time'] = time;
                schedule_detail['doctor']['person'] = _person;

                //create notification
                const _notification = new Notification({
                    from: patient.id,
                    to: schedule_detail['doctor']._id,
                    content: `Bệnh nhân ${
                        person.username
                    } đã đăng ký lịch khám vào lúc ${moment(day_exam).format(
                        'llll'
                    )}. Vui lòng tiến hành xác nhận hoặc hủy (nếu bận)`,
                    rule: RULE_NOTIFICATION_REGISTER_SCHEDULE,
                });

                const notification = await _notification.save();

                const conversation = await Conversation.findOne({
                    members: [patient.id, schedule_detail.doctor.id],
                });

                //create conversation
                let _conversation = null;
                if (!conversation) {
                    const __conversation = new Conversation({
                        members: [patient.id, schedule_detail.doctor.id],
                    });
                    _conversation = await __conversation.save();
                }

                res.status(201).json({
                    status: STATUS_SUCCESS,
                    data: {
                        schedule_detail,
                        notification,
                        conversation: _conversation,
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
            const { result_exam, anamnesis } = req.body;
            if (result_exam) {
                const detailUpdated =
                    await ScheduleDetailSchema.findByIdAndUpdate(
                        id,
                        { result_exam: result_exam },
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
                        }`,
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
                            notification: _notification,
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
const getAll = Base.getAll(ScheduleDetailSchema);

/**
 * 0: bình thường
 * 1: cảnh báo
 * 2: nguy hiểm
 */
const handleBMIStatus = (gender, bmi_avg) => {
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

const handleGlycemicStatus = (glycemic = { metric: null, case: 0 }) => {
    const { metric } = glycemic;
    if (glycemic.case) {
        switch (glycemic.case) {
            case 1:
                {
                    if (metric && metric < 90) return 1;
                    else if (metric && metric <= 130) return 0;
                    else if (metric > 130) return 2;
                    else return -1;
                }
                break;
            case 2:
                {
                    if (metric && metric < 70) return 1;
                    else if (metric && metric < 180) return 0;
                    else if (metric && metric > 180) return 2;
                    else return -1;
                }
                break;
            case 3: {
                if (metric && metric < 110) return 1;
                else if (metric && metric < 150) return 0;
                else if (metric && metric > 150) return 2;
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

const handleBloodPressureStatus = (blood = null) => {
    if (blood === null) return -1;
    if (blood.systolic < 120 && blood.diastole < 80) return 0;
    else if (
        blood.systolic >= 120 &&
        blood.systolic <= 129 &&
        blood.diastole < 80
    )
        return 1;
    else if (
        (blood.systolic >= 130 && blood.systolic <= 139) ||
        (blood.diastole >= 80 && blood.diastole < 90)
    )
        return 2;
    else if (blood.systolic > 140 || blood.diastole > 90) return 3;
    else if (blood.systolic > 180 || blood.diastole > 120) return 4;
};

const handleThreeMetric = (bmi, glycemic, blood) => {
    if (bmi === 0 && glycemic === 0 && blood === 0) {
        return { code: 0, status: 'Bình Thường' };
    }

    if (blood === -1) {
        return { code: 0, status: 'Bạn chưa nhập đầy đủ thông tin' };
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
                        status: 'Tình trạng đường huyết của bạn đang ở mức báo động và đang trong giai đoạn tiền huyết áp',
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
                        status: 'Vui lòng cập nhật các chỉ số  sức khỏe còn thiếu: BMI hoặc GLYCEMIC ',
                    };
            }
            break;
        case 1:
            {
                if (bmi === 0 && glycemic === 1)
                    return {
                        code: 1,
                        status: 'Tình trạng đường huyết của bạn không được tốt và đang trong giai đoạn tăng huyết áp khẩn cấp',
                    };
                if (bmi === 0 && glycemic === 2)
                    return {
                        code: 2,
                        status: 'Tình trạng đường huyết của bạn đang ở mức báo động và đang trong giai đoạn tiền huyết áp',
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
                if (bmi === 0 && glycemic === 1)
                    return {
                        code: 1,
                        status: 'Tình trạng đường huyết của bạn không được tốt và đang trong giai đoạn cao huyết áp giai đoạn 1',
                    };
                if (bmi === 0 && glycemic === 2)
                    return {
                        code: 2,
                        status: 'Tình trạng đường huyết của bạn đang ở mức báo động và đang trong giai đoạn cao huyết áp giai đoạn 1',
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
            if (bmi === 0 && glycemic === 1)
                return {
                    code: 2,
                    status: 'Tình trạng đường huyết của bạn không được tốt và đang trong giai đoạn tăng huyết áp khẩn cấp',
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

                const blood_pressures = await BloodPressure.find({
                    patient: patient.id,
                });
                const last_blood_pressures =
                    blood_pressures[blood_pressures.length - 1];

                console.log('blood ->', last_blood_pressures);
                const status = {
                    bmi: handleBMIStatus(
                        patient.person.gender,
                        last_bmi.cal_bmi
                    ),
                    glycemic: handleGlycemicStatus(glycemic),
                    blood_pressure:
                        handleBloodPressureStatus(last_blood_pressures),
                    message: handleThreeMetric(
                        handleBMIStatus(
                            patient.person.gender,
                            last_bmi.cal_bmi
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
    const schedule_details = await ScheduleDetailSchema.find({
        doctor: doctorId,
    })
        .populate('schedule')
        .populate('doctor');

    const details = schedule_details.filter((detail) => !detail.result_exam);

    const detail_list_result = await Promise.all(
        details.map(async (detail) => {
            const person = await Person.findById(detail.doctor.person);
            detail['doctor']['person'] = person;
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
            // console.log(_doctor);
            detail['doctor'] = _doctor;
            return detail;
        })
    );

    res.json({
        data: detail_list_result,
    });
};

const acceptScheduleDetailRegister = async (req, res, next) => {
    const { rule } = req;
    if (rule === RULE_DOCTOR) {
        const schedule_detail = await ScheduleDetailSchema.findByIdAndUpdate(
            { _id: req.params.id },
            { status: true },
            { new: true }
        )
            .populate('schedule')
            .populate('doctor');

        //create notification
        const _notification = new Notification({
            from: schedule_detail['doctor']._id,
            to: schedule_detail['patient']._id,
            content: `Bác sĩ đã xác nhận lịch khám vào lúc ${moment(
                schedule_detail['day_exam']
            ).format('llll')}. Bạn vui lòng chuẩn bị trước giờ hẹn 5 phút!`,
            rule: RULE_NOTIFICATION_REGISTER_SCHEDULE,
        });

        const notification = await _notification.save();

        if (schedule_detail) {
            res.status(201).json({
                status: STATUS_SUCCESS,
                data: {
                    schedule_detail,
                    notification,
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

    const schedule_detail = await ScheduleDetailSchema.findById(id)
        .populate('patient')
        .populate('doctor');

    if (schedule_detail.patient._id.toString() === from) {
        //create notification
        const person = await Person.findById(schedule_detail['patient'].person);
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
                notification,
            },
        });
    } else if (schedule_detail.doctor._id.toString() === from) {
        //create notification
        const person = await Person.findById(schedule_detail['doctor'].person);
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
                notification,
            },
        });
    }

    return res.status(400).json({
        status: STATUS_FAIL,
        message: `Không tìm thấy lịch đăng ký với id = ${req.params.id} `,
    });
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
};
