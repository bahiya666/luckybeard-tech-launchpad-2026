import { Router } from "express";
import { todoController } from "../controllers/todo.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/upload.middleware.js";
import { uploadController } from "../controllers/upload.controller.js";
import { analyticsController } from "../controllers/analytics.controller.js";
import { aiController } from "../controllers/ai.controller.js"; 
import { coachController } from "../controllers/coach.controller.js";

const router = Router();

// All routes are protected
router.use(protect);

router.post("/", todoController.create); // create
router.get("/", todoController.list); // list all for user

// Non-parameter routes first (prevent :id from capturing them)
router.get("/analytics", analyticsController.getAnalytics);
router.post("/upload", upload.single("file"), uploadController.uploadTodos);
router.post("/generate", aiController.generateTodo);
router.get("/coach", coachController.getAdvice);

// Parameterized routes
router.get("/:id", todoController.getOne); // get single
router.put("/:id", todoController.update); // update
router.delete("/:id", todoController.remove); // delete

export default router;
