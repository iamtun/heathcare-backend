import express from 'express';
import AuthController from '../controllers/auth/auth.controller.js';

const router = express.Router();

router.route('/register').post(AuthController.register);
router.route('/login').post(AuthController.login);

export default router;
