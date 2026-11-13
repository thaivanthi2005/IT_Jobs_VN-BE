import { Router } from "express";
import * as jobController from "../controller/job.controller.js";
import * as jobValidate from "../validates/job.validate.js";
import * as uploadMiddleware from "../middleware/upload.middleware.js";
import * as rateLimitMiddleware from "../middleware/rateLimit.middleware.js";
import { validateObjectId } from "../middleware/validateObjectId.middleware.js";

const router = Router();

router.get("/detail/:id", validateObjectId(), jobController.detail);

router.post(
  "/apply",
  rateLimitMiddleware.uploadLimiter,
  uploadMiddleware.cv_parser.single("fileCV"),
  jobValidate.applyPost,
  jobController.applyPost
);

export default router;
