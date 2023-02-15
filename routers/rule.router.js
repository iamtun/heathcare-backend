import express from 'express';
import RuleController from '../controllers/admin/rule.controller.js';
import AuthController from '../controllers/auth/auth.controller.js';

const router = express.Router();

router
    .route('/')
    .post(AuthController.authentication, RuleController.createRule);

export default router;
