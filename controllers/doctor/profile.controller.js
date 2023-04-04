import Profile from '../../models/doctor/profile.model.js';
import Person from '../../models/person.model.js';
import Doctor from '../../models/doctor/doctor.model.js';
import AppError from '../../utils/error.util.js';
import {
    RULE_DOCTOR,
    STATUS_FAIL,
    STATUS_SUCCESS,
} from '../../common/constant.js';

const createProfileToDoctor = async (req, res, next) => {
    const { rule } = req;

    if (rule === RULE_DOCTOR) {
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
                            status: STATUS_SUCCESS,
                            data: profile,
                        });
                    }
                }
            } catch (error) {
                return next(
                    new AppError(400, STATUS_FAIL, error.message),
                    req,
                    res,
                    next
                );
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
    }
};

const findDoctorProfileByAccountId = async (req, res, next) => {
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
                    const doctor = await Doctor.findById(profile.doctor._id)
                        .populate('person')
                        .populate('ratings');
                    if (doctor.ratings.length === 0) doctor['rating'] = 5;
                    else {
                        const count_rating = doctor.ratings.reduce(
                            (accumulator, currentValue) =>
                                accumulator + currentValue,
                            0
                        );

                        const avg_count_rating =
                            count_rating / doctor.ratings.length;
                        doctor['rating'] = Math.round(avg_count_rating);
                    }

                    profile['doctor'] = doctor;

                    res.status(200).json({
                        status: STATUS_SUCCESS,
                        data: profile,
                    });
                } else {
                    res.status(404).json({
                        status: STATUS_FAIL,
                        message: `no find profile with doctor id ${doctor._id}`,
                    });
                }
            } else {
                res.status(404).json({
                    status: STATUS_FAIL,
                    message: `no find doctor with person id: ${person._id}`,
                });
            }
        } else {
            res.status(404).json({
                status: STATUS_FAIL,
                message: `no find person with account id: ${id}`,
            });
        }
    } catch (error) {
        next(error);
    }
};

const findDoctorProfileById = async (req, res, next) => {
    const { id } = req.params;

    try {
        const doctor = await Doctor.findById(id);

        if (doctor) {
            const profile = await Profile.findOne({
                doctor: `${doctor._id}`,
            }).populate('doctor');

            if (profile) {
                const doctor = await Doctor.findById(profile.doctor._id)
                    .populate('person')
                    .populate('ratings');
                if (doctor.ratings.length === 0) doctor['rating'] = 5;
                else {
                    const count_rating = doctor.ratings.reduce(
                        (accumulator, currentValue) =>
                            accumulator + currentValue,
                        0
                    );

                    const avg_count_rating =
                        count_rating / doctor.ratings.length;
                    doctor['rating'] = Math.round(avg_count_rating);
                }

                profile['doctor'] = doctor;

                res.status(200).json({
                    status: STATUS_SUCCESS,
                    data: profile,
                });
            } else {
                res.status(404).json({
                    status: STATUS_FAIL,
                    message: `no find profile with doctor id ${doctor._id}`,
                });
            }
        } else {
            res.status(404).json({
                status: STATUS_FAIL,
                message: `no find doctor with person id: ${person._id}`,
            });
        }
    } catch (error) {
        next(error);
    }
};
export default {
    createProfileToDoctor,
    findDoctorProfileByAccountId,
    findDoctorProfileById,
};