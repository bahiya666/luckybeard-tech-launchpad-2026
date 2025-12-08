import { PrismaClient } from "@prisma/client";

declare global {
  // Prevent multiple instances in dev/test
  var prisma: PrismaClient | undefined;
}

// Use the test DB if NODE_ENV=test, otherwise main DB
export const prisma =
  global.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url:
          process.env.NODE_ENV === "test"
            ? process.env.DATABASE_URL_TEST
            : process.env.DATABASE_URL,
      },
    },
    log: ["query", "info", "warn", "error"],
  });

if (process.env.NODE_ENV !== "production") global.prisma = prisma;
