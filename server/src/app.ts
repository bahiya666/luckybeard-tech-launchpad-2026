import express from "express";
import cors from "cors";
import routes from "./routes/index.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import authRoutes from "./routes/auth.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

// All routes
app.use("/api", routes);
app.use("/api/auth", authRoutes);

// Error handler (last)
app.use(errorHandler);

export default app;
