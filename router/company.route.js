import { Router } from "express";
import * as companyValidate from "../validates/company.validate.js";
import * as jobValidate from "../validates/job.validate.js";
import * as companyController from "../controller/company.controller.js";
import * as authMiddleware from "../middleware/auth.middleware.js";
import * as uploadMiddleware from "../middleware/upload.middleware.js";
import * as rateLimitMiddleware from "../middleware/rateLimit.middleware.js";
import { validateObjectId } from "../middleware/validateObjectId.middleware.js";

const router = Router();

router.post(
  "/register",
  rateLimitMiddleware.authLimiter,
  companyValidate.registerPost,
  companyController.registerPost
);

router.post(
  "/login",
  rateLimitMiddleware.authLimiter,
  companyValidate.loginPost,
  companyController.loginPost
);

router.patch(
  "/profile",
  authMiddleware.verifyTokenCompany,
  rateLimitMiddleware.uploadLimiter,
  uploadMiddleware.image_parser.single("logo"),
  companyController.profilePatch
);

router.post(
  "/job/create",
  authMiddleware.verifyTokenCompany,
  rateLimitMiddleware.uploadLimiter,
  uploadMiddleware.image_parser.array("images", 8),
  jobValidate.jobPost,
  companyController.jobCreate
);

router.get(
  "/job/list",
  authMiddleware.verifyTokenCompany,
  companyController.jobList
);

router.get(
  "/job/edit/:id",
  authMiddleware.verifyTokenCompany,
  validateObjectId(),
  companyController.editJob
);

router.patch(
  "/job/edit/:id",
  authMiddleware.verifyTokenCompany,
  validateObjectId(),
  rateLimitMiddleware.uploadLimiter,
  uploadMiddleware.image_parser.array("images", 8),
  jobValidate.jobPost,
  companyController.editJobPatch
);

router.delete(
  "/job/delete/:id",
  authMiddleware.verifyTokenCompany,
  validateObjectId(),
  companyController.deleteJobDel
);

router.get("/list", companyController.list);

router.get("/detail/:id", validateObjectId(), companyController.detail);

router.get(
  "/cv/list",
  authMiddleware.verifyTokenCompany,
  companyController.listCV
);

router.get(
  "/cv/detail/:id",
  authMiddleware.verifyTokenCompany,
  validateObjectId(),
  companyController.detailCV
);

router.patch(
  "/cv/change-status",
  authMiddleware.verifyTokenCompany,
  companyController.changeStatusCVPatch
);

router.delete(
  "/cv/delete/:id",
  authMiddleware.verifyTokenCompany,
  validateObjectId(),
  companyController.deleteCVDel
);

export default router;
