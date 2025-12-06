import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/auth.utils.js";
import { prisma } from "../config/prisma.js";

/**
 * Protect middleware
 * - verifies Authorization Bearer token
 * - validates user exists and is NOT soft-deleted
 * - attaches userId to req (and optionally user object)
 */
export const protect = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token) as { userId: number };

    if (!decoded || !decoded.userId) {
      return res.status(401).json({ message: "Invalid token" });
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

    if (!user || user.deletedAt) {
      // user either doesn't exist or has been soft-deleted
      return res.status(401).json({ message: "Unauthorized" });
    }

    (req as any).userId = decoded.userId;
    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    return res.status(401).json({ message: "Invalid token" });
  }
};
