import {
    MESSAGE_NO_ENOUGH_IN_4,
    MESSAGE_NO_PERMISSION,
    RULE_DOCTOR,
    RULE_PATIENT,
    STATUS_FAIL,
    STATUS_SUCCESS,
} from '../../common/constant.js';
import Day from '../../models/day.model.js';
import Patient from '../../models/patient.model.js';
import Person from '../../models/person.model.js';
import Schedule from '../../models/schedule.model.js';
import ScheduleDetailSchema from '../../models/schedule_detail.model.js';
import Shift from '../../models/shift.model.js';
import BMI from '../../models/bmi.model.js';
import Glycemic from '../../models/glycemic.model.js';
import AppError from '../../utils/error.util.js';
import Base from '../utils/base.controller.js';

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
                const _schedule = await Schedule.findById(schedule);
                req.body.doctor = _schedule.doctor;

                const detail = await Base.createAndReturnObject(
                    ScheduleDetailSchema
                )(req, res, next);
                let schedule_detail = await ScheduleDetailSchema.findById(
                    detail.doc._id
                )
                    .populate('patient')
                    .populate('schedule')
                    .populate('doctor');

                // const day = await Day.findById(
                //     schedule_detail['schedule']['day']
                // );
                const time = await Shift.findById(
                    schedule_detail['schedule']['time']
                );

                // schedule_detail['schedule']['day'] = day;
                schedule_detail['schedule']['time'] = time;

                res.status(201).json({
                    status: STATUS_SUCCESS,
                    data: schedule_detail,
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
        if (rule === RULE_DOCTOR) {
            const { result_exam } = req.body;
            if (result_exam) {
                const detailUpdated = await Base.updateAndReturnObject(
                    ScheduleDetailSchema
                )(req, res, next);
                let schedule_detail = await ScheduleDetailSchema.findById(
                    detailUpdated.doc._id
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

                res.status(201).json({
                    status: STATUS_SUCCESS,
                    data: schedule_detail,
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
        console.error('error in update schedule detail -> ', error);
    }
};

const findById = Base.getOne(ScheduleDetailSchema);
const getAll = Base.getAll(ScheduleDetailSchema);

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
    const unique_patients_id = [...new Set(patient_ids)];

    const patient_list = await Promise.all(
        unique_patients_id.map(async (id) => {
            const patient = await Patient.findById(id).populate('person');

            const bmis = await BMI.find({ patient: patient.id });

            const bmi_avg =
                bmis.reduce((a, c) => a + c.calBMI, 0) / bmis.length;
            const glycemics = await Glycemic.find({ patient: patient.id });

            return {
                patient,
                bmi_avg,
                glycemic: glycemics[glycemics.length - 1],
            };
        })
    );

    res.status(200).json({
        status: STATUS_SUCCESS,
        data: patient_list,
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
            const person = await Person.findById(detail.doctor.person);
            detail['doctor']['person'] = person;
            return detail;
        })
    );

    res.json({
        data: detail_list_result,
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
};
