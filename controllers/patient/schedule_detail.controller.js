import {
    RULE_PATIENT,
    STATUS_FAIL,
    STATUS_SUCCESS,
} from '../../common/constant.js';
import Day from '../../models/day.model.js';
import Patient from '../../models/patient.model.js';
import Person from '../../models/person.model.js';
import ScheduleDetailSchema from '../../models/schedule_detail.model.js';
import Shift from '../../models/shift.model.js';
import Base from '../utils/base.controller.js';

const createScheduleDetail = async (req, res, next) => {
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

            const day = await Day.findById(schedule_detail['schedule']['day']);
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
                error: 'Vui lòng nhập đầy đủ thông tin',
            });
        }
    }
};

export default { createScheduleDetail };
