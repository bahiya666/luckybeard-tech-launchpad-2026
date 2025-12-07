-- AlterTable
ALTER TABLE "Todo" ADD COLUMN     "estimatedTimeMinutes" INTEGER,
ADD COLUMN     "priority" TEXT,
ADD COLUMN     "subtasks" JSONB;
