import { Request, Response } from "express";
import { todoService } from "../services/todo.service.js";
import { parse } from "csv-parse/sync";

export const uploadController = {
  uploadTodos: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId as number;
      const file = (req as any).file;
      if (!file) return res.status(400).json({ message: "No file uploaded" });

      const fileBuffer = file.buffer;
      const mimetype = file.mimetype;

      let todos: any[] = [];

      // JSON handling
      if (mimetype === "application/json") {
        todos = JSON.parse(fileBuffer.toString());
      }

      // CSV handling
      else if (
        mimetype === "text/csv" ||
        mimetype === "application/vnd.ms-excel"
      ) {
        const csv = fileBuffer.toString();
        todos = parse(csv, {
          columns: true,
          skip_empty_lines: true,
        });
      }

      else {
        return res.status(400).json({ message: "Unsupported file type. Upload JSON or CSV." });
      }

      if (!Array.isArray(todos) || todos.length === 0) {
        return res.status(400).json({ message: "Invalid or empty data" });
      }

      // Required field check
      const hasTitle = todos.every((t: any) => t.title);
      if (!hasTitle) return res.status(400).json({ message: "Each todo must have a title" });

      // Insert into DB
      const result = await todoService.bulkCreateTodos(userId as number, todos);

      res.status(201).json({
        message: "Todos uploaded successfully",
        inserted: result.count
      });

    } catch (err: any) {
      console.error("Upload error:", err);
      res.status(500).json({ message: "Server error", error: err.message });
    }
  }
};
