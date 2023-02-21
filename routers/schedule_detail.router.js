import express from 'express';
import AuthController from '../controllers/auth/auth.controller.js';
import ScheduleDetailController from '../controllers/patient/schedule_detail.controller.js';

const router = express.Router();

router
    .route('/')
    .post(
        AuthController.authentication,
        ScheduleDetailController.createScheduleDetail
    )
    .get(ScheduleDetailController.getAll);

router
    .route('/doctor/patient-list/:id')
    .get(ScheduleDetailController.getAllPatientExamByIdDoctor);

router
    .route('/doctor/schedule-list/:id')
    .get(ScheduleDetailController.getAllScheduleListOfDoctor);

router
    .route('/patient/:id')
    .get(ScheduleDetailController.getAllScheduleDetailByPatientId);

router
    .route('/:id')
    .put(
        AuthController.authentication,
        ScheduleDetailController.updateResultExam
    )
    .get(ScheduleDetailController.findById);

export default router;
