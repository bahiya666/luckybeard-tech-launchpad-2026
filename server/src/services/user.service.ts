import { prisma } from "../config/prisma.js";

export const createUser = async (data: any) => {
  return prisma.user.create({ data });
};

export const findUserByEmail = async (email: string) => {
  return prisma.user.findUnique({ where: { email } });
};
