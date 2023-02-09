import { RULE_ADMIN, STATUS_FAIL } from '../../common/constant.js';
import Shift from '../../models/shift.model.js';
import AppError from '../../utils/error.util.js';
import Base from '../utils/base.controller.js';

const getShiftById = Base.getOne(Shift);
const getAllShifts = Base.getAll(Shift);

const createShift = async (req, res, next) => {
    const { rule } = req;
    if (rule === RULE_ADMIN) {
        const { name, time_start, time_end } = req.body;
        const isExist = await Shift.findOne({ name });
        if (
            isExist &&
            time_start === isExist?.time_start &&
            time_end === isExist?.time_end
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
        new AppError(403, STATUS_FAIL, 'You no permission!'),
        req,
        res,
        next
    );
};

const updateShift = async (req, res, next) => {
    const { rule } = req;
    if (rule === RULE_ADMIN) return Base.updateOne(Shift)(req, res, next);
    return next(
        new AppError(403, STATUS_FAIL, 'You no permission!'),
        req,
        res,
        next
    );
};

export default { createShift, getShiftById, getAllShifts, updateShift };
