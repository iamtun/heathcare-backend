import {
    MESSAGE_NO_PERMISSION,
    RULE_ADMIN,
    STATUS_FAIL,
} from '../../common/constant.js';
import Day from '../../models/day.model.js';
import AppError from '../../utils/error.util.js';
import Base from '../utils/base.controller.js';

const createDay = async (req, res, next) => {
    const { rule } = req;
    if (rule === RULE_ADMIN) {
        const days = await Day.find({});
        const index = days.findIndex(
            (day) => day.day_number === req.body.day_number
        );
        if (index > -1) {
            return next(
                new AppError(400, STATUS_FAIL, 'Ngày làm này đã tồn tại!'),
                req,
                res,
                next
            );
        }
        return Base.createOne(Day)(req, res, next);
    } else {
        return next(
            new AppError(403, STATUS_FAIL, MESSAGE_NO_PERMISSION),
            req,
            res,
            next
        );
    }
};

const getAllDay = Base.getAll(Day);
export default { createDay, getAllDay };
