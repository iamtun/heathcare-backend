import express from 'express';
import AuthController from '../controllers/auth.controller.js';
import Day from '../controllers/day.controller.js';
const router = express.Router();

router.route('/').post(AuthController.authentication, Day.createDay);

export default router;
