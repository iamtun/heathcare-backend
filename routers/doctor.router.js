import express from 'express';
import AuthController from '../controllers/auth.controller.js';
import DoctorController from '../controllers/doctor.controller.js';
import ProfileToDoctor from '../controllers/profile.controller.js';

const router = express.Router();

router
    .route('/')
    .get(DoctorController.getAllDoctors)
    .post(AuthController.authentication, DoctorController.createDoctor);

router.route('/get/:id').get(DoctorController.findDoctorById);

router
    .route('/update/:id')
    .post(AuthController.authentication, DoctorController.updateDoctorInfoById);

router
    .route('/profile')
    .post(AuthController.authentication, ProfileToDoctor.createProfileToDoctor);

router.route('/profile/:id').get(ProfileToDoctor.findDoctorProfileByDoctorId);

router
    .route('/waiting-accept')
    .get(DoctorController.getDoctorListWaitingAccept);

export default router;
