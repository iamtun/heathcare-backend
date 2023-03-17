import express from 'express';
import AuthController from '../controllers/auth/auth.controller.js';
import BloodPressureController from '../controllers/patient/blood_pressure.controller.js';

const router = express.Router();

router
    .route('/')
    .post(
        AuthController.authentication,
        BloodPressureController.createBloodPressureMetric
    )
    .get(BloodPressureController.getAll);

router
    .route('/:id')
    .get(BloodPressureController.getAllBloodPressuresByPatientId);

export default router;
