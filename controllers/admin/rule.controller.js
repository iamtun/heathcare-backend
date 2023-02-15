import {
    MESSAGE_NO_ENOUGH_IN_4,
    MESSAGE_NO_PERMISSION,
    RULE_ADMIN,
    STATUS_FAIL,
} from '../../common/constant.js';
import Base from '../utils/base.controller.js';
import Rule from '../../models/rule.model.js';

const createRule = async (req, res, next) => {
    const { rule } = req;

    if (rule === RULE_ADMIN) {
        const { start, end, notification, type } = req.body;

        if (start && end && notification && type) {
            return Base.createOne(Rule)(req, res, next);
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
};

export default { createRule };
