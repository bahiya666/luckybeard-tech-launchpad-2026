import { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { hashPassword, comparePassword, generateToken } from "../utils/auth.utils.js";
import { createUser, findUserByEmail, softDeleteUser } from "../services/user.service.js";

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name, surname } = req.body;

    if (!email || !password || !name || !surname) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Check if user exists (only active users)
    const existingUser = await findUserByEmail(email);
    if (existingUser) return res.status(400).json({ message: "Email already in use" });

    const hashedPassword = await hashPassword(password);

    const user = await createUser({
      email,
      password: hashedPassword,
      name,
      surname,
    });

    const token = generateToken(user.id);

    res.status(201).json({ user: { id: user.id, email: user.email, name: user.name, surname: user.surname }, token });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error", error: (err as any).message || err });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) return res.status(400).json({ message: "Missing credentials" });

    const user = await prisma.user.findUnique({ where: { email } });

    // If user doesn't exist or is soft deleted
    if (!user || user.deletedAt) return res.status(400).json({ message: "Invalid credentials" });

    const isValid = await comparePassword(password, user.password);
    if (!isValid) return res.status(400).json({ message: "Invalid credentials" });

    const token = generateToken(user.id);

    res.json({ user: { id: user.id, email: user.email, name: user.name, surname: user.surname }, token });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error", error: (err as any).message || err });
  }
};

// Delete current user's account (soft delete)
export const deleteAccount = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId as number;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    // Soft delete: set deletedAt
    await softDeleteUser(userId);

    // Optionally: you could also rotate/invalidate tokens, but for this assessment we return 204
    res.status(204).send();
  } catch (err) {
    console.error("Delete account error:", err);
    res.status(500).json({ message: "Server error", error: (err as any).message || err });
  }
};

// Get profile of current user
export const me = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId as number;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, surname: true, createdAt: true, updatedAt: true },
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ user });
  } catch (err) {
    console.error("Me error:", err);
    res.status(500).json({ message: "Server error", error: (err as any).message || err });
  }
};
