// __tests__/setup.ts
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

// Load the main .env file
dotenv.config();

// Use test database URL if running in test mode
const DATABASE_URL =
  process.env.NODE_ENV === "test"
    ? process.env.DATABASE_URL_TEST
    : process.env.DATABASE_URL;

if (!DATABASE_URL) throw new Error("DATABASE_URL is not set");

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL,
    },
  },
});

// Connect to the database before all tests
beforeAll(async () => {
  try {
    await prisma.$connect();
    console.log("✓ Test database connected");
  } catch (err) {
    console.error("❌ Could not connect to database", err);
    process.exit(1);
  }

  // Optional: clear tables before tests
  await prisma.todo.deleteMany();
  await prisma.user.deleteMany();
});

// Clean up after each test
afterEach(async () => {
  await prisma.todo.deleteMany();
  await prisma.user.deleteMany();
});

// Disconnect after all tests
afterAll(async () => {
  await prisma.$disconnect();
});

// Export prisma for test files
export { prisma };
