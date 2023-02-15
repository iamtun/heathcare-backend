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
import ScheduleDetailSchema from '../../models/schedule_detail.model.js';
import Shift from '../../models/shift.model.js';
import AppError from '../../utils/error.util.js';
import Base from '../utils/base.controller.js';

//patient register
const createScheduleDetail = async (req, res, next) => {
    try {
        const { rule, account_id } = req;
        if (rule === RULE_PATIENT) {
            const { content_exam, schedule } = req.body;

            const person = await Person.findOne({ account: account_id });

            const patient = await Patient.findOne({
                person: person._id,
            });

            req.body.patient = patient.id;

            if (content_exam && schedule) {
                const detail = await Base.createAndReturnObject(
                    ScheduleDetailSchema
                )(req, res, next);
                let schedule_detail = await ScheduleDetailSchema.findById(
                    detail.doc._id
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
                res.status(401).json({
                    status: STATUS_FAIL,
                    error: MESSAGE_NO_ENOUGH_IN_4,
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
                res.status(401).json({
                    status: STATUS_FAIL,
                    error: MESSAGE_NO_ENOUGH_IN_4,
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
    } catch (error) {
        console.error('error in update schedule detail -> ', error);
    }
};
export default { createScheduleDetail, updateResultExam };
