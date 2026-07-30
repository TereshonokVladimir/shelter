-- CreateTable
CREATE TABLE "content_packages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "rating" TEXT NOT NULL DEFAULT 'everyone',
    "topic" TEXT NOT NULL DEFAULT 'classic',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_builtin" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

CREATE UNIQUE INDEX "content_packages_slug_key" ON "content_packages"("slug");
CREATE INDEX "content_packages_is_active_sort_order_idx" ON "content_packages"("is_active", "sort_order");

INSERT INTO "content_packages" ("id", "slug", "title", "description", "rating", "topic", "is_active", "is_builtin", "sort_order", "created_at", "updated_at")
VALUES ('pkg_classic_default', 'classic', 'Классика', 'Базовый набор катастроф и характеристик', 'everyone', 'classic', 1, 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Add package_id columns (SQLite allows ADD COLUMN)
ALTER TABLE "disasters" ADD COLUMN "package_id" TEXT NOT NULL DEFAULT 'pkg_classic_default';
ALTER TABLE "bunkers" ADD COLUMN "package_id" TEXT NOT NULL DEFAULT 'pkg_classic_default';
ALTER TABLE "characteristics" ADD COLUMN "package_id" TEXT NOT NULL DEFAULT 'pkg_classic_default';
ALTER TABLE "rooms" ADD COLUMN "package_id" TEXT;

UPDATE "disasters" SET "package_id" = 'pkg_classic_default' WHERE "package_id" IS NULL OR "package_id" = '';
UPDATE "bunkers" SET "package_id" = 'pkg_classic_default' WHERE "package_id" IS NULL OR "package_id" = '';
UPDATE "characteristics" SET "package_id" = 'pkg_classic_default' WHERE "package_id" IS NULL OR "package_id" = '';
UPDATE "rooms" SET "package_id" = 'pkg_classic_default' WHERE "package_id" IS NULL;

CREATE INDEX "disasters_package_id_is_active_idx" ON "disasters"("package_id", "is_active");
CREATE INDEX "bunkers_package_id_is_active_idx" ON "bunkers"("package_id", "is_active");
CREATE INDEX "characteristics_package_id_category_is_active_idx" ON "characteristics"("package_id", "category", "is_active");
