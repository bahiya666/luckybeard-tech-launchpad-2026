import { Router } from "express";
import { todoController } from "../controllers/todo.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = Router();

// All routes are protected
router.use(protect);

// CRUD
router.post("/", todoController.create); // create
router.get("/", todoController.list); // list all for user
router.get("/:id", todoController.getOne); // get single
router.put("/:id", todoController.update); // update
router.delete("/:id", todoController.remove); // delete

export default router;
