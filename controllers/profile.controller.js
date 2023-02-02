import Profile from '../models/profile.model.js';
import Person from '../models/person.model.js';
import Doctor from '../models/doctor.model.js';
import AppError from '../utils/error.util.js';

const createProfileToDoctor = async (req, res, next) => {
    const { rule } = req;

    if (rule === 'doctor') {
        const {
            specialist,
            training_place,
            degree,
            languages,
            certificate,
            education,
            experiences,
            doctor_id,
        } = req.body;

        if (
            specialist &&
            training_place &&
            degree &&
            languages &&
            education &&
            experiences &&
            doctor_id
        ) {
            const profile = {
                specialist,
                training_place,
                degree,
                languages,
                certificate,
                education,
                experiences,
                doctor: doctor_id,
            };

            try {
                const profileModel = await Profile.create(profile);
                if (profileModel) {
                    const profile = await Profile.findOne({
                        _id: profileModel._id,
                    }).populate('doctor');

                    if (profile) {
                        const person = await Person.findById(
                            profile.doctor.person
                        );
                        profile['doctor']['person'] = person;

                        res.status(200).json({
                            status: 'success',
                            data: profile,
                        });
                    }
                }
            } catch (error) {
                return next(
                    new AppError(400, 'fail', error.message),
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
    }
};

const findDoctorProfileByDoctorId = async (req, res, next) => {
    const { account_id } = req;

    try {
        const person = await Person.findOne({ account: account_id });
        if (person) {
            const doctor = await Doctor.findOne({ person: person._id });

            if (doctor) {
                const profile = await Profile.findOne({
                    doctor: `${doctor._id}`,
                }).populate('doctor');

                if (profile) {
                    const person = await Person.findById(profile.doctor.person);
                    profile['doctor']['person'] = person;

                    res.status(200).json({
                        status: 'success',
                        data: profile,
                    });
                } else {
                    res.status(404).json({
                        status: 'fail',
                        message: `no find profile with doctor id ${doctor._id}`,
                    });
                }
            } else {
                res.status(404).json({
                    status: 'fail',
                    message: `no find doctor with person id: ${person._id}`,
                });
            }
        } else {
            res.status(404).json({
                status: 'fail',
                message: `no find person with account id: ${id}`,
            });
        }
    } catch (error) {
        next(error);
    }
};
export default { createProfileToDoctor, findDoctorProfileByDoctorId };
