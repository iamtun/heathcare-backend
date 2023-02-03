import express from 'express';
import AuthController from '../controllers/auth.controller.js';
import ScheduleController from '../controllers/doctor/schedule.controller.js';
const router = express.Router();

router
    .route('/')
    .post(AuthController.authentication, ScheduleController.createSchedule);

export default router;
