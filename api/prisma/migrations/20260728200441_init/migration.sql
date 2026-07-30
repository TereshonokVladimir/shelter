-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "disasters" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "bunkers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "characteristics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "rooms" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "host_player_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'lobby',
    "current_round" INTEGER NOT NULL DEFAULT 0,
    "max_players" INTEGER NOT NULL,
    "shelter_capacity" INTEGER,
    "disaster_id" TEXT,
    "bunker_id" TEXT,
    "discussion_duration_sec" INTEGER NOT NULL DEFAULT 120,
    "phase_ends_at" DATETIME,
    "voting_candidate_ids_json" TEXT NOT NULL DEFAULT '[]',
    "last_vote_summary_json" TEXT NOT NULL DEFAULT '{}',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "rooms_disaster_id_fkey" FOREIGN KEY ("disaster_id") REFERENCES "disasters" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "rooms_bunker_id_fkey" FOREIGN KEY ("bunker_id") REFERENCES "bunkers" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "players" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "room_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "joined_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" DATETIME,
    "eliminated_at" DATETIME,
    CONSTRAINT "players_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "players_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "player_characteristics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "room_id" TEXT NOT NULL,
    "player_id" TEXT NOT NULL,
    "characteristic_id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "is_revealed" BOOLEAN NOT NULL DEFAULT false,
    "revealed_round" INTEGER,
    "revealed_at" DATETIME,
    CONSTRAINT "player_characteristics_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "player_characteristics_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "player_characteristics_characteristic_id_fkey" FOREIGN KEY ("characteristic_id") REFERENCES "characteristics" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "votes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "room_id" TEXT NOT NULL,
    "round" INTEGER NOT NULL,
    "voter_id" TEXT NOT NULL,
    "target_player_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "votes_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "votes_voter_id_fkey" FOREIGN KEY ("voter_id") REFERENCES "players" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "votes_target_player_id_fkey" FOREIGN KEY ("target_player_id") REFERENCES "players" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "game_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "room_id" TEXT NOT NULL,
    "round" INTEGER,
    "type" TEXT NOT NULL,
    "payload" TEXT NOT NULL DEFAULT '{}',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "game_events_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "characteristics_category_is_active_idx" ON "characteristics"("category", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "rooms_code_key" ON "rooms"("code");

-- CreateIndex
CREATE INDEX "players_room_id_idx" ON "players"("room_id");

-- CreateIndex
CREATE INDEX "players_user_id_idx" ON "players"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "players_room_id_user_id_key" ON "players"("room_id", "user_id");

-- CreateIndex
CREATE INDEX "player_characteristics_room_id_idx" ON "player_characteristics"("room_id");

-- CreateIndex
CREATE UNIQUE INDEX "player_characteristics_player_id_characteristic_id_key" ON "player_characteristics"("player_id", "characteristic_id");

-- CreateIndex
CREATE UNIQUE INDEX "player_characteristics_player_id_category_key" ON "player_characteristics"("player_id", "category");

-- CreateIndex
CREATE INDEX "votes_room_id_round_idx" ON "votes"("room_id", "round");

-- CreateIndex
CREATE UNIQUE INDEX "votes_room_id_round_voter_id_key" ON "votes"("room_id", "round", "voter_id");

-- CreateIndex
CREATE INDEX "game_events_room_id_created_at_idx" ON "game_events"("room_id", "created_at");
