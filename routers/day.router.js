import express from 'express';
import AuthController from '../controllers/auth/auth.controller.js';
import Day from '../controllers/admin/day.controller.js';
const router = express.Router();

router
    .route('/')
    .post(AuthController.authentication, Day.createDay)
    .get(Day.getAllDay);

export default router;
