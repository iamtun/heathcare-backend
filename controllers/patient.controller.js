import Patient from '../models/patient.model.js';
import Person from '../models/person.model.js';
import AppError from '../utils/error.util.js';

const createPatient = async (req, res, next) => {
    const { rule, account_id } = req;
    if (rule === 'patient') {
        const { username, dob, address, gender, avatar, blood } = req.body;
        if (username && dob && address && gender && blood && account_id) {
            const personModel = await Person.create({
                username,
                dob,
                address,
                gender,
                avatar,
                account: account_id,
            });

            const patientModel = await Patient.create({
                person: personModel._id,
                blood,
            });

            res.status(201).json({ status: 'success', data: patientModel });
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
