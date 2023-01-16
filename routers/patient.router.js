import express from 'express';
import AuthController from '../controllers/auth.controller.js';
import PatientController from '../controllers/patient.controller.js';

const router = express.Router();

router
    .route('/')
    .post(AuthController.authentication, PatientController.createPatient);

router.route('/:id').get(PatientController.findPatientById);

export default router;
