import { prisma } from "../config/prisma.js";
import type { TodoStatus } from "@prisma/client";

export const todoService = {
  // create a todo associated with a user
  createTodo: async (data: { title: string; description?: string; userId: number }) => {
    return prisma.todo.create({
      data: {
        title: data.title,
        description: data.description,
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
};
