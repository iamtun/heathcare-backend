import Doctor from '../models/doctor.model.js';
import AppError from '../utils/error.util.js';
import { createPerson, updatePerson } from '../utils/person.util.js';

const createDoctor = async (req, res, next) => {
    const { rule, account_id, file } = req;
    if (rule === 'doctor') {
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
                    new AppError(400, 'fail', 'account id exist'),
                    req,
                    res,
                    next
                );
            } else {
                const doctorModel = await Doctor.create({
                    person: personModel._id,
                });

                res.status(201).json({ status: 'success', data: doctorModel });
            }
        } else {
            return next(
                new AppError(400, 'fail', 'Please provide enough information!'),
                req,
                res,
                next
            );
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

const updateDoctorInfoById = async (req, res, next) => {
    const { rule } = req;
    const { id } = req.params;
    if (rule === 'doctor') {
        const { username, dob, address, gender } = req.body;
        if ((username || dob || address || gender) && id) {
            try {
                const doctorModel = await Doctor.findById(id);
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
                        status: 'success',
                        data: oldPerson,
                    });
                } else {
                    return next(
                        new AppError(
                            404,
                            'fail',
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
                new AppError(400, 'fail', 'Please provide enough information!'),
                req,
                res,
                next
            );
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

const findDoctorById = async (req, res, next) => {
    try {
        const id = req.params.id;
        const doctor = await Doctor.findById(id).populate('person');
        if (!doctor) {
            return next(
                new AppError(404, 'fail', `Don't find doctor with id = ${id}`),
                req,
                res,
                next
            );
        }

        res.status(200).json({ status: 'success', data: doctor });
    } catch (error) {
        next(error);
    }
};

const getAllDoctors = async (req, res, next) => {
    try {
        const doctors = await Doctor.find().populate('person');
        if (doctors.length === 0) {
            return next(
                new AppError(404, 'fail', `Don't find list doctor`),
                req,
                res,
                next
            );
        }
        res.status(200).json({ status: 'success', data: doctors });
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
                new AppError(404, 'fail', `Don't find list doctor`),
                req,
                res,
                next
            );
        }
        res.status(200).json({ status: 'success', data: doctors });
    } catch (error) {
        next(error);
    }
};

export default {
    createDoctor,
    findDoctorById,
    getAllDoctors,
    getDoctorListWaitingAccept,
    updateDoctorInfoById,
};
