import {
    MESSAGE_NO_PERMISSION,
    RULE_PATIENT,
    STATUS_FAIL,
    STATUS_SUCCESS,
} from '../../common/constant.js';
import BloodPressure from '../../models/patient/blood_pressures.model.js';
import AppError from '../../utils/error.util.js';
import BaseController from '../utils/base.controller.js';
import { spCompareDateWithNow } from './bmi.controller.js';

const createBloodPressureMetric = async (req, res, next) => {
    const { rule } = req;

    if (rule !== RULE_PATIENT) {
        return next(
            new AppError(403, STATUS_FAIL, MESSAGE_NO_PERMISSION),
            req,
            res,
            next
        );
    }

    const blood_pressures = await BloodPressure.find({
        patient: req.body.patient,
    });
    const last_blood_pressures = blood_pressures[blood_pressures.length - 1];
    if (
        blood_pressures.length > 0 &&
        spCompareDateWithNow(last_blood_pressures.createdAt)
    ) {
        return next(
            new AppError(
                400,
                STATUS_FAIL,
                'Bạn đã nhập chỉ số huyết áp cho ngày hôm nay vui lòng đợi ngày mai!'
            )
        );
    }

    return BaseController.createOne(BloodPressure)(req, res, next);
};

const getAllBloodPressuresByPatientId = async (req, res, next) => {
    const { id } = req.params;
    const blood_pressures = await BloodPressure.find({ patient: id });

    return res.status(200).json({
        status: STATUS_SUCCESS,
        data: blood_pressures,
    });
};

const getAll = BaseController.getAll(BloodPressure);
export default {
    createBloodPressureMetric,
    getAllBloodPressuresByPatientId,
    getAll,
};
