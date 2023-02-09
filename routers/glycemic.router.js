import express from 'express';
import AuthController from '../controllers/auth/auth.controller.js';
import GlycemicController from '../controllers/patient/glycemic.controller.js';

const router = express.Router();

router
    .route('/')
    .post(AuthController.authentication, GlycemicController.createGlycemic);

router.route('/:id').get(GlycemicController.getAllGlycemicByPatientId);

export default router;
