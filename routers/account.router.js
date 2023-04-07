import express from 'express';
import AccountController from '../controllers/auth/account.controller.js';

const router = express.Router();

router
    .route('/')
    .get(AccountController.getAllAccount)
    .delete(AccountController.removeAccount);

router.route('/phone/:phone').get(AccountController.getAccountByPhoneNumber);
router.route('/:id').get(AccountController.getAccount);

export default router;
