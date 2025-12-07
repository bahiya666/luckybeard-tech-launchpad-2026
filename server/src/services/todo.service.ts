import { prisma } from "../config/prisma.js";
import type { TodoStatus } from "@prisma/client";

export const todoService = {
  createTodo: async (data: {
    title: string;
    description?: string;
    status?: TodoStatus;
    priority?: string;
    estimatedTimeMinutes?: number;
    subtasks?: any;
    userId: number;
  }) => {
    return prisma.todo.create({
      data: {
        title: data.title,
        description: data.description,
        status: data.status || "PENDING",
        priority: data.priority || null,
        estimatedTimeMinutes: data.estimatedTimeMinutes || null,
        subtasks: data.subtasks || null,
        userId: data.userId,
      },
    });
  },

  // list todos for a user
  listTodosForUser: async (userId: number) => {
    return prisma.todo.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  },

  // find a todo by id but only if it belongs to user
  findTodoByIdForUser: async (todoId: number, userId: number) => {
    if (!todoId || isNaN(todoId)) return null;

    return prisma.todo.findFirst({
        where: { id: todoId, userId },
    });
    },


  // update a todo for a user
  updateTodoForUser: async (
    todoId: number,
    userId: number,
    updates: { title?: string; description?: string; status?: TodoStatus | string }
  ) => {
    // ensure ownership
    const todo = await prisma.todo.findFirst({ where: { id: todoId, userId } });
    if (!todo) return null;

    const data: any = {};
    if (updates.title !== undefined) data.title = updates.title;
    if (updates.description !== undefined) data.description = updates.description;
    if (updates.status !== undefined) data.status = updates.status;

    return prisma.todo.update({
      where: { id: todoId },
      data,
    });
  },

  // delete a todo for a user (hard delete)
  deleteTodoForUser: async (todoId: number, userId: number) => {
    // ensure ownership
    const todo = await prisma.todo.findFirst({ where: { id: todoId, userId } });
    if (!todo) return null;

    await prisma.todo.delete({ where: { id: todoId } });
    return true;
  },

    bulkCreateTodos: async (userId: number, todos: { title: string; description?: string; status?: any }[]) => {
    // Map todos and sanitize incoming data
    const data = todos.map(t => ({
      title: t.title,
      description: t.description || null,
      status: t.status || "PENDING",
      userId
    }));

    return prisma.todo.createMany({
      data,
      skipDuplicates: true,
    });
  },

    getAnalyticsForUser: async (userId: number) => {
    const pending = await prisma.todo.count({
      where: { userId, status: "PENDING" },
    });

    const inProgress = await prisma.todo.count({
      where: { userId, status: "IN_PROGRESS" },
    });

    const done = await prisma.todo.count({
      where: { userId, status: "DONE" },
    });

    const deleted = await prisma.todo.count({
      where: { userId, status: "DELETED" },
    });

    // Optional: Completed per day (last 7 days)
    const rawTimeline = await prisma.$queryRawUnsafe(`
      SELECT 
        DATE("updatedAt") as day,
        COUNT(*) as completed
      FROM "Todo"
      WHERE "userId" = ${userId}
      AND status = 'DONE'
      GROUP BY DATE("updatedAt")
      ORDER BY day DESC
      LIMIT 7;
    `);

    // $queryRawUnsafe may return BigInt for numeric aggregates; convert to plain JS types
    const timeline = (rawTimeline as any[]).map((row: any) => ({
      day: row.day instanceof Date ? row.day.toISOString().split("T")[0] : String(row.day),
      completed: typeof row.completed === "bigint" ? Number(row.completed) : Number(row.completed)
    }));

    return {
      totals: {
        pending,
        inProgress,
        done,
        deleted
      },
      timeline
    };
  }
  
};
