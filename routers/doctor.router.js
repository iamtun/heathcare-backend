import express from 'express';
import AuthController from '../controllers/auth/auth.controller.js';
import DoctorController from '../controllers/doctor/doctor.controller.js';
import ProfileToDoctor from '../controllers/utils/profile.controller.js';
import UploadCloud from '../configs/cloudinary.config.js';
const router = express.Router();

router
    .route('/')
    .get(DoctorController.getAllDoctors)
    .post(
        AuthController.authentication,
        UploadCloud.uploadCloud.single('avatar'),
        DoctorController.createDoctor
    );

router
    .route('/waiting-accept')
    .get(DoctorController.getDoctorListWaitingAccept);

router
    .route('/profile')
    .post(AuthController.authentication, ProfileToDoctor.createProfileToDoctor)
    .get(
        AuthController.authentication,
        ProfileToDoctor.findDoctorProfileByAccountId
    );

router.route('/profile/:id').get(ProfileToDoctor.findDoctorProfileById);

router
    .route('/:id')
    .get(DoctorController.findDoctorById)
    .put(
        AuthController.authentication,
        UploadCloud.uploadCloud.single('avatar'),
        DoctorController.updateDoctorInfoById
    );

export default router;
