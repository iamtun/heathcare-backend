import express from 'express';
import RuleController from '../controllers/admin/rule.controller.js';
import AuthController from '../controllers/auth/auth.controller.js';

const router = express.Router();

router
    .route('/')
    .post(AuthController.authentication, RuleController.createRule)
    .get(RuleController.getAllRules);

router
    .route('/doctor/:id')
    .put(AuthController.authentication, RuleController.censorship);

router
    .route('/:id')
    .get(RuleController.findRuleById)
    .put(AuthController.authentication, RuleController.updateRule);

export default router;
