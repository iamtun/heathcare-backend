import express from 'express';
import AuthController from '../controllers/auth/auth.controller.js';
import ScheduleDetailController from '../controllers/patient/schedule_detail.controller.js';

const router = express.Router();

router
    .route('/')
    .post(
        AuthController.authentication,
        ScheduleDetailController.createScheduleDetail
    );

router
    .route('/:id')
    .put(
        AuthController.authentication,
        ScheduleDetailController.updateResultExam
    );

export default router;
