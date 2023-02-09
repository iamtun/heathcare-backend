import { RULE_ADMIN, STATUS_FAIL } from '../../common/constant.js';
import Day from '../../models/day.model.js';
import AppError from '../../utils/error.util.js';
import Base from '../utils/base.controller.js';

const createDay = async (req, res, next) => {
    const { rule } = req;
    if (rule === RULE_ADMIN) {
        return Base.createOne(Day)(req, res, next);
    } else {
        return next(
            new AppError(403, STATUS_FAIL, 'You no permission!'),
            req,
            res,
            next
        );
    }
};

const getAllDay = Base.getAll(Day);
export default { createDay, getAllDay };
