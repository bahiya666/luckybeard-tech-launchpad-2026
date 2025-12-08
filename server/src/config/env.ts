// src/config/env.ts
import dotenv from "dotenv";
import path from "path";

// Determine which .env file to load
let envFile = '.env'; // default
if (process.env.NODE_ENV === 'test') {
  envFile = '.env.test';
}

dotenv.config({ path: path.resolve(process.cwd(), envFile) });

export const env = {
  PORT: process.env.PORT,
  DATABASE_URL: process.env.DATABASE_URL,
  HF_API_KEY: process.env.HF_API_KEY,
  JWT_SECRET: process.env.JWT_SECRET,
};
