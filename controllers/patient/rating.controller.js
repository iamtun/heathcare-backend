import {
    MESSAGE_NO_ENOUGH_IN_4,
    RULE_SYSTEM,
    STATUS_FAIL,
    STATUS_SUCCESS,
} from '../../common/constant.js';
import Doctor from '../../models/doctor/doctor.model.js';
import Patient from '../../models/patient/patient.model.js';
import Rating from '../../models/doctor/rating.model.js';
import Notification from '../../models/notification.model.js';
import ScheduleDetailSchema from '../../models/schedule_detail.model.js';
import AppError from '../../utils/error.util.js';
import BaseController from '../utils/base.controller.js';

const createRatingForDoctor = async (req, res, next) => {
    const { doctor_id } = req.params;
    const { rating, patient_id, content, schedule_id } = req.body;

    try {
        if (rating && patient_id && content && schedule_id) {
            const { doc, error } = await BaseController.createAndReturnObject(
                Rating
            )(req, res, next);

            if (doc) {
                const doctor = await Doctor.findById(doctor_id);

                if (doctor) {
                    doctor.ratings.push(doc._id);
                    await doctor.save();

                    const _rating = await Rating.findById(
                        doc._doc._id
                    ).populate('schedule_id');

                    const { schedule_id, patient_id, rating } = _rating;
                    let notification = null;

                    const patient = await Patient.findById(patient_id).populate(
                        'person'
                    );

                    if (schedule_id && patient) {
                        notification = new Notification({
                            to: schedule_id['doctor']._id,
                            from: schedule_id['patient']._id,
                            content: `Bệnh nhân ${patient.person.username} vừa đánh giá bác sĩ ${rating} sao`,
                            rule: RULE_SYSTEM,
                        });
                    }

                    return res.status(201).json({
                        status: STATUS_SUCCESS,
                        data: _rating,
                        notification,
                    });
                } else {
                    return next(
                        new AppError(
                            404,
                            STATUS_FAIL,
                            `Không tìm thấy bác sĩ với id = ${doctor_id}`
                        ),
                        req,
                        res,
                        next
                    );
                }
            }

            return next(error);
        }

        return next(
            new AppError(401, STATUS_FAIL, MESSAGE_NO_ENOUGH_IN_4),
            req,
            res,
            next
        );
    } catch (error) {
        return next(error);
    }
};

export default { createRatingForDoctor };
