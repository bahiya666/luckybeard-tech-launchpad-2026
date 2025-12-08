// src/config/env.ts
import dotenv from "dotenv";
dotenv.config();

export const env = {
  PORT: process.env.PORT,
  DATABASE_URL: process.env.DATABASE_URL,
  HF_API_KEY: process.env.HF_API_KEY, 
  JWT_SECRET: process.env.JWT_SECRET,
};
