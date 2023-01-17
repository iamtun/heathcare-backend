import Doctor from '../models/doctor.model.js';
import Person from '../models/person.model.js';
import AppError from '../utils/error.util.js';

const createDoctor = async (req, res, next) => {
    const { rule, account_id } = req;
    if (rule === 'doctor') {
        const { username, dob, address, gender, avatar } = req.body;
        if (username && dob && address && gender && account_id) {
            const personModel = await Person.create({
                username,
                dob,
                address,
                gender,
                avatar,
                account: account_id,
            });

            const doctorModel = await Doctor.create({
                person: personModel._id,
            });

            res.status(201).json({ status: 'success', data: doctorModel });
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
        const { username, dob, address, gender, avatar } = req.body;
        if ((username || dob || address || gender) && id) {
            const doctorModel = await Doctor.findById(id);
            if (doctorModel) {
                const { person } = doctorModel;
                const personModel = await Person.findById(person);
                personModel.username = username || personModel.username;
                personModel.dob = dob || personModel.dob;
                personModel.address = address || personModel.address;
                personModel.avatar = avatar || personModel.avatar;

                const personModelUpdated = await personModel.save();
                res.status(201).json({
                    status: 'success',
                    data: personModelUpdated,
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
    } catch (error) {}
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
    } catch (error) {}
};

export default {
    createDoctor,
    findDoctorById,
    getAllDoctors,
    getDoctorListWaitingAccept,
    updateDoctorInfoById,
};
