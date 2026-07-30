-- DropTable column: skip first voting is host next-round from presentation, not a room flag
ALTER TABLE "rooms" DROP COLUMN "skip_first_voting";
