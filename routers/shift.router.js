import express from 'express';
import AuthController from '../controllers/auth/auth.controller.js';
import ShiftController from '../controllers/admin/shift.controller.js';

const router = express.Router();

router
    .route('/')
    .get(ShiftController.getAllShifts)
    .post(AuthController.authentication, ShiftController.createShift);

router
    .route('/:id')
    .get(ShiftController.getShiftById)
    .put(AuthController.authentication, ShiftController.updateShift);
export default router;
