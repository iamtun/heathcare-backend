import {
    MESSAGE_NO_PERMISSION,
    RULE_ADMIN,
    RULE_DOCTOR,
    STATUS_FAIL,
    STATUS_SUCCESS,
} from '../../common/constant.js';
import Base from '../utils/base.controller.js';

import Schedule from '../../models/schedule.model.js';
import Person from '../../models/person.model.js';
import Doctor from '../../models/doctor/doctor.model.js';
import AppError from '../../utils/error.util.js';

const findScheduleByIdAndPopulate = async (id) => {
    const schedule = await Schedule.findById(id)
        .populate('doctor')
        .populate('time')
        .populate('day');

    return schedule;
};

const checkScheduleExist = async (doctor, day, time) => {
    const scheduleListInDay = await Schedule.find({ day, doctor });

    //check isExist shift in day
    const isExist = scheduleListInDay.some((schedule) => {
        return schedule.time.valueOf() === time;
    });

    return isExist;
};

const createSchedule = async (req, res, next) => {
    const { rule } = req;
    if (rule === RULE_DOCTOR) {
        const { doctor, day, time } = req.body;

        const isExist = await checkScheduleExist(doctor, day, time);
        if (isExist) {
            return next(
                new AppError(
                    400,
                    STATUS_FAIL,
                    'Bạn đã đăng ký ca làm này. Vui lòng kiểm tra lại!'
                ),
                req,
                res,
                next
            );
        }

        const { doc, error } = await Base.createAndReturnObject(Schedule)(
            req,
            res,
            next
        );

        if (error) {
            return next(error);
        }

        const { _id } = doc;

        const schedule = await findScheduleByIdAndPopulate(_id);
        res.status(201).json({
            status: STATUS_SUCCESS,
            data: schedule,
        });
    } else {
        return next(
            new AppError(403, STATUS_FAIL, MESSAGE_NO_PERMISSION),
            req,
            res,
            next
        );
    }
};

const findScheduleById = async (req, res, next) => {
    const { id } = req.params;
    const schedule = await findScheduleByIdAndPopulate(id);

    if (schedule) {
        res.status(200).json({
            status: STATUS_SUCCESS,
            data: schedule,
        });
    }

    return next(
        new AppError(
            404,
            STATUS_FAIL,
            `Lịch với mã = ${id} không được tìm thấy!`
        ),
        req,
        res,
        next
    );
};

const getAllSchedule = async (req, res, next) => {
    const schedules = await Schedule.find({})
        .populate('day')
        .populate('time')
        .populate('doctor');

    const schedule_list = await Promise.all(
        schedules.map(async (schedule) => {
            let doctor = schedule['doctor'];
            const person = await Person.findById(doctor.person);
            doctor['person'] = person;

            schedule['doctor'] = doctor;

            return schedule;
        })
    );

    res.status(200).json({
        status: STATUS_SUCCESS,
        data: schedule_list,
    });
};

const getAllScheduleByDoctorId = async (req, res, next) => {
    const { doctorId } = req.params;

    const schedules = await Schedule.find({ doctor: doctorId })
        .populate('doctor')
        .populate('time')
        .populate('day');

    res.status(200).json({
        status: STATUS_SUCCESS,
        data: schedules,
    });
};

const updateScheduleById = async (req, res, next) => {
    const { rule } = req;
    if (rule === RULE_DOCTOR) {
        // const { doctor, day, time } = req.body;
        // const isExist = await checkScheduleExist(doctor, day, time);

        // if (isExist) {
        //     return next(
        //         new AppError(400, STATUS_FAIL, 'Schedule was existed!'),
        //         req,
        //         res,
        //         next
        //     );
        // }

        const { doc, error } = await Base.updateAndReturnObject(Schedule)(
            req,
            res,
            next
        );

        if (error) {
            return next(error);
        }

        const { _id } = doc;

        const schedule = await findScheduleByIdAndPopulate(_id);
        res.status(201).json({
            status: STATUS_SUCCESS,
            data: schedule,
        });
    } else {
        return next(
            new AppError(403, STATUS_FAIL, MESSAGE_NO_PERMISSION),
            req,
            res,
            next
        );
    }
};

const deleteScheduleById = async (req, res, next) => {
    const { account_id, rule } = req;

    if (rule === RULE_DOCTOR || rule === RULE_ADMIN) {
        const { id } = req.params;
        const person = await Person.findOne({ account: account_id });
        const doctor = await Doctor.findOne({ person: person.id });

        const scheduleOfDoctor = await Schedule.findById(id);
        if (
            scheduleOfDoctor?.doctor?._id?.valueOf() ===
                doctor?._id?.valueOf() ||
            rule === RULE_ADMIN
        ) {
            return Base.deleteOne(Schedule)(req, res, next);
        }

        return next(
            new AppError(
                403,
                STATUS_FAIL,
                'Bạn không được quyền xóa lịch của người khác'
            ),
            req,
            res,
            next
        );
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
    createSchedule,
    findScheduleById,
    getAllSchedule,
    getAllScheduleByDoctorId,
    updateScheduleById,
    deleteScheduleById,
};
