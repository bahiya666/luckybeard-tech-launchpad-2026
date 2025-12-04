import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || "defaultsecret";

// Hash password
export const hashPassword = async (password: string) => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

// Compare password
export const comparePassword = async (password: string, hash: string) => {
  return bcrypt.compare(password, hash);
};

// Generate JWT
export const generateToken = (userId: number) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
};

// Verify JWT
export const verifyToken = (token: string) => {
  return jwt.verify(token, JWT_SECRET) as { userId: number };
};
