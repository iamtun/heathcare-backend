import {
    MESSAGE_NO_PERMISSION,
    RULE_DOCTOR_REMIND,
    RULE_PATIENT,
    STATUS_FAIL,
    STATUS_SUCCESS,
} from '../../common/constant.js';
import Notification from '../../models/notification.model.js';
import BloodPressure from '../../models/patient/blood_pressures.model.js';
import Patient from '../../models/patient/patient.model.js';
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

    const { doc, error } = await BaseController.createAndReturnObject(
        BloodPressure
    )(req, res, next);

    if (error) {
        return next(error);
    }
    if (doc) {
        try {
            const patient = await Patient.findOne({
                _id: doc['patient'].toString(),
            }).populate('person');

            let notification = null;
            if (patient?.doctor_blood_id) {
                const notification = new Notification({
                    from: patient.id,
                    to: patient.doctor_blood_id._id,
                    content: `Bệnh nhân ${patient['person']['username']} vừa cập nhật chỉ số  huyết áp: Tâm Thu: ${doc.systolic} - Tâm trương: ${doc.diastole}`,
                    rule: RULE_DOCTOR_REMIND,
                });

                const _notification = await notification.save();

                notification = _notification;
            }

            return res.status(201).json({
                status: STATUS_SUCCESS,
                data: {
                    doc,
                    notification,
                },
            });
        } catch (error) {
            return next(error);
        }
    }
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
