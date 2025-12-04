import { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { hashPassword, comparePassword, generateToken } from "../utils/auth.utils.js";

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name, surname } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ message: "Email already in use" });

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name, surname },
    });

    const token = generateToken(user.id);

    res.status(201).json({ user: { id: user.id, email: user.email, name: user.name }, token });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isValid = await comparePassword(password, user.password);
    if (!isValid) return res.status(400).json({ message: "Invalid credentials" });

    const token = generateToken(user.id);

    res.json({ user: { id: user.id, email: user.email, name: user.name }, token });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};
