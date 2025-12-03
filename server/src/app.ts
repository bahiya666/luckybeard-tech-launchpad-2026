import express from "express";
import cors from "cors";
import routes from "./routes/index.js";
import { errorHandler } from "./middlewares/error.middleware.js";

const app = express();

app.use(cors());
app.use(express.json());

// All routes
app.use("/api", routes);

// Error handler (last)
app.use(errorHandler);

export default app;
