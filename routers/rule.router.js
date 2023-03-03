import express from 'express';
import RuleController from '../controllers/admin/rule.controller.js';
import AuthController from '../controllers/auth/auth.controller.js';

const router = express.Router();

router
    .route('/')
    .post(AuthController.authentication, RuleController.createRule)
    .get(RuleController.getAllRules);

router
    .route('/:id')
    .get(RuleController.findRuleById)
    .put(AuthController.authentication, RuleController.updateRule);

router.route(
    '/doctor/:id',
    AuthController.authentication,
    RuleController.censorship
);
export default router;
