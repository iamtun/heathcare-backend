import express from 'express';
import AuthController from '../controllers/auth/auth.controller.js';
import PatientController from '../controllers/patient/patient.controller.js';
import UploadCloud from '../configs/cloudinary.config.js';

const router = express.Router();

router
    .route('/')
    .post(
        AuthController.authentication,
        UploadCloud.uploadCloud.single('avatar'),
        PatientController.createPatient
    )
    .get(AuthController.authentication, PatientController.findPatientByToken);

router
    .route('/:id')
    .get(PatientController.findPatientById)
    .put(
        AuthController.authentication,
        UploadCloud.uploadCloud.single('avatar'),
        PatientController.updatePatientInfoById
    );
export default router;
