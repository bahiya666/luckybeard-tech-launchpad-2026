import { Router } from "express";
import { healthController } from "../controllers/health.controller.js";

import authRoutes from "./auth.routes.js";
import todosRoutes from "../routes/todo.routes.ts";

const router = Router();

router.get("/health", healthController.status);
router.use("/auth", authRoutes);
router.use("/todos", todosRoutes);

export default router;
