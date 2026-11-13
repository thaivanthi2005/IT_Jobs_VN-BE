import { Router } from "express";
import * as authController from "../controller/auth.controller.js";

const router = Router();

router.get("/check", authController.check);
router.get("/logout", authController.logout);

export default router;
