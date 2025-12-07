// src/controllers/coach.controller.ts
import { Request, Response } from "express";
import { coachService } from "../services/coach.service.js";

export const coachController = {
  getAdvice: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const result = await coachService.getCoachingForUser(userId);

      res.json({
        message: "Productivity coach analysis successful",
        advice: result,
      });

    } catch (err: any) {
      console.error("Coach error:", err);
      res.status(500).json({
        message: "AI Coach error",
        error: err.message,
      });
    }
  },
};
