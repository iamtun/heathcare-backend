import moment from 'moment';
import {
    MESSAGE_NO_PERMISSION,
    RULE_DOCTOR_REMIND,
    RULE_PATIENT,
    RULE_SOS,
    RULE_WARNING,
    STATUS_FAIL,
    STATUS_SUCCESS,
} from '../../common/constant.js';
import Notification from '../../models/notification.model.js';
import Glycemic from '../../models/patient/glycemic.model.js';
import Patient from '../../models/patient/patient.model.js';
import Rule from '../../models/rule.model.js';
import AppError from '../../utils/error.util.js';
import baseController from '../utils/base.controller.js';
import Base from '../utils/base.controller.js';
import conversationController from '../utils/conversation.controller.js';
import { spCompareDateWithNow } from './bmi.controller.js';
import { handleGlycemicStatus } from './schedule_detail.controller.js';

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

    if (!req.body.metric) {
        return next(
            new AppError(400, STATUS_FAIL, 'Vui lòng nhập chỉ số huyết áp'),
            req,
            res,
            next
        );
    }

    if (req.body.metric > 300) {
        return next(
            new AppError(
                400,
                STATUS_FAIL,
                'Chỉ số đường huyết này không khả dụng. Vui lòng nhập lại'
            ),
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

    req.body.case_gly = req.body.case;
    const { doc, error } = await baseController.createAndReturnObject(Glycemic)(
        req,
        res,
        next
    );
    if (error) {
        return next(error);
    }

    if (doc) {
        try {
            const patient = await Patient.findOne({
                _id: doc['patient'].toString(),
            }).populate('person');

            let notification = null;
            if (patient?.doctor_glycemic_id) {
                const conversation_id =
                    await conversationController.findConversationBy2Id(
                        patient.id,
                        patient.doctor_glycemic_id._id
                    );

                const number = handleGlycemicStatus(doc);

                const _notification = new Notification({
                    conversation_id,
                    from: patient.id,
                    to: patient.doctor_glycemic_id._id,
                    content: `Bệnh nhân ${
                        patient['person']['username']
                    } vừa cập nhật chỉ số Đường huyết ${
                        doc.case === 1
                            ? 'Trước khi ăn'
                            : doc.case === 2
                            ? 'Sau khi ăn'
                            : 'Trước khi ngủ'
                    } : ${doc.metric} mg/dl`,
                    rule:
                        number === 0
                            ? RULE_DOCTOR_REMIND
                            : number === 1
                            ? RULE_WARNING
                            : RULE_SOS,
                });

                const __notification = await _notification.save();

                notification = __notification;
            }

            const rules = await Rule.find({ type: 'GLYCEMIC' });
            const rule = rules.find(
                (rule) =>
                    doc.metric >= rule.start &&
                    doc.metric <= rule.end &&
                    rule.case_gly === doc.case
            );

            return res.status(201).json({
                status: STATUS_SUCCESS,
                data: {
                    doc,
                    notification,
                    rule: rule ?? {
                        notification:
                            'Thông báo cho chỉ số này hiện tại đang cập nhật',
                    },
                },
            });
        } catch (error) {
            return next(error);
        }
    }
};

const getAllGlycemicByPatientId = async (req, res, next) => {
    const { id } = req.params;
    const glycemics = await Glycemic.find({ patient: id });

    const rules = await Rule.find({ type: 'GLYCEMIC' });
    const _glycemics = glycemics.map((gly) => {
        const rule = rules.find(
            (rule) =>
                gly.metric >= rule.start &&
                gly.metric <= rule.end &&
                rule.case_gly === gly.case
        );

        return {
            ...gly._doc,
            notification:
                rule ?? 'Thông báo cho chỉ số này hiện tại đang cập nhật',
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
