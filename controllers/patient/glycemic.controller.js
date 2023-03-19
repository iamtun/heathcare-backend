import moment from 'moment';
import {
    MESSAGE_NO_PERMISSION,
    RULE_PATIENT,
    STATUS_FAIL,
    STATUS_SUCCESS,
} from '../../common/constant.js';
import Glycemic from '../../models/patient/glycemic.model.js';
import Rule from '../../models/rule.model.js';
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

    const now = new Date();
    const glycemics = await Glycemic.find({
        patient: req.body.patient,
        case: req.body.case,
    });
    const _glycemics = glycemics.filter(
        (item) => moment(now).format('l') === moment(item.createdAt).format('l')
    );

    if (_glycemics.length > 0) {
        return next(
            new AppError(
                400,
                STATUS_FAIL,
                'Bạn đã nhập chỉ số đường huyết cho trường hợp này ngày hôm nay vui lòng đợi ngày mai!'
            )
        );
    }

    return Base.createOne(Glycemic)(req, res, next);
};

const getAllGlycemicByPatientId = async (req, res, next) => {
    const { id } = req.params;
    const glycemics = await Glycemic.find({ patient: id });

    const rules = await Rule.find({ type: 'GLYCEMIC' });
    const _glycemics = glycemics.map((gly) => {
        const rule = rules.find(
            (rule) => gly.metric >= rule.start && gly.metric <= rule.end
        );

        return {
            ...gly._doc,
            notification: rule?.notification ?? 'Chưa có thông báo',
        };
    });

    res.status(200).json({ status: STATUS_SUCCESS, data: _glycemics });
};

const getLastGlycemicByPatientId = async (req, res, next) => {
    try {
        const { id } = req.params;
        const glycemics = await Glycemic.find({ patient: id });
        const glycemic = glycemics[glycemics.length - 1];
        const last_glycemic_date = new Date(glycemic.createdAt);

        const __glycemic = glycemics.map((item) => {
            if (
                moment(last_glycemic_date).format('l') ===
                moment(item.createdAt).format('l')
            ) {
                return item;
            }
        });
        res.status(200).json({
            status: STATUS_SUCCESS,
            data: __glycemic.filter((item) => item != null),
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
