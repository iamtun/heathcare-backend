import {
    MESSAGE_ERROR_NUMBER_RULE,
    MESSAGE_NO_ENOUGH_IN_4,
    MESSAGE_NO_PERMISSION,
    RULE_ADMIN,
    STATUS_FAIL,
} from '../../common/constant.js';
import Base from '../utils/base.controller.js';
import Rule from '../../models/rule.model.js';
import AppError from '../../utils/error.util.js';
import Doctor from '../../models/doctor/doctor.model.js';

const createRule = async (req, res, next) => {
    const { rule } = req;

    if (rule === RULE_ADMIN) {
        const { start, end, notification, type, gender } = req.body;

        if (start && end && notification && type) {
            let rules = [];
            if (type === 'BMI') {
                if (typeof gender === 'undefined')
                    return next(
                        new AppError(
                            401,
                            STATUS_FAIL,
                            'Bạn cần chọn giới tính đối với rule là BMI'
                        ),
                        req,
                        res,
                        next
                    );
                rules = await Rule.find({ type: type, gender: gender });
            } else {
                rules = await Rule.find({ type: type });
            }
            const maxRuleEnd = rules.map((rule) => rule.end);
            const max = Math.max(...maxRuleEnd);
            if (max > start) {
                return next(
                    new AppError(
                        401,
                        STATUS_FAIL,
                        'Chỉ số trước phải lớn hơn chỉ số lớn nhất của danh sách '
                    ),
                    req,
                    res,
                    next
                );
            }
            if (start < end) {
                if (type === 'BMI') {
                    if (typeof gender === 'undefined')
                        return next(
                            new AppError(
                                401,
                                STATUS_FAIL,
                                'Bạn cần chọn giới tính đối với rule là BMI'
                            ),
                            req,
                            res,
                            next
                        );
                    if (start > 30)
                        return next(
                            new AppError(
                                401,
                                STATUS_FAIL,
                                'Giá trị lớn nhất của BMI là 30'
                            ),
                            req,
                            res,
                            next
                        );

                    return Base.createOne(Rule)(req, res, next);
                }

                return Base.createOne(Rule)(req, res, next);
            } else {
                return next(
                    new AppError(401, STATUS_FAIL, MESSAGE_ERROR_NUMBER_RULE),
                    req,
                    res,
                    next
                );
            }
        } else {
            return next(
                new AppError(401, STATUS_FAIL, MESSAGE_NO_ENOUGH_IN_4),
                req,
                res,
                next
            );
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

const updateRule = async (req, res, next) => {
    const { rule } = req;

    if (rule === RULE_ADMIN) {
        const { start, end, notification, type } = req.body;
        if (start && end && notification && type) {
            if (start < end) {
                return Base.updateOne(Rule)(req, res, next);
            } else {
                return next(
                    new AppError(401, STATUS_FAIL, MESSAGE_ERROR_NUMBER_RULE),
                    req,
                    res,
                    next
                );
            }
        } else {
            return next(
                new AppError(401, STATUS_FAIL, MESSAGE_NO_ENOUGH_IN_4),
                req,
                res,
                next
            );
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
const getAllRules = Base.getAll(Rule);
const findRuleById = Base.getOne(Rule);

const censorship = async (req, res, next) => {
    const { rule } = req;
    if (rule === RULE_ADMIN) {
        return Base.updateOne(Doctor)(req, res, next);
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
    createRule,
    getAllRules,
    findRuleById,
    updateRule,
    censorship,
};
