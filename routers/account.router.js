import express from 'express';
import AccountController from '../controllers/account.controller.js';

const router = express.Router();

router
    .route('/')
    .get(AccountController.getAllAccount)
    .delete(AccountController.removeAccount);

router.route('/:id').get(AccountController.getAccount);

export default router;
