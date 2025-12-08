import express from "express";
import cors from "cors";
import { errorHandler } from "./middlewares/error.middleware.js";

const app = express();

app.use(cors());
app.use(express.json());

// Import routes directly
import authRoutes from "./routes/auth.routes.js";
import todoRoutes from "./routes/todo.routes.js";
import { healthController } from "./controllers/health.controller.js";

// Health check route (place it before other routes)
app.get("/api/health", healthController.status);

// Other routes
app.use("/api/auth", authRoutes);
app.use("/api/todos", todoRoutes);

// Error handler (last)
app.use(errorHandler);

export default app;