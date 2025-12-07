// src/controllers/ai.controller.ts
import { Request, Response } from "express";
import { aiService } from "../services/ai.service.js";
import { todoService } from "../services/todo.service.js";
import type { TodoStatus } from "@prisma/client";

export const aiController = {
  generateTodo: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId as number;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const { prompt } = req.body;
      if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
        return res.status(400).json({ message: "Prompt is required" });
      }

      // Call AI to generate a todo
      const gen = await aiService.generateTodoFromPrompt(userId, prompt);

      // Map AI string status to Prisma enum safely
      const statusMap: Record<string, TodoStatus> = {
        PENDING: "PENDING",
        IN_PROGRESS: "IN_PROGRESS",
        DONE: "DONE",
        DELETED: "DELETED",
      };
      const status = statusMap[gen.status] || "PENDING";

      // Create the todo in DB with all AI-generated fields
      const todo = await todoService.createTodo({
        title: gen.title,
        description: gen.description || undefined,
        status,
        priority: gen.priority,
        estimatedTimeMinutes: gen.estimatedTimeMinutes,
        subtasks: gen.subtasks,
        userId,
      });

      res.status(201).json({
        message: "Todo generated and created successfully",
        todo,
        ai: { suggestedStatus: gen.status },
      });
    } catch (err: any) {
      console.error("AI generate error:", err);
      res.status(500).json({ message: "Server error", error: err.message || err });
    }
  },
};
