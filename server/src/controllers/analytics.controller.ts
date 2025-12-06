import { Request, Response } from "express";
import { todoService } from "../services/todo.service.js";

export const analyticsController = {
  getAnalytics: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;

      const analytics = await todoService.getAnalyticsForUser(userId);

      res.json({
        message: "Todo analytics retrieved successfully",
        analytics
      });

    } catch (err: any) {
      console.error("Analytics error:", err);
      res.status(500).json({ message: "Server error", error: err.message });
    }
  }
};
