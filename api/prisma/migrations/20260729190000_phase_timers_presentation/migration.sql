-- AlterTable
ALTER TABLE "rooms" ADD COLUMN "presentation_duration_sec" INTEGER NOT NULL DEFAULT 60;
ALTER TABLE "rooms" ADD COLUMN "voting_duration_sec" INTEGER NOT NULL DEFAULT 60;
ALTER TABLE "rooms" ADD COLUMN "reveal_duration_sec" INTEGER NOT NULL DEFAULT 90;
ALTER TABLE "rooms" ADD COLUMN "presentation_player_id" TEXT;
ALTER TABLE "rooms" ADD COLUMN "presentation_order_json" TEXT NOT NULL DEFAULT '[]';
ALTER TABLE "rooms" ADD COLUMN "paused_at" DATETIME;
ALTER TABLE "rooms" ADD COLUMN "pause_remaining_ms" INTEGER;
