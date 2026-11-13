import { Router } from "express";
import userRoutes from "./user.route.js";
import authRoutes from "./auth.route.js";
import companyRoutes from "./company.route.js";
import cityRoutes from "./city.route.js";
import searchRoutes from "./search.route.js";
import jobRoutes from "./job.route.js";

const router = Router();

router.use("/user", userRoutes);
router.use("/auth", authRoutes);
router.use("/company", companyRoutes);
router.use("/city", cityRoutes);
router.use("/search", searchRoutes);
router.use("/job", jobRoutes);

export default router;
