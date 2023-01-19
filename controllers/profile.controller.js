import Profile from '../models/profile.model.js';
import Person from '../models/person.model.js';
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
                    res.status(201).json({
                        status: 'success',
                        data: profileModel,
                    });
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
    const { id } = req.params;

    try {
        const profile = await Profile.findOne({ doctor: `${id}` }).populate(
            'doctor'
        );

        if (profile) {
            const person = await Person.findById(profile.doctor.person);
            profile['doctor']['person'] = person;

            res.status(200).json({
                status: 'success',
                data: profile,
            });
        }
    } catch (error) {
        next(error);
    }
};
export default { createProfileToDoctor, findDoctorProfileByDoctorId };
