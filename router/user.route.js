import { Router } from "express";
import * as userController from "../controller/user.controller.js";
import * as userValidate from "../validates/user.validate.js";
import * as authMiddleware from "../middleware/auth.middleware.js";
import * as uploadMiddleware from "../middleware/upload.middleware.js";
import * as rateLimitMiddleware from "../middleware/rateLimit.middleware.js";

const router = Router();

router.post(
  "/register",
  rateLimitMiddleware.authLimiter,
  userValidate.registerPost,
  userController.registerPost
);

router.post(
  "/login",
  rateLimitMiddleware.authLimiter,
  userValidate.loginPost,
  userController.loginPost
);

router.patch(
  "/profile",
  authMiddleware.verifyTokenUser,
  rateLimitMiddleware.uploadLimiter,
  uploadMiddleware.image_parser.single("avatar"),
  userController.Profile
);

router.get(
  "/cv/list",
  authMiddleware.verifyTokenUser,
  userController.listCV
);

export default router;
