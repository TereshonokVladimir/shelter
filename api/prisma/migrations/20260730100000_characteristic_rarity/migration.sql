-- AlterTable
ALTER TABLE "characteristics" ADD COLUMN "rarity" TEXT NOT NULL DEFAULT 'common';

-- CreateIndex
CREATE INDEX "characteristics_package_id_rarity_idx" ON "characteristics"("package_id", "rarity");
