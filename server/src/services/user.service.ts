import { prisma } from "../config/prisma.js";

/**
 * Creates a new user.
 * Expects validated data (email, password, name, surname).
 */
export const createUser = async (data: { email: string; password: string; name: string; surname: string }) => {
  return prisma.user.create({
    data,
  });
};

/**
 * Finds a user by email, but only active (not soft-deleted) users are returned.
 */
export const findUserByEmail = async (email: string) => {
  return prisma.user.findFirst({
    where: { email, deletedAt: null },
  });
};

/**
 * Soft delete user by setting deletedAt timestamp.
 */
export const softDeleteUser = async (userId: number) => {
  return prisma.user.updateMany({
    where: { id: userId, deletedAt: null },
    data: { deletedAt: new Date() },
  });
};
