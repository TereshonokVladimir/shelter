-- AlterTable
ALTER TABLE "rooms" ADD COLUMN "reveal_strategy" TEXT NOT NULL DEFAULT 'classic';
ALTER TABLE "rooms" ADD COLUMN "prep_duration_sec" INTEGER NOT NULL DEFAULT 60;
