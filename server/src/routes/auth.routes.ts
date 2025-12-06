import { Router } from "express";
import { register, login, deleteAccount, me } from "../controllers/auth.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);

// protected routes
router.get("/me", protect, me);
router.delete("/me", protect, deleteAccount);

export default router;
