import { RULE_PATIENT } from '../../common/constant.js';
import Patient from '../../models/patient.model.js';
import Person from '../../models/person.model.js';
import AppError from '../../utils/error.util.js';
import { createPerson } from '../../utils/person.util.js';

const createPatient = async (req, res, next) => {
    const { rule, account_id, file } = req;
    if (rule === RULE_PATIENT) {
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
                    blood: blood,
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
                        'fail',
                        `Don't find patient with id = ${id}`
                    ),
                    req,
                    res,
                    next
                );
            }

            res.status(200).json({ status: 'success', data: patient });
        } catch (error) {
            next(error);
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

export default { createPatient, findPatientByToken };
