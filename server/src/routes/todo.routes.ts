import { Router } from "express";
import { todoController } from "../controllers/todo.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/upload.middleware.js";
import { uploadController } from "../controllers/upload.controller.js";

const router = Router();

// All routes are protected
router.use(protect);

// CRUD
router.post("/", todoController.create); // create
router.get("/", todoController.list); // list all for user
router.get("/:id", todoController.getOne); // get single
router.put("/:id", todoController.update); // update
router.delete("/:id", todoController.remove); // delete
router.post("/upload", upload.single("file"), uploadController.uploadTodos);

export default router;
