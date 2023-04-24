import moment from 'moment';
import {
    MESSAGE_NO_PERMISSION,
    RULE_ADMIN,
    STATUS_FAIL,
} from '../../common/constant.js';
import Shift from '../../models/shift.model.js';
import AppError from '../../utils/error.util.js';
import Base from '../utils/base.controller.js';

const getShiftById = Base.getOne(Shift);
const getAllShifts = Base.getAll(Shift);

const createShift = async (req, res, next) => {
    const { rule } = req;
    if (rule === RULE_ADMIN) {
        const { name, time_start, time_end } = req.body;
        const isExist = await Shift.find({ name });
        const _time_start = new Date(time_start);
        const _time_end = new Date(time_end);

        const DutyStartTimeInput = moment(
            [_time_start.getHours(), _time_start.getMinutes()],
            'HH:mm'
        );

        const DutyStartTimeDB = moment(
            [
                isExist[isExist.length - 1]?.time_start.getHours(),
                isExist[isExist.length - 1]?.time_start.getMinutes(),
            ],
            'HH:mm'
        );

        const DutyEndTimeInput = moment(
            [_time_end.getHours(), _time_end.getMinutes()],
            'HH:mm'
        );

        const DutyEndTimeDB = moment(
            [
                isExist[isExist.length - 1]?.time_end.getHours(),
                isExist[isExist.length - 1]?.time_end.getMinutes(),
            ],
            'HH:mm'
        );

        if (
            DutyStartTimeInput.diff(DutyStartTimeDB, 'minutes') === 0 &&
            DutyEndTimeInput.diff(DutyEndTimeDB, 'minutes') === 0
        ) {
            return next(
                new AppError(400, STATUS_FAIL, 'Ca làm đã tồn tại'),
                req,
                res,
                next
            );
        } else {
            return Base.createOne(Shift)(req, res, next);
        }
    }
    return next(
        new AppError(403, STATUS_FAIL, MESSAGE_NO_PERMISSION),
        req,
        res,
        next
    );
};

const updateShift = async (req, res, next) => {
    const { rule } = req;
    if (rule === RULE_ADMIN) return Base.updateOne(Shift)(req, res, next);
    return next(
        new AppError(403, STATUS_FAIL, MESSAGE_NO_PERMISSION),
        req,
        res,
        next
    );
};

export default { createShift, getShiftById, getAllShifts, updateShift };
