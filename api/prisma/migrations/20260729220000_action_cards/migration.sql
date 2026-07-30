-- CreateTable
CREATE TABLE "action_cards" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "package_id" TEXT NOT NULL,
    "effect_type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "action_cards_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "content_packages" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "player_action_cards" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "room_id" TEXT NOT NULL,
    "player_id" TEXT NOT NULL,
    "action_card_id" TEXT NOT NULL,
    "is_used" BOOLEAN NOT NULL DEFAULT false,
    "used_at" DATETIME,
    "used_round" INTEGER,
    CONSTRAINT "player_action_cards_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "player_action_cards_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "player_action_cards_action_card_id_fkey" FOREIGN KEY ("action_card_id") REFERENCES "action_cards" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "action_cards_package_id_is_active_idx" ON "action_cards"("package_id", "is_active");

-- CreateIndex
CREATE INDEX "player_action_cards_room_id_player_id_idx" ON "player_action_cards"("room_id", "player_id");
