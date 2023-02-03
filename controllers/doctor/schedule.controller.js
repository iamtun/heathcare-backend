import { RULE_DOCTOR } from '../../common/constant.js';
import Base from '../utils/base.controller.js';

import Schedule from '../../models/schedule.model.js';
import AppError from '../../utils/error.util.js';

const createSchedule = async (req, res, next) => {
    const { rule } = req;
    if (rule === RULE_DOCTOR) {
        return Base.createOne(Schedule)(req, res, next);
    } else {
        return next(
            new AppError(403, 'fail', 'You no permission!'),
            req,
            res,
            next
        );
    }
};

export default { createSchedule };
