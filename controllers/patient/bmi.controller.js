import {
    MESSAGE_NO_PERMISSION,
    RULE_PATIENT,
    STATUS_FAIL,
    STATUS_SUCCESS,
} from '../../common/constant.js';
import BMI from '../../models/bmi.model.js';
import AppError from '../../utils/error.util.js';
import Base from '../utils/base.controller.js';
import Rule from '../../models/rule.model.js';
import Patient from '../../models/patient.model.js';

const calBMI = (w, h) => {
    return parseFloat((w / ((h * h) / 10000)).toFixed(2));
};

const spCreateBMI = async (req, res, next) => {
    req.body.calBMI = calBMI(req.body.weight, req.body.height);
    const bmi = await Base.createAndReturnObject(BMI)(req, res, next);
    const { doc, error } = bmi;

    const rules = await Rule.find({ type: 'BMI' });

    const bmis = await BMI.find({ patient: req.body.patient });
    const _avgBMI = bmis.reduce((accumulator, currentValue) => {
        return accumulator + calBMI(currentValue.weight, currentValue.height);
    }, 0);

    const __avgBMI = parseFloat((_avgBMI / bmis.length).toFixed(2));

    const rule = rules.find(
        (rule) =>
            __avgBMI >= rule.start &&
            __avgBMI <= rule.end &&
            (doc.gender ? doc.gender === rule.gender : true)
    );

    if (doc) {
        res.status(201).json({
            status: STATUS_SUCCESS,
            data: {
                avgBMI: __avgBMI,
                doc,
                rule,
            },
        });
    } else {
        return next(new AppError(400, STATUS_FAIL, error), req, res, next);
    }
};

export const spCompareDateWithNow = (date) => {
    const now = new Date();
    const dateBMICreated = new Date(date);
    if (
        now.getDate() === dateBMICreated.getDate() &&
        now.getMonth() === dateBMICreated.getMonth() &&
        now.getFullYear() === dateBMICreated.getFullYear()
    ) {
        return true;
    }

    return false;
};

const createBMI = async (req, res, next) => {
    const { rule } = req;
    if (rule !== RULE_PATIENT) {
        return next(
            new AppError(403, STATUS_FAIL, MESSAGE_NO_PERMISSION),
            req,
            res,
            next
        );
    }

    const bmis = await BMI.find({ patient: req.body.patient });
    const lastBMI = bmis[bmis.length - 1];
    if (bmis.length > 0 && spCompareDateWithNow(lastBMI.createdAt)) {
        return next(
            new AppError(
                400,
                STATUS_FAIL,
                'Bạn đã nhập chỉ số BMI cho ngày hôm nay vui lòng đợi ngày mai!'
            )
        );
    }

    return spCreateBMI(req, res, next);
};

const getAllBMIOfPatientById = async (req, res, next) => {
    const { id } = req.params;

    const patient = await Patient.findById(id).populate('person');

    const bmis = await BMI.find({ patient: id });
    const _avgBMI = bmis.reduce((accumulator, currentValue) => {
        return accumulator + calBMI(currentValue.weight, currentValue.height);
    }, 0);

    const __avgBMI = parseFloat((_avgBMI / bmis.length).toFixed(2));
    const rules = await Rule.find({ type: 'BMI' });

    const rule = rules.find(
        (rule) =>
            __avgBMI >= rule.start &&
            __avgBMI <= rule.end &&
            (patient.person.gender
                ? patient.person.gender === rule.gender
                : true)
    );

    res.status(200).json({
        status: STATUS_SUCCESS,
        data: {
            avgBMI: __avgBMI,
            bmis,
            rule,
        },
    });
};

export default { createBMI, getAllBMIOfPatientById };
