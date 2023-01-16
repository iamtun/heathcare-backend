import express from "express";
import AccountController from "../controllers/account.controller.js";

const router = express.Router();

router
    .route("/")
    .get(AccountController.getAllAccount)

router.route("/:id").get(AccountController.getAccount);

export default router;