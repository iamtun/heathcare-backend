import express from 'express';
import ShiftController from '../controllers/shift.controller.js';

const router = express.Router();

router.route('/').post(ShiftController.createShift);

export default router;
