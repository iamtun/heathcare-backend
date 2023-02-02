import { RULE_ADMIN } from '../common/constant.js';
import Day from '../models/day.model.js';
import Base from './utils/base.controller.js';

const createDay = async (req, res, next) => {
    const { rule } = req;
    if (rule === RULE_ADMIN) {
        return Base.createOne(Day)(req, res, next);
    } else {
        return next(
            new AppError(403, 'fail', 'You no permission!'),
            req,
            res,
            next
        );
    }
};

export default { createDay };
