"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockBotsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const game_rules_1 = require("../game.rules");
const game_types_1 = require("../game.types");
const mock_bots_config_1 = require("./mock-bots.config");
let MockBotsService = class MockBotsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    assertEnabled() {
        if (!(0, mock_bots_config_1.isMockBotsEnabled)()) {
            throw new game_types_1.GameException('MOCKS_DISABLED');
        }
    }
    async requireHost(roomId, userId) {
        const me = await this.prisma.player.findFirst({ where: { roomId, userId } });
        if (!me || me.role !== 'host')
            throw new game_types_1.GameException('FORBIDDEN_HOST_ONLY');
        return me;
    }
    parseJson(raw, fallback) {
        try {
            return JSON.parse(raw);
        }
        catch {
            return fallback;
        }
    }
    async addMockPlayers(userId, roomId, count) {
        this.assertEnabled();
        await this.requireHost(roomId, userId);
        return this.prisma.$transaction(async (tx) => {
            const room = await tx.room.findUniqueOrThrow({ where: { id: roomId } });
            if (room.status !== 'lobby')
                throw new game_types_1.GameException('INVALID_STATUS');
            const existing = await tx.player.findMany({ where: { roomId } });
            const activeCount = existing.filter((p) => p.status !== 'disconnected').length;
            const freeSlots = Math.max(0, room.maxPlayers - activeCount);
            if (freeSlots === 0)
                throw new game_types_1.GameException('ROOM_FULL');
            const neededForMin = Math.max(0, 4 - activeCount);
            const toAdd = Math.min(freeSlots, count ?? Math.max(neededForMin, 3));
            if (toAdd <= 0) {
                return { added: 0, players: existing };
            }
            const usedNames = new Set(existing.map((p) => p.name));
            const created = [];
            for (let i = 0; i < toAdd; i += 1) {
                const name = mock_bots_config_1.MOCK_BOT_NAMES.find((candidate) => !usedNames.has(candidate)) ??
                    `Бот ${existing.length + i + 1}`;
                usedNames.add(name);
                const user = await tx.user.create({ data: {} });
                const player = await tx.player.create({
                    data: {
                        roomId,
                        userId: user.id,
                        name,
                        role: 'player',
                        status: 'active',
                        lastSeenAt: new Date(),
                    },
                });
                created.push(player);
                await tx.gameEvent.create({
                    data: {
                        roomId,
                        type: 'player_joined',
                        payload: JSON.stringify({ player_id: player.id, name, mock: true }),
                    },
                });
            }
            const players = await tx.player.findMany({
                where: { roomId },
                orderBy: { joinedAt: 'asc' },
            });
            return { added: created.length, players };
        });
    }
    async runBots(userId, roomId) {
        this.assertEnabled();
        await this.requireHost(roomId, userId);
        return this.prisma.$transaction(async (tx) => {
            const room = await tx.room.findUniqueOrThrow({ where: { id: roomId } });
            const bots = await tx.player.findMany({
                where: { roomId, status: 'active', role: 'player' },
            });
            const botPlayers = bots.filter((p) => (0, mock_bots_config_1.isBotPlayerName)(p.name));
            if (botPlayers.length === 0) {
                return { acted: 0, status: room.status };
            }
            let acted = 0;
            if (room.status === 'reveal') {
                const quota = (0, game_rules_1.revealQuotaForRound)(room.currentRound);
                if (quota > 0) {
                    for (const bot of botPlayers) {
                        let already = await tx.playerCharacteristic.count({
                            where: {
                                playerId: bot.id,
                                isRevealed: true,
                                revealedRound: room.currentRound,
                            },
                        });
                        while (already < quota) {
                            const unrevealedCount = await tx.playerCharacteristic.count({
                                where: { playerId: bot.id, isRevealed: false },
                            });
                            if (unrevealedCount <= game_rules_1.ALWAYS_HIDDEN_COUNT)
                                break;
                            const hidden = await tx.playerCharacteristic.findFirst({
                                where: { playerId: bot.id, isRevealed: false },
                            });
                            if (!hidden)
                                break;
                            await tx.playerCharacteristic.update({
                                where: { id: hidden.id },
                                data: {
                                    isRevealed: true,
                                    revealedRound: room.currentRound,
                                    revealedAt: new Date(),
                                },
                            });
                            await tx.gameEvent.create({
                                data: {
                                    roomId,
                                    round: room.currentRound,
                                    type: 'characteristic_revealed',
                                    payload: JSON.stringify({
                                        player_id: bot.id,
                                        category: hidden.category,
                                        player_characteristic_id: hidden.id,
                                        mock: true,
                                    }),
                                },
                            });
                            already += 1;
                            acted += 1;
                        }
                    }
                }
            }
            if (room.status === 'voting') {
                const candidates = this.parseJson(room.votingCandidateIdsJson, []);
                const active = await tx.player.findMany({
                    where: { roomId, status: 'active' },
                });
                const candidateIds = candidates.length > 0 ? candidates : active.map((p) => p.id);
                for (const bot of botPlayers) {
                    const existingVote = await tx.vote.findUnique({
                        where: {
                            roomId_round_voterId: {
                                roomId,
                                round: room.currentRound,
                                voterId: bot.id,
                            },
                        },
                    });
                    if (existingVote)
                        continue;
                    const options = candidateIds.filter((id) => id !== bot.id);
                    if (options.length === 0)
                        continue;
                    const targetPlayerId = options[Math.floor(Math.random() * options.length)];
                    await tx.vote.create({
                        data: {
                            roomId,
                            round: room.currentRound,
                            voterId: bot.id,
                            targetPlayerId,
                        },
                    });
                    acted += 1;
                }
                if (acted > 0) {
                    const cast = await tx.vote.count({
                        where: { roomId, round: room.currentRound },
                    });
                    await tx.gameEvent.create({
                        data: {
                            roomId,
                            round: room.currentRound,
                            type: 'vote_submitted',
                            payload: JSON.stringify({
                                mock: true,
                                progress_cast: cast,
                                progress_total: active.length,
                            }),
                        },
                    });
                }
            }
            return { acted, status: room.status };
        });
    }
};
exports.MockBotsService = MockBotsService;
exports.MockBotsService = MockBotsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MockBotsService);
//# sourceMappingURL=mock-bots.service.js.map