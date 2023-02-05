import express from 'express';
import AuthController from '../controllers/auth/auth.controller.js';
import ScheduleController from '../controllers/doctor/schedule.controller.js';
const router = express.Router();

router
    .route('/')
    .post(AuthController.authentication, ScheduleController.createSchedule)
    .get(ScheduleController.getAllSchedule);

router
    .route('/doctor/:doctorId')
    .get(ScheduleController.getAllScheduleByDoctorId);
router
    .route('/:id')
    .get(ScheduleController.findScheduleById)
    .put(AuthController.authentication, ScheduleController.updateScheduleById)
    .delete(
        AuthController.authentication,
        ScheduleController.deleteScheduleById
    );
export default router;
