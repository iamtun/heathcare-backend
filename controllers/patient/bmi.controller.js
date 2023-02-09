import { RULE_PATIENT } from '../../common/constant.js';
import BMI from '../../models/bmi.model.js';
import AppError from '../../utils/error.util.js';
import Base from '../utils/base.controller.js';

const calBMI = (w, h) => {
    return parseFloat((w / ((h * h) / 10000)).toFixed(2));
};

const createBMI = async (req, res, next) => {
    const { rule } = req;
    if (rule === RULE_PATIENT) {
        const bmi = await Base.createAndReturnObject(BMI)(req, res, next);
        const { doc, error } = bmi;
        if (doc) {
            const { weight, height, _id, patient, createdAt } = doc;
            const _calBMI = calBMI(weight, height);
            res.status(201).json({
                status: 'success',
                data: {
                    _id,
                    patient,
                    weight,
                    height,
                    calBMI: _calBMI,
                    createdAt,
                },
            });
        } else {
            return next(new AppError(400, 'fail', error), req, res, next);
        }
    } else {
        return next(
            new AppError(403, 'fail', 'You no permission!'),
            req,
            res,
            next
        );
    }
};

const getAllBMIOfPatientById = async (req, res, next) => {
    const { id } = req.params;
    const bmis = await BMI.find({ patient: id });
    const _avgBMI = bmis.reduce((accumulator, currentValue) => {
        return accumulator + calBMI(currentValue.weight, currentValue.height);
    }, 0);

    res.status(200).json({
        status: 'success',
        data: {
            avgBMI: parseFloat((_avgBMI / bmis.length).toFixed(2)),
            bmis,
        },
    });
};

export default { createBMI, getAllBMIOfPatientById };
