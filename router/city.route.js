import { Router } from "express";
import * as cityController from "../controller/city.controller.js";

const router = Router();

router.get("/list", cityController.list);

export default router;
