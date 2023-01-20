import Patient from '../models/patient.model.js';
import AppError from '../utils/error.util.js';
import { createPerson } from '../utils/person.util.js';

const createPatient = async (req, res, next) => {
    const { rule, account_id, file } = req;
    if (rule === 'patient') {
        const { username, dob, address, gender, blood } = req.body;
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
                    new AppError(400, 'fail', 'account id exist'),
                    req,
                    res,
                    next
                );
            } else {
                const patient = await Patient.create({
                    person: personModel._id,
                });

                res.status(201).json({ status: 'success', data: patient });
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

const findPatientById = async (req, res, next) => {
    try {
        const id = req.params.id;
        const patient = await Patient.findById(id).populate('person');
        if (!patient) {
            return next(
                new AppError(404, 'fail', `Don't find patient with id = ${id}`),
                req,
                res,
                next
            );
        }

        res.status(200).json({ status: 'success', data: patient });
    } catch (error) {
        next(error);
    }
};

export default { createPatient, findPatientById };
