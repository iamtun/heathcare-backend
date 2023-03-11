import {
    MESSAGE_NO_PERMISSION,
    RULE_PATIENT,
    STATUS_FAIL,
    STATUS_SUCCESS,
} from '../../common/constant.js';
import Glycemic from '../../models/glycemic.model.js';
import AppError from '../../utils/error.util.js';
import Base from '../utils/base.controller.js';
import { spCompareDateWithNow } from './bmi.controller.js';

const createGlycemic = async (req, res, next) => {
    const { rule } = req;
    if (rule !== RULE_PATIENT) {
        return next(
            new AppError(403, STATUS_FAIL, MESSAGE_NO_PERMISSION),
            req,
            res,
            next
        );
    }

    const glycemics = await Glycemic.find({});
    const lastGlycemic = glycemics[glycemics.length - 1];
    if (glycemics.length > 0 && spCompareDateWithNow(lastGlycemic.createdAt)) {
        return next(
            new AppError(
                400,
                STATUS_FAIL,
                'Bạn đã nhập chỉ số đường huyết cho ngày hôm nay vui lòng đợi ngày mai!'
            )
        );
    }

    return Base.createOne(Glycemic)(req, res, next);
};

const getAllGlycemicByPatientId = async (req, res, next) => {
    const { id } = req.params;
    const glycemics = await Glycemic.find({ patient: id });

    res.status(200).json({ status: STATUS_SUCCESS, data: glycemics });
};

const getLastGlycemicByPatientId = async (req, res, next) => {
    try {
        const { id } = req.params;
        const glycemics = await Glycemic.find({ patient: id });
        const glycemic = glycemics[glycemics.length - 1];

        res.status(200).json({
            status: STATUS_SUCCESS,
            data: glycemic?.metric ? glycemic.metric : 0,
        });
    } catch (error) {
        return next(error);
    }
};

export default {
    createGlycemic,
    getAllGlycemicByPatientId,
    getLastGlycemicByPatientId,
};
