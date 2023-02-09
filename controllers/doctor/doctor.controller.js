import {
    RULE_ADMIN,
    RULE_DOCTOR,
    STATUS_FAIL,
    STATUS_SUCCESS,
} from '../../common/constant.js';
import Doctor from '../../models/doctor.model.js';
import AppError from '../../utils/error.util.js';
import { createPerson, updatePerson } from '../../utils/person.util.js';
import Base from '../utils/base.controller.js';

const createDoctor = async (req, res, next) => {
    const { rule, account_id, file } = req;
    if (rule === RULE_DOCTOR) {
        const { username, dob, address, gender } = req.body;
        if (username && dob && address && gender && account_id) {
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
                    new AppError(400, STATUS_FAIL, 'account id exist'),
                    req,
                    res,
                    next
                );
            } else {
                const doctorModel = await Doctor.create({
                    person: personModel._id,
                });

                res.status(201).json({
                    status: STATUS_SUCCESS,
                    data: doctorModel,
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
            new AppError(403, STATUS_FAIL, 'You no permission!'),
            req,
            res,
            next
        );
    }
};

const updateDoctorInfoById = async (req, res, next) => {
    const { rule } = req;
    if (rule === RULE_DOCTOR) {
        const { username, dob, address, gender, doctor_id } = req.body;
        if ((username || dob || address || gender) && doctor_id) {
            try {
                const doctorModel = await Doctor.findById(doctor_id);
                const newPerson = { username, dob, address, gender };
                if (doctorModel) {
                    const { person } = doctorModel;

                    const { oldPerson, error } = await updatePerson(
                        newPerson,
                        person
                    );
                    if (error) {
                        return next(error);
                    }

                    res.status(201).json({
                        status: STATUS_SUCCESS,
                        data: oldPerson,
                    });
                } else {
                    return next(
                        new AppError(
                            404,
                            STATUS_FAIL,
                            `Don't find doctor with id = ${id}`
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
            new AppError(403, STATUS_FAIL, 'You no permission!'),
            req,
            res,
            next
        );
    }
};

const findDoctorById = async (req, res, next) => {
    try {
        const id = req.params.id;
        const doctor = await Doctor.findById(id).populate('person');
        if (!doctor) {
            return next(
                new AppError(
                    404,
                    STATUS_FAIL,
                    `Don't find doctor with id = ${id}`
                ),
                req,
                res,
                next
            );
        }

        res.status(200).json({ status: STATUS_SUCCESS, data: doctor });
    } catch (error) {
        next(error);
    }
};

const getAllDoctors = async (req, res, next) => {
    try {
        const doctors = await Doctor.find().populate('person');
        if (doctors.length === 0) {
            return next(
                new AppError(404, STATUS_FAIL, `Don't find list doctor`),
                req,
                res,
                next
            );
        }
        res.status(200).json({ status: STATUS_SUCCESS, data: doctors });
    } catch (error) {
        next(error);
    }
};

const getDoctorListWaitingAccept = async (req, res, next) => {
    try {
        const doctors = await Doctor.find({ isAccepted: false }).populate(
            'person'
        );
        if (doctors.length === 0) {
            return next(
                new AppError(404, STATUS_FAIL, `Don't find list doctor`),
                req,
                res,
                next
            );
        }
        res.status(200).json({ status: STATUS_SUCCESS, data: doctors });
    } catch (error) {
        next(error);
    }
};

const censorship = async (req, res, next) => {
    const { rule } = req;
    if (rule === RULE_ADMIN) {
        return Base.updateOne(Doctor)(req, res, next);
    } else {
        return next(
            new AppError(403, STATUS_FAIL, 'You no permission!'),
            req,
            res,
            next
        );
    }
};

export default {
    createDoctor,
    findDoctorById,
    getAllDoctors,
    getDoctorListWaitingAccept,
    updateDoctorInfoById,
    censorship,
};
