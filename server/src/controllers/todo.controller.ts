import { Request, Response } from "express";
import { todoService } from "../services/todo.service.ts";

export const todoController = {
  // Create a todo
  create: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId as number;
      const { title, description } = req.body;

      if (!title) return res.status(400).json({ message: "Title is required" });

      const todo = await todoService.createTodo({
        title,
        description,
        userId,
      });

      res.status(201).json({ todo });
    } catch (err) {
      console.error("Create todo error:", err);
      res.status(500).json({ message: "Server error", error: (err as any).message || err });
    }
  },

  // List todos for current user
  list: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId as number;
      const todos = await todoService.listTodosForUser(userId);
      res.json({ todos });
    } catch (err) {
      console.error("List todos error:", err);
      res.status(500).json({ message: "Server error", error: (err as any).message || err });
    }
  },

  // Get single todo (ensures ownership)
  getOne: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId as number;
      const todoId = Number(req.params.id);

      const todo = await todoService.findTodoByIdForUser(todoId, userId);
      if (!todo) return res.status(404).json({ message: "Todo not found" });

      res.json({ todo });
    } catch (err) {
      console.error("Get todo error:", err);
      res.status(500).json({ message: "Server error", error: (err as any).message || err });
    }
  },

  // Update todo (only allowed fields)
  update: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId as number;
      const todoId = Number(req.params.id);
      const { title, description, status } = req.body;

      const updated = await todoService.updateTodoForUser(todoId, userId, { title, description, status });
      if (!updated) return res.status(404).json({ message: "Todo not found" });

      res.json({ todo: updated });
    } catch (err) {
      console.error("Update todo error:", err);
      res.status(500).json({ message: "Server error", error: (err as any).message || err });
    }
  },

  // Delete todo (hard delete or soft? Requirement says delete — we'll hard-delete the todo record)
  remove: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId as number;
      const todoId = Number(req.params.id);

      const deleted = await todoService.deleteTodoForUser(todoId, userId);
      if (!deleted) return res.status(404).json({ message: "Todo not found" });

      res.status(204).send();
    } catch (err) {
      console.error("Delete todo error:", err);
      res.status(500).json({ message: "Server error", error: (err as any).message || err });
    }
  },
};
