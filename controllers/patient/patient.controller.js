import {
    MESSAGE_NO_ENOUGH_IN_4,
    MESSAGE_NO_PERMISSION,
    RULE_PATIENT,
    STATUS_FAIL,
    STATUS_SUCCESS,
} from '../../common/constant.js';
import Patient from '../../models/patient.model.js';
import Person from '../../models/person.model.js';
import AppError from '../../utils/error.util.js';
import { createPerson, updatePerson } from '../../utils/person.util.js';

const createPatient = async (req, res, next) => {
    const { rule, account_id, file } = req;
    if (rule === RULE_PATIENT) {
        const { username, dob, address, gender, blood, anamnesis } = req.body;
        if (username && dob && address && gender && blood && account_id) {
            const person = {
                username,
                dob,
                address,
                gender,
                avatar: file ? file.path : '',
                account: account_id,
            };
            const { personModel, error } = await createPerson(person);
            if (error) {
                return next(
                    new AppError(400, STATUS_FAIL, error),
                    req,
                    res,
                    next
                );
            } else {
                const patient = await Patient.create({
                    person: personModel._id,
                    blood: blood,
                    anamnesis: anamnesis,
                });

                const patientResp = await Patient.findById(
                    patient._id
                ).populate('person');
                res.status(201).json({
                    status: STATUS_SUCCESS,
                    data: patientResp,
                });
            }
        } else {
            return next(
                new AppError(
                    400,
                    STATUS_FAIL,
                    'Please provide enough information!'
                ),
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

const findPatientByToken = async (req, res, next) => {
    const { account_id, rule } = req;
    if (rule === RULE_PATIENT) {
        try {
            const person = await Person.findOne({ account: account_id });
            const patient = await Patient.findOne({
                person: person._id,
            }).populate('person');
            if (!patient) {
                return next(
                    new AppError(
                        404,
                        STATUS_FAIL,
                        `Don't find patient with id = ${id}`
                    ),
                    req,
                    res,
                    next
                );
            }

            res.status(200).json({ status: STATUS_SUCCESS, data: patient });
        } catch (error) {
            next(error);
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

const findPatientById = async (req, res, next) => {
    const { id } = req.params;
    const patient = await Patient.findById(id).populate('person');
    if (patient) {
        res.status(200).json({
            status: STATUS_SUCCESS,
            data: patient,
        });
    } else {
        res.status(404).json({
            status: STATUS_FAIL,
            message: `Not found patient with id ${id}`,
        });
    }
};

const updatePatientInfoById = async (req, res, next) => {
    const { rule, file } = req;
    const { id } = req.params;
    if (rule === RULE_PATIENT) {
        const { username, dob, address, gender, blood } = req.body;
        if ((username || dob || address || gender || file || blood) && id) {
            try {
                const patientModel = await Patient.findById(id);

                const newPerson = {
                    username,
                    dob,
                    address,
                    gender,
                    avatar: file ? file.path : '',
                };

                if (patientModel) {
                    const { person } = patientModel;

                    const { oldPerson, error } = await updatePerson(
                        newPerson,
                        person
                    );
                    if (error) {
                        return next(error);
                    }

                    if (blood) {
                        const patient = await Patient.findByIdAndUpdate(
                            id,
                            { blood: blood },
                            { new: true }
                        ).populate('person');

                        return res.status(201).json({
                            status: STATUS_SUCCESS,
                            data: patient,
                        });
                    }

                    return res.status(201).json({
                        status: STATUS_SUCCESS,
                        data: oldPerson,
                    });
                } else {
                    return next(
                        new AppError(
                            404,
                            STATUS_FAIL,
                            `Don't find patient with id = ${id}`
                        ),
                        req,
                        res,
                        next
                    );
                }
            } catch (error) {
                next(error);
            }
        } else {
            return next(
                new AppError(400, STATUS_FAIL, MESSAGE_NO_ENOUGH_IN_4),
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

export default {
    createPatient,
    findPatientByToken,
    findPatientById,
    updatePatientInfoById,
};
