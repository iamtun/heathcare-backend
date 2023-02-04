import { RULE_DOCTOR } from '../../common/constant.js';
import Base from '../utils/base.controller.js';

import Schedule from '../../models/schedule.model.js';
import AppError from '../../utils/error.util.js';

const createSchedule = async (req, res, next) => {
    const { rule } = req;
    if (rule === RULE_DOCTOR) {
        const { doc, error } = await Base.createAndReturnObject(Schedule)(
            req,
            res,
            next
        );

        if (error) {
            return next(error);
        }

        const { _id } = doc;
        const schedule = await Schedule.findById(_id)
            .populate('doctor')
            .populate('time')
            .populate('day');

        res.status(201).json({
            status: 'success',
            data: schedule,
        });
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
