import { Request, Response } from "express";
import { healthService } from "../services/health.service.js";

export const healthController = {
  status: async (req: Request, res: Response) => {
    const status = await healthService.getStatus();
    res.json(status);
  },
};
