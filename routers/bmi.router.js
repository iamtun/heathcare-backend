import express from 'express';
import AuthController from '../controllers/auth/auth.controller.js';
import BMIController from '../controllers/patient/bmi.controller.js';

const router = express.Router();

router.route('/').post(AuthController.authentication, BMIController.createBMI);

router.route('/:id').get(BMIController.getAllBMIOfPatientById);

export default router;
