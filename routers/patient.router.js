import express from 'express';
import AuthController from '../controllers/auth/auth.controller.js';
import PatientController from '../controllers/patient/patient.controller.js';
import UploadCloud from '../configs/cloudinary.config.js';
import RatingController from '../controllers/patient/rating.controller.js';
import ScheduleDetailController from '../controllers/patient/schedule_detail.controller.js';
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
    .route('/admin')
    .get(AuthController.authentication, PatientController.getAllPatient);

router
    .route('/:id/histories')
    .get(ScheduleDetailController.getAllExamHistoriesById);

router
    .route('/:id')
    .get(PatientController.findPatientById)
    .put(
        AuthController.authentication,
        UploadCloud.uploadCloud.single('avatar'),
        PatientController.updatePatientInfoById
    );
router.route('/rating/:doctor_id').post(RatingController.createRatingForDoctor);
export default router;
