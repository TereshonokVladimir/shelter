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
exports.GameService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const game_rules_1 = require("./game.rules");
const game_types_1 = require("./game.types");
const mock_bots_config_1 = require("./mocks/mock-bots.config");
const game_rarity_1 = require("./game.rarity");
const game_synergy_1 = require("./game.synergy");
let GameService = class GameService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    parseJson(value, fallback) {
        try {
            return JSON.parse(value);
        }
        catch {
            return fallback;
        }
    }
    assertNotPaused(room) {
        if (room.pausedAt)
            throw new game_types_1.GameException('GAME_PAUSED');
    }
    async requireHost(roomId, userId) {
        const host = await this.prisma.player.findFirst({
            where: { roomId, userId, role: 'host' },
        });
        if (!host)
            throw new game_types_1.GameException('FORBIDDEN_HOST_ONLY');
        return host;
    }
    async addEvent(roomId, type, payload = {}, round) {
        await this.prisma.gameEvent.create({
            data: {
                roomId,
                type,
                round: round ?? null,
                payload: JSON.stringify(payload),
            },
        });
    }
    voteResultEndsAt() {
        return new Date(Date.now() + game_rules_1.VOTE_RESULT_AUTO_SEC * 1000);
    }
    async resolveDefaultPackageId() {
        const pack = await this.prisma.contentPackage.findFirst({
            where: { OR: [{ slug: 'classic' }, { isBuiltin: true }], isActive: true },
            orderBy: { sortOrder: 'asc' },
        });
        if (!pack)
            throw new game_types_1.GameException('CONTENT_MISSING');
        return pack.id;
    }
    async createRoom(userId, input) {
        const name = input.name.trim();
        if (name.length < 2 || name.length > 24)
            throw new game_types_1.GameException('INVALID_NAME');
        if (input.maxPlayers < 4 || input.maxPlayers > 12)
            throw new game_types_1.GameException('INVALID_MAX_PLAYERS');
        const presentationDurationSec = input.presentationDurationSec ?? game_rules_1.DEFAULT_PRESENTATION_SEC;
        const votingDurationSec = input.votingDurationSec ?? game_rules_1.DEFAULT_VOTING_SEC;
        const revealDurationSec = input.revealDurationSec ?? game_rules_1.DEFAULT_REVEAL_SEC;
        const prepDurationSec = input.prepDurationSec ?? game_rules_1.DEFAULT_PREP_SEC;
        const revealStrategy = (0, game_rules_1.normalizeRevealStrategy)(input.revealStrategy ?? game_rules_1.DEFAULT_REVEAL_STRATEGY);
        if (presentationDurationSec < game_rules_1.MIN_PRESENTATION_SEC ||
            presentationDurationSec > game_rules_1.MAX_PRESENTATION_SEC) {
            throw new game_types_1.GameException('INVALID_PRESENTATION_DURATION');
        }
        if (votingDurationSec < game_rules_1.MIN_VOTING_SEC || votingDurationSec > game_rules_1.MAX_VOTING_SEC) {
            throw new game_types_1.GameException('INVALID_VOTING_DURATION');
        }
        if (revealDurationSec < game_rules_1.MIN_REVEAL_SEC || revealDurationSec > game_rules_1.MAX_REVEAL_SEC) {
            throw new game_types_1.GameException('INVALID_REVEAL_DURATION');
        }
        if (prepDurationSec < game_rules_1.MIN_PREP_SEC || prepDurationSec > game_rules_1.MAX_PREP_SEC) {
            throw new game_types_1.GameException('INVALID_PREP_DURATION');
        }
        if (input.revealStrategy != null &&
            input.revealStrategy !== '' &&
            input.revealStrategy !== 'sprint' &&
            (0, game_rules_1.normalizeRevealStrategy)(input.revealStrategy) !== input.revealStrategy) {
            throw new game_types_1.GameException('INVALID_REVEAL_STRATEGY');
        }
        const capacityPreview = (0, game_types_1.calculateShelterCapacity)(input.maxPlayers);
        const roundsPreview = (0, game_rules_1.plannedVotingRounds)(input.maxPlayers, capacityPreview);
        let revealQuotasJson = '[]';
        if (revealStrategy === 'custom') {
            const plan = (input.revealQuotas ?? []).map((n) => Math.floor(Number(n) || 0));
            if (!(0, game_rules_1.isValidCustomRevealPlan)(plan, roundsPreview, game_rules_1.TOTAL_VOLUNTARY_REVEALS)) {
                throw new game_types_1.GameException('INVALID_REVEAL_PLAN');
            }
            revealQuotasJson = JSON.stringify(plan);
        }
        const contentPack = await this.prisma.contentPackage.findFirst({
            where: { id: input.packageId, isActive: true },
        });
        if (!contentPack)
            throw new game_types_1.GameException('CONTENT_MISSING');
        for (let attempt = 0; attempt < 20; attempt += 1) {
            const code = (0, game_types_1.generateRoomCode)();
            try {
                const result = await this.prisma.$transaction(async (tx) => {
                    const room = await tx.room.create({
                        data: {
                            code,
                            maxPlayers: input.maxPlayers,
                            presentationDurationSec,
                            votingDurationSec,
                            revealDurationSec,
                            prepDurationSec,
                            revealStrategy,
                            revealQuotasJson,
                            packageId: contentPack.id,
                            discussionDurationSec: presentationDurationSec,
                        },
                    });
                    const player = await tx.player.create({
                        data: {
                            roomId: room.id,
                            userId,
                            name,
                            role: 'host',
                            status: 'active',
                            lastSeenAt: new Date(),
                        },
                    });
                    const updated = await tx.room.update({
                        where: { id: room.id },
                        data: { hostPlayerId: player.id },
                    });
                    await tx.gameEvent.create({
                        data: {
                            roomId: room.id,
                            type: 'room_created',
                            payload: JSON.stringify({
                                host_player_id: player.id,
                                package_id: contentPack.id,
                                reveal_strategy: revealStrategy,
                                reveal_quotas: this.parseJson(revealQuotasJson, []),
                                prep_duration_sec: prepDurationSec,
                            }),
                        },
                    });
                    return { room: updated, player };
                });
                return result;
            }
            catch (error) {
                const code = error && typeof error === 'object' && 'code' in error
                    ? String(error.code)
                    : '';
                if (code === 'P2002')
                    continue;
                throw error;
            }
        }
        throw new game_types_1.GameException('ROOM_NOT_FOUND');
    }
    async joinRoom(userId, input) {
        const name = input.name.trim();
        if (name.length < 2 || name.length > 24)
            throw new game_types_1.GameException('INVALID_NAME');
        const code = (0, game_types_1.normalizeRoomCode)(input.code);
        if (code.length < 4 || code.length > 8)
            throw new game_types_1.GameException('ROOM_NOT_FOUND');
        return this.prisma.$transaction(async (tx) => {
            const room = await tx.room.findUnique({ where: { code } });
            if (!room)
                throw new game_types_1.GameException('ROOM_NOT_FOUND');
            const existing = await tx.player.findUnique({
                where: { roomId_userId: { roomId: room.id, userId } },
            });
            if (existing) {
                const nextName = room.status === 'lobby' ? name : existing.name;
                if (room.status === 'lobby' && nextName !== existing.name) {
                    await this.assertUniquePlayerName(tx, room.id, nextName, existing.id);
                }
                const player = await tx.player.update({
                    where: { id: existing.id },
                    data: {
                        lastSeenAt: new Date(),
                        name: nextName,
                        status: existing.status === 'disconnected' && !existing.eliminatedAt
                            ? 'active'
                            : existing.status,
                    },
                });
                return { room, player, rejoined: true };
            }
            if (room.status !== 'lobby')
                throw new game_types_1.GameException('ROOM_NOT_JOINABLE');
            const count = await tx.player.count({
                where: { roomId: room.id, status: { not: 'disconnected' } },
            });
            if (count >= room.maxPlayers)
                throw new game_types_1.GameException('ROOM_FULL');
            await this.assertUniquePlayerName(tx, room.id, name);
            const player = await tx.player.create({
                data: {
                    roomId: room.id,
                    userId,
                    name,
                    role: 'player',
                    status: 'active',
                    isReady: false,
                    lastSeenAt: new Date(),
                },
            });
            await tx.gameEvent.create({
                data: {
                    roomId: room.id,
                    type: 'player_joined',
                    payload: JSON.stringify({ player_id: player.id, name: player.name }),
                },
            });
            return { room, player, rejoined: false };
        });
    }
    async setPlayerReady(userId, roomId, ready) {
        return this.prisma.$transaction(async (tx) => {
            const room = await tx.room.findUniqueOrThrow({ where: { id: roomId } });
            if (room.status !== 'lobby')
                throw new game_types_1.GameException('INVALID_STATUS');
            const me = await tx.player.findFirst({ where: { roomId, userId } });
            if (!me || me.status !== 'active')
                throw new game_types_1.GameException('PLAYER_NOT_ACTIVE');
            const player = await tx.player.update({
                where: { id: me.id },
                data: { isReady: ready, lastSeenAt: new Date() },
            });
            await tx.gameEvent.create({
                data: {
                    roomId,
                    type: ready ? 'player_ready' : 'player_unready',
                    payload: JSON.stringify({ player_id: player.id }),
                },
            });
            return { player };
        });
    }
    async removeLobbyPlayer(userId, roomId, playerId) {
        await this.requireHost(roomId, userId);
        return this.prisma.$transaction(async (tx) => {
            const room = await tx.room.findUniqueOrThrow({ where: { id: roomId } });
            if (room.status !== 'lobby')
                throw new game_types_1.GameException('INVALID_STATUS');
            const target = await tx.player.findFirst({ where: { id: playerId, roomId } });
            if (!target)
                throw new game_types_1.GameException('PLAYER_NOT_FOUND');
            if (target.role === 'host')
                throw new game_types_1.GameException('CANNOT_REMOVE_HOST');
            await tx.player.delete({ where: { id: target.id } });
            await tx.gameEvent.create({
                data: {
                    roomId,
                    type: 'player_removed',
                    payload: JSON.stringify({ player_id: playerId }),
                },
            });
            return { ok: true };
        });
    }
    async startGame(userId, roomId) {
        await this.requireHost(roomId, userId);
        return this.prisma.$transaction(async (tx) => {
            const room = await tx.room.findUniqueOrThrow({ where: { id: roomId } });
            if (room.status !== 'lobby') {
                if ([
                    'reveal',
                    'presentation',
                    'discussion',
                    'voting',
                    'vote_result',
                    'finished',
                ].includes(room.status)) {
                    return { room, already_started: true };
                }
                throw new game_types_1.GameException('INVALID_STATUS');
            }
            const players = await tx.player.findMany({
                where: { roomId, status: 'active' },
            });
            if (players.length < 4)
                throw new game_types_1.GameException('NOT_ENOUGH_PLAYERS');
            if (players.some((p) => !p.isReady))
                throw new game_types_1.GameException('PLAYERS_NOT_READY');
            const packageId = room.packageId ??
                (await tx.contentPackage.findFirst({
                    where: { slug: 'classic', isActive: true },
                }))?.id;
            if (!packageId)
                throw new game_types_1.GameException('CONTENT_MISSING');
            const disasters = await tx.disaster.findMany({
                where: { isActive: true, packageId },
            });
            const bunkers = await tx.bunker.findMany({
                where: { isActive: true, packageId },
            });
            if (!disasters.length || !bunkers.length)
                throw new game_types_1.GameException('CONTENT_MISSING');
            const disaster = (0, game_types_1.shuffle)(disasters)[0];
            const bunker = (0, game_types_1.shuffle)(bunkers)[0];
            const capacity = (0, game_types_1.calculateShelterCapacity)(players.length);
            const plannedRounds = (0, game_rules_1.plannedVotingRounds)(players.length, capacity);
            const draftQuotas = this.parseJson(room.revealQuotasJson, []);
            const revealPlan = room.revealStrategy === 'custom'
                ? (0, game_rules_1.normalizeCustomRevealPlan)(draftQuotas, plannedRounds)
                : (0, game_rules_1.distributeRevealQuotas)(plannedRounds, room.revealStrategy);
            for (const category of game_types_1.CHARACTERISTIC_CATEGORIES) {
                const pool = await tx.characteristic.findMany({
                    where: { isActive: true, category, packageId },
                });
                if (pool.length < players.length)
                    throw new game_types_1.GameException('NOT_ENOUGH_CHARACTERISTICS');
                const dealt = (0, game_rarity_1.pickWeightedByRarity)(pool, players.length);
                for (let i = 0; i < players.length; i += 1) {
                    const characteristic = dealt[i];
                    await tx.playerCharacteristic.create({
                        data: {
                            roomId,
                            playerId: players[i].id,
                            characteristicId: characteristic.id,
                            category,
                            isRevealed: false,
                        },
                    });
                }
            }
            const actionPool = await tx.actionCard.findMany({
                where: { isActive: true, packageId },
            });
            if (!actionPool.length)
                throw new game_types_1.GameException('NOT_ENOUGH_ACTIONS');
            const dealtActions = (0, game_types_1.shuffle)(Array.from({ length: players.length }, (_, i) => actionPool[i % actionPool.length]));
            for (let i = 0; i < players.length; i += 1) {
                await tx.playerActionCard.create({
                    data: {
                        roomId,
                        playerId: players[i].id,
                        actionCardId: dealtActions[i].id,
                        isUsed: false,
                    },
                });
            }
            const order = players.map((p) => p.id);
            const prepSec = room.prepDurationSec ?? 0;
            const startPresentation = prepSec <= 0;
            const phaseEndsAt = new Date(Date.now() +
                (startPresentation ? room.presentationDurationSec : prepSec) * 1000);
            const updated = await tx.room.update({
                where: { id: roomId },
                data: {
                    status: startPresentation ? 'presentation' : 'prep',
                    currentRound: 1,
                    shelterCapacity: capacity,
                    plannedRounds,
                    revealQuotasJson: JSON.stringify(revealPlan),
                    packageId,
                    disasterId: disaster.id,
                    bunkerId: bunker.id,
                    phaseEndsAt,
                    presentationPlayerId: startPresentation ? (order[0] ?? null) : null,
                    presentationOrderJson: startPresentation ? JSON.stringify(order) : '[]',
                    pausedAt: null,
                    pauseRemainingMs: null,
                    votingCandidateIdsJson: '[]',
                    lastVoteSummaryJson: '{}',
                },
            });
            await tx.gameEvent.create({
                data: {
                    roomId,
                    round: 1,
                    type: 'game_started',
                    payload: JSON.stringify({
                        disaster_id: disaster.id,
                        bunker_id: bunker.id,
                        package_id: packageId,
                        shelter_capacity: capacity,
                        planned_rounds: plannedRounds,
                        reveal_plan: revealPlan,
                        player_count: players.length,
                        phase_ends_at: phaseEndsAt,
                        presentation_player_id: startPresentation ? (order[0] ?? null) : null,
                        prep_duration_sec: prepSec,
                        reveal_strategy: room.revealStrategy,
                        phase: startPresentation ? 'presentation' : 'prep',
                    }),
                },
            });
            return { room: updated, disaster, bunker };
        });
    }
    async allActiveMetRevealQuota(roomId, currentRound, quota) {
        if (quota <= 0)
            return true;
        const active = await this.prisma.player.findMany({
            where: { roomId, status: 'active' },
            select: { id: true },
        });
        for (const player of active) {
            const revealed = await this.prisma.playerCharacteristic.count({
                where: {
                    playerId: player.id,
                    isRevealed: true,
                    revealedRound: currentRound,
                    revealSource: game_rules_1.QUOTA_REVEAL_SOURCE,
                },
            });
            if (revealed >= quota)
                continue;
            const unrevealed = await this.prisma.playerCharacteristic.count({
                where: { playerId: player.id, isRevealed: false },
            });
            if (unrevealed <= game_rules_1.ALWAYS_HIDDEN_COUNT)
                continue;
            return false;
        }
        return true;
    }
    async advanceRevealIfReady(roomId) {
        const room = await this.prisma.room.findUniqueOrThrow({ where: { id: roomId } });
        if (room.status !== 'reveal')
            return { advanced: false };
        const quota = this.quotaForRoom(room);
        const allDone = await this.allActiveMetRevealQuota(roomId, room.currentRound, quota);
        if (!allDone)
            return { advanced: false };
        await this.beginPresentation(roomId);
        return { advanced: true };
    }
    async revealCharacteristic(userId, roomId, playerCharacteristicId) {
        return this.prisma.$transaction(async (tx) => {
            const room = await tx.room.findUniqueOrThrow({ where: { id: roomId } });
            if (!(0, game_types_1.isPresentationStatus)(room.status) && room.status !== 'reveal') {
                throw new game_types_1.GameException('INVALID_STATUS');
            }
            this.assertNotPaused(room);
            const quota = this.quotaForRoom(room);
            if (quota <= 0)
                throw new game_types_1.GameException('INVALID_STATUS');
            const me = await tx.player.findFirst({
                where: { roomId, userId, status: 'active' },
            });
            if (!me)
                throw new game_types_1.GameException('PLAYER_NOT_ACTIVE');
            if ((0, game_types_1.isPresentationStatus)(room.status) && room.presentationPlayerId !== me.id) {
                throw new game_types_1.GameException('NOT_YOUR_TURN');
            }
            const pc = await tx.playerCharacteristic.findFirst({
                where: { id: playerCharacteristicId, roomId },
            });
            if (!pc)
                throw new game_types_1.GameException('PLAYER_NOT_FOUND');
            if (pc.playerId !== me.id)
                throw new game_types_1.GameException('FORBIDDEN_OWN_ONLY');
            if (pc.isRevealed) {
                return { player_characteristic: pc, already_revealed: true };
            }
            const already = await tx.playerCharacteristic.count({
                where: {
                    playerId: me.id,
                    isRevealed: true,
                    revealedRound: room.currentRound,
                    revealSource: { in: [game_rules_1.QUOTA_REVEAL_SOURCE, 'system'] },
                },
            });
            if (already >= quota)
                throw new game_types_1.GameException('REVEAL_LIMIT_REACHED');
            const unrevealed = await tx.playerCharacteristic.count({
                where: { playerId: me.id, isRevealed: false },
            });
            if (unrevealed <= game_rules_1.ALWAYS_HIDDEN_COUNT) {
                throw new game_types_1.GameException('REVEAL_LIMIT_REACHED');
            }
            const updated = await tx.playerCharacteristic.update({
                where: { id: pc.id },
                data: {
                    isRevealed: true,
                    revealedRound: room.currentRound,
                    revealedAt: new Date(),
                    revealSource: game_rules_1.QUOTA_REVEAL_SOURCE,
                },
            });
            await tx.gameEvent.create({
                data: {
                    roomId,
                    round: room.currentRound,
                    type: 'characteristic_revealed',
                    payload: JSON.stringify({
                        player_id: me.id,
                        category: updated.category,
                        player_characteristic_id: updated.id,
                    }),
                },
            });
            return { player_characteristic: updated };
        });
    }
    async playActionCard(userId, roomId, input) {
        return this.prisma.$transaction(async (tx) => {
            const room = await tx.room.findUniqueOrThrow({ where: { id: roomId } });
            if (!['reveal', 'presentation', 'discussion'].includes(room.status)) {
                throw new game_types_1.GameException('INVALID_STATUS');
            }
            this.assertNotPaused(room);
            const me = await tx.player.findFirst({
                where: { roomId, userId, status: 'active' },
            });
            if (!me)
                throw new game_types_1.GameException('PLAYER_NOT_ACTIVE');
            if ((0, game_types_1.isPresentationStatus)(room.status) && room.presentationPlayerId !== me.id) {
                throw new game_types_1.GameException('NOT_YOUR_TURN');
            }
            const pac = await tx.playerActionCard.findFirst({
                where: { id: input.playerActionCardId, roomId },
                include: { actionCard: true },
            });
            if (!pac)
                throw new game_types_1.GameException('PLAYER_NOT_FOUND');
            if (pac.playerId !== me.id)
                throw new game_types_1.GameException('FORBIDDEN_OWN_ONLY');
            if (pac.isUsed)
                throw new game_types_1.GameException('ACTION_ALREADY_USED');
            const effect = pac.actionCard.effectType;
            let summary = {
                effect_type: effect,
                action_title: pac.actionCard.title,
            };
            if (effect === 'swap_characteristic') {
                const category = input.category;
                const targetPlayerId = input.targetPlayerId;
                if (!category || !game_types_1.CHARACTERISTIC_CATEGORIES.includes(category)) {
                    throw new game_types_1.GameException('ACTION_INVALID');
                }
                if (!targetPlayerId || targetPlayerId === me.id) {
                    throw new game_types_1.GameException('INVALID_TARGET');
                }
                const target = await tx.player.findFirst({
                    where: { id: targetPlayerId, roomId, status: 'active' },
                });
                if (!target)
                    throw new game_types_1.GameException('INVALID_TARGET');
                const mine = await tx.playerCharacteristic.findFirst({
                    where: { playerId: me.id, category },
                    include: { characteristic: true },
                });
                const theirs = await tx.playerCharacteristic.findFirst({
                    where: { playerId: target.id, category },
                    include: { characteristic: true },
                });
                if (!mine || !theirs)
                    throw new game_types_1.GameException('ACTION_INVALID');
                await tx.playerCharacteristic.update({
                    where: { id: mine.id },
                    data: { characteristicId: theirs.characteristicId },
                });
                await tx.playerCharacteristic.update({
                    where: { id: theirs.id },
                    data: { characteristicId: mine.characteristicId },
                });
                summary = {
                    ...summary,
                    category,
                    target_player_id: target.id,
                    my_new_characteristic_id: theirs.characteristicId,
                    their_new_characteristic_id: mine.characteristicId,
                };
            }
            else if (effect === 'reroll_characteristic') {
                const category = input.category;
                if (!category || !game_types_1.CHARACTERISTIC_CATEGORIES.includes(category)) {
                    throw new game_types_1.GameException('ACTION_INVALID');
                }
                const mine = await tx.playerCharacteristic.findFirst({
                    where: { playerId: me.id, category },
                });
                if (!mine)
                    throw new game_types_1.GameException('ACTION_INVALID');
                if (!room.packageId)
                    throw new game_types_1.GameException('CONTENT_MISSING');
                const usedIds = (await tx.playerCharacteristic.findMany({
                    where: { roomId, category },
                    select: { characteristicId: true },
                })).map((r) => r.characteristicId);
                const pool = await tx.characteristic.findMany({
                    where: {
                        packageId: room.packageId,
                        category,
                        isActive: true,
                        id: { notIn: usedIds },
                    },
                });
                if (!pool.length)
                    throw new game_types_1.GameException('NOT_ENOUGH_CHARACTERISTICS');
                const next = (0, game_rarity_1.pickWeightedByRarity)(pool, 1)[0];
                await tx.playerCharacteristic.update({
                    where: { id: mine.id },
                    data: {
                        characteristicId: next.id,
                        isRevealed: false,
                        revealedRound: null,
                        revealedAt: null,
                        revealSource: game_rules_1.QUOTA_REVEAL_SOURCE,
                    },
                });
                summary = {
                    ...summary,
                    category,
                    new_characteristic_id: next.id,
                };
            }
            else if (effect === 'force_reveal') {
                const targetPlayerId = input.targetPlayerId;
                if (!targetPlayerId || targetPlayerId === me.id) {
                    throw new game_types_1.GameException('INVALID_TARGET');
                }
                const target = await tx.player.findFirst({
                    where: { id: targetPlayerId, roomId, status: 'active' },
                });
                if (!target)
                    throw new game_types_1.GameException('INVALID_TARGET');
                const hidden = (0, game_types_1.shuffle)(await tx.playerCharacteristic.findMany({
                    where: { playerId: target.id, isRevealed: false },
                    include: { characteristic: true },
                }));
                if (hidden.length <= game_rules_1.ALWAYS_HIDDEN_COUNT) {
                    throw new game_types_1.GameException('ACTION_INVALID');
                }
                const pick = hidden[0];
                await tx.playerCharacteristic.update({
                    where: { id: pick.id },
                    data: {
                        isRevealed: true,
                        revealedRound: room.currentRound,
                        revealedAt: new Date(),
                        revealSource: 'action',
                    },
                });
                summary = {
                    ...summary,
                    target_player_id: target.id,
                    category: pick.category,
                    player_characteristic_id: pick.id,
                    quota_exempt: true,
                };
            }
            else {
                throw new game_types_1.GameException('ACTION_INVALID');
            }
            await tx.playerActionCard.update({
                where: { id: pac.id },
                data: {
                    isUsed: true,
                    usedAt: new Date(),
                    usedRound: room.currentRound,
                },
            });
            await tx.gameEvent.create({
                data: {
                    roomId,
                    round: room.currentRound,
                    type: 'action_played',
                    payload: JSON.stringify({
                        player_id: me.id,
                        player_action_card_id: pac.id,
                        ...summary,
                    }),
                },
            });
            return { ok: true, summary };
        });
    }
    async autofillMissingReveals(roomId, playerIds) {
        const room = await this.prisma.room.findUniqueOrThrow({ where: { id: roomId } });
        if (room.status !== 'reveal' &&
            !(0, game_types_1.isPresentationStatus)(room.status)) {
            return;
        }
        const quota = this.quotaForRoom(room);
        if (quota <= 0)
            return;
        const active = await this.prisma.player.findMany({
            where: {
                roomId,
                status: 'active',
                ...(playerIds?.length ? { id: { in: playerIds } } : {}),
            },
        });
        for (const player of active) {
            const already = await this.prisma.playerCharacteristic.count({
                where: {
                    playerId: player.id,
                    isRevealed: true,
                    revealedRound: room.currentRound,
                    revealSource: game_rules_1.QUOTA_REVEAL_SOURCE,
                },
            });
            const systemAlready = await this.prisma.playerCharacteristic.count({
                where: {
                    playerId: player.id,
                    isRevealed: true,
                    revealedRound: room.currentRound,
                    revealSource: 'system',
                },
            });
            let need = quota - already - systemAlready;
            if (need <= 0)
                continue;
            const hidden = (0, game_types_1.shuffle)(await this.prisma.playerCharacteristic.findMany({
                where: { playerId: player.id, isRevealed: false },
            }));
            const maxCanReveal = Math.max(0, hidden.length - game_rules_1.ALWAYS_HIDDEN_COUNT);
            need = Math.min(need, maxCanReveal);
            if (need <= 0)
                continue;
            const picks = hidden.slice(0, need);
            for (const pick of picks) {
                await this.prisma.playerCharacteristic.update({
                    where: { id: pick.id },
                    data: {
                        isRevealed: true,
                        revealedRound: room.currentRound,
                        revealedAt: new Date(),
                        revealSource: 'system',
                    },
                });
            }
            if (picks.length > 0) {
                await this.addEvent(roomId, 'reveals_autofilled', {
                    player_id: player.id,
                    count: picks.length,
                    player_characteristic_ids: picks.map((p) => p.id),
                }, room.currentRound);
            }
        }
    }
    async beginPresentation(roomId, opts) {
        if (opts?.hostUserId) {
            await this.requireHost(roomId, opts.hostUserId);
        }
        const room = await this.prisma.room.findUniqueOrThrow({ where: { id: roomId } });
        this.assertNotPaused(room);
        if ((0, game_types_1.isPresentationStatus)(room.status)) {
            const existingOrder = this.parseJson(room.presentationOrderJson, []);
            if (room.presentationPlayerId && existingOrder.length > 0) {
                return { room, already: true };
            }
        }
        const voteSummary = this.parseJson(room.lastVoteSummaryJson, {});
        const tie = room.status === 'vote_result' && voteSummary.tie === true;
        const allowed = room.status === 'prep' ||
            room.status === 'reveal' ||
            tie ||
            (0, game_types_1.isPresentationStatus)(room.status) ||
            room.status === 'vote_result';
        if (!allowed)
            throw new game_types_1.GameException('INVALID_STATUS');
        if (room.status === 'reveal') {
            await this.autofillMissingReveals(roomId);
        }
        const active = await this.prisma.player.findMany({
            where: { roomId, status: 'active' },
            orderBy: { joinedAt: 'asc' },
        });
        if (active.length === 0)
            throw new game_types_1.GameException('INVALID_STATUS');
        let order = active.map((p) => p.id);
        if (tie) {
            const fromVotingList = this.parseJson(room.votingCandidateIdsJson, []);
            const candidateIds = fromVotingList.length > 0 ? fromVotingList : (voteSummary.candidate_ids ?? []);
            if (candidateIds.length > 0) {
                const allowedIds = new Set(candidateIds);
                order = active.filter((p) => allowedIds.has(p.id)).map((p) => p.id);
            }
        }
        if (order.length === 0) {
            order = active.map((p) => p.id);
        }
        const first = order[0];
        const phaseEndsAt = new Date(Date.now() + room.presentationDurationSec * 1000);
        const updated = await this.prisma.room.update({
            where: { id: roomId },
            data: {
                status: 'presentation',
                presentationPlayerId: first,
                presentationOrderJson: JSON.stringify(order),
                phaseEndsAt,
            },
        });
        await this.addEvent(roomId, 'presentation_started', {
            presentation_player_id: first,
            presentation_order: order,
            phase_ends_at: phaseEndsAt,
            tie_revote: tie,
        }, updated.currentRound);
        return { room: updated };
    }
    async advanceToDiscussion(userId, roomId) {
        return this.beginPresentation(roomId, { hostUserId: userId });
    }
    async advancePresentation(roomId, opts) {
        const room = await this.prisma.room.findUniqueOrThrow({ where: { id: roomId } });
        if (!(0, game_types_1.isPresentationStatus)(room.status))
            throw new game_types_1.GameException('INVALID_STATUS');
        this.assertNotPaused(room);
        const actorUserId = opts?.actorUserId ?? opts?.hostUserId;
        if (actorUserId) {
            const actor = await this.prisma.player.findFirst({
                where: { roomId, userId: actorUserId },
            });
            if (!actor || actor.status !== 'active') {
                throw new game_types_1.GameException('PLAYER_NOT_ACTIVE');
            }
            const isHost = actor.role === 'host';
            const isSpeaker = room.presentationPlayerId === actor.id;
            if (!isHost && !isSpeaker) {
                throw new game_types_1.GameException('FORBIDDEN_END_TURN');
            }
        }
        const order = this.parseJson(room.presentationOrderJson, []);
        const currentId = room.presentationPlayerId;
        const idx = currentId ? order.indexOf(currentId) : -1;
        const nextId = idx >= 0 && idx < order.length - 1 ? order[idx + 1] : null;
        if (currentId) {
            await this.autofillMissingReveals(roomId, [currentId]);
        }
        if (!nextId) {
            return this.beginVoting(roomId);
        }
        const phaseEndsAt = new Date(Date.now() + room.presentationDurationSec * 1000);
        const claimed = await this.prisma.room.updateMany({
            where: {
                id: roomId,
                presentationPlayerId: currentId,
                status: { in: ['presentation', 'discussion'] },
            },
            data: {
                status: 'presentation',
                presentationPlayerId: nextId,
                phaseEndsAt,
            },
        });
        if (claimed.count === 0) {
            const latest = await this.prisma.room.findUniqueOrThrow({ where: { id: roomId } });
            return { room: latest, skipped: true };
        }
        const updated = await this.prisma.room.findUniqueOrThrow({ where: { id: roomId } });
        await this.addEvent(roomId, 'presentation_advanced', {
            presentation_player_id: nextId,
            phase_ends_at: phaseEndsAt,
        }, updated.currentRound);
        return { room: updated };
    }
    async beginVoting(roomId) {
        const room = await this.prisma.room.findUniqueOrThrow({ where: { id: roomId } });
        this.assertNotPaused(room);
        if (room.status === 'voting')
            return { room, already: true };
        const fromPresentation = (0, game_types_1.isPresentationStatus)(room.status);
        const lastSummary = this.parseJson(room.lastVoteSummaryJson, {});
        const fromTie = room.status === 'vote_result' && lastSummary.tie === true;
        if (!fromPresentation && !fromTie)
            throw new game_types_1.GameException('INVALID_STATUS');
        if (fromPresentation) {
            const speakerOrder = this.parseJson(room.presentationOrderJson, []);
            const tieSpeeches = lastSummary.tie === true && speakerOrder.length > 0;
            await this.autofillMissingReveals(roomId, tieSpeeches ? speakerOrder : undefined);
        }
        const existingCandidates = this.parseJson(room.votingCandidateIdsJson, []);
        const isRevote = existingCandidates.length > 0 &&
            (fromTie || (fromPresentation && lastSummary.tie === true));
        let candidateIds;
        if (isRevote) {
            candidateIds = existingCandidates;
        }
        else {
            const active = await this.prisma.player.findMany({
                where: { roomId, status: 'active' },
                select: { id: true },
            });
            candidateIds = active.map((p) => p.id);
        }
        const seatsNeeded = isRevote ? Math.max(1, lastSummary.seats_needed ?? 1) : undefined;
        await this.prisma.vote.deleteMany({ where: { roomId, round: room.currentRound } });
        const phaseEndsAt = new Date(Date.now() + room.votingDurationSec * 1000);
        const updated = await this.prisma.room.update({
            where: { id: roomId },
            data: {
                status: 'voting',
                phaseEndsAt,
                presentationPlayerId: null,
                votingCandidateIdsJson: JSON.stringify(candidateIds),
                lastVoteSummaryJson: JSON.stringify(seatsNeeded != null ? { seats_needed: seatsNeeded } : {}),
            },
        });
        await this.addEvent(roomId, 'voting_started', {
            candidate_ids: candidateIds,
            phase_ends_at: phaseEndsAt,
            eliminations: seatsNeeded,
        }, updated.currentRound);
        return { room: updated };
    }
    async startVoting(userId, roomId) {
        await this.requireHost(roomId, userId);
        return this.beginVoting(roomId);
    }
    async submitVote(userId, roomId, targetPlayerId) {
        const result = await this.prisma.$transaction(async (tx) => {
            const room = await tx.room.findUniqueOrThrow({ where: { id: roomId } });
            if (room.status !== 'voting')
                throw new game_types_1.GameException('INVALID_STATUS');
            this.assertNotPaused(room);
            const me = await tx.player.findFirst({
                where: { roomId, userId, status: 'active' },
            });
            if (!me)
                throw new game_types_1.GameException('PLAYER_NOT_ACTIVE');
            if (me.id === targetPlayerId)
                throw new game_types_1.GameException('CANNOT_VOTE_SELF');
            const target = await tx.player.findFirst({
                where: { id: targetPlayerId, roomId, status: 'active' },
            });
            if (!target)
                throw new game_types_1.GameException('INVALID_TARGET');
            const candidates = this.parseJson(room.votingCandidateIdsJson, []);
            if (candidates.length > 0 && !candidates.includes(targetPlayerId)) {
                throw new game_types_1.GameException('INVALID_TARGET');
            }
            const existing = await tx.vote.findUnique({
                where: {
                    roomId_round_voterId: {
                        roomId,
                        round: room.currentRound,
                        voterId: me.id,
                    },
                },
            });
            const activeCount = await tx.player.count({ where: { roomId, status: 'active' } });
            if (existing) {
                const cast = await tx.vote.count({ where: { roomId, round: room.currentRound } });
                return {
                    vote: existing,
                    already_voted: true,
                    progress: { cast, total: activeCount },
                };
            }
            const vote = await tx.vote.create({
                data: {
                    roomId,
                    round: room.currentRound,
                    voterId: me.id,
                    targetPlayerId,
                },
            });
            const cast = await tx.vote.count({ where: { roomId, round: room.currentRound } });
            await tx.gameEvent.create({
                data: {
                    roomId,
                    round: room.currentRound,
                    type: 'vote_submitted',
                    payload: JSON.stringify({
                        voter_id: me.id,
                        progress_cast: cast,
                        progress_total: activeCount,
                    }),
                },
            });
            return { vote, already_voted: false, progress: { cast, total: activeCount } };
        });
        if (!result.already_voted && result.progress.cast >= result.progress.total) {
            const resolved = await this.resolveVotingIfReady(roomId);
            if (resolved) {
                return { ...result, room: resolved.room, auto_completed: true };
            }
        }
        return result;
    }
    async resolveVotingIfReady(roomId) {
        const room = await this.prisma.room.findUniqueOrThrow({ where: { id: roomId } });
        if (room.status !== 'voting' || room.pausedAt)
            return null;
        const activeCount = await this.prisma.player.count({
            where: { roomId, status: 'active' },
        });
        const cast = await this.prisma.vote.count({
            where: { roomId, round: room.currentRound },
        });
        if (cast < activeCount || activeCount === 0)
            return null;
        try {
            return await this.resolveVoting(roomId);
        }
        catch (error) {
            if (error instanceof game_types_1.GameException &&
                (error.code === 'INVALID_STATUS' || error.code === 'VOTING_INCOMPLETE')) {
                return null;
            }
            throw error;
        }
    }
    async autofillMissingVotesAsSelf(roomId, round) {
        const room = await this.prisma.room.findUniqueOrThrow({ where: { id: roomId } });
        const candidates = this.parseJson(room.votingCandidateIdsJson, []);
        const activePlayers = await this.prisma.player.findMany({
            where: { roomId, status: 'active' },
        });
        const votes = await this.prisma.vote.findMany({
            where: { roomId, round },
        });
        const voted = new Set(votes.map((v) => v.voterId));
        for (const player of activePlayers) {
            if (voted.has(player.id))
                continue;
            let targetPlayerId = player.id;
            if (candidates.length > 0) {
                const options = candidates.filter((id) => id !== player.id);
                if (options.length > 0) {
                    targetPlayerId = options[Math.floor(Math.random() * options.length)];
                }
                else if (candidates.includes(player.id)) {
                    targetPlayerId = player.id;
                }
                else {
                    targetPlayerId = candidates[Math.floor(Math.random() * candidates.length)];
                }
            }
            await this.prisma.vote.create({
                data: {
                    roomId,
                    round,
                    voterId: player.id,
                    targetPlayerId,
                },
            });
        }
    }
    async completeVoting(userId, roomId) {
        await this.requireHost(roomId, userId);
        const room = await this.prisma.room.findUniqueOrThrow({ where: { id: roomId } });
        this.assertNotPaused(room);
        return this.resolveVoting(roomId);
    }
    async resolveVoting(roomId) {
        const room = await this.prisma.room.findUniqueOrThrow({ where: { id: roomId } });
        if (room.status === 'vote_result' || room.status === 'finished') {
            return { room, already: true };
        }
        if (room.status !== 'voting')
            throw new game_types_1.GameException('INVALID_STATUS');
        const activePlayers = await this.prisma.player.findMany({
            where: { roomId, status: 'active' },
        });
        const votes = await this.prisma.vote.findMany({
            where: { roomId, round: room.currentRound },
        });
        if (votes.length < activePlayers.length)
            throw new game_types_1.GameException('VOTING_INCOMPLETE');
        const candidates = this.parseJson(room.votingCandidateIdsJson, []);
        const tallyTargets = candidates.length > 0 ? candidates : activePlayers.map((p) => p.id);
        const tallyMap = new Map();
        for (const id of tallyTargets)
            tallyMap.set(id, 0);
        for (const vote of votes) {
            if (!tallyMap.has(vote.targetPlayerId))
                continue;
            tallyMap.set(vote.targetPlayerId, (tallyMap.get(vote.targetPlayerId) ?? 0) + 1);
        }
        const tallies = [...tallyMap.entries()]
            .map(([player_id, voteCount]) => ({ player_id, votes: voteCount }))
            .sort((a, b) => b.votes - a.votes || a.player_id.localeCompare(b.player_id));
        const pendingSummary = this.parseJson(room.lastVoteSummaryJson, {});
        const isRevote = candidates.length > 0 && pendingSummary.seats_needed != null;
        const seats = isRevote
            ? Math.max(1, pendingSummary.seats_needed ?? 1)
            : (0, game_rules_1.eliminationsThisRound)({
                activeCount: activePlayers.length,
                shelterCapacity: room.shelterCapacity ?? 0,
                currentRound: room.currentRound,
                strategy: room.revealStrategy,
            });
        const picked = (0, game_rules_1.pickEliminations)(tallies, seats);
        if (picked.eliminateIds.length > 0) {
            await this.eliminatePlayers(roomId, room.currentRound, picked.eliminateIds);
        }
        if (picked.tieCandidateIds) {
            const phaseEndsAt = this.voteResultEndsAt();
            const updated = await this.prisma.room.update({
                where: { id: roomId },
                data: {
                    status: 'vote_result',
                    phaseEndsAt,
                    votingCandidateIdsJson: JSON.stringify(picked.tieCandidateIds),
                    lastVoteSummaryJson: JSON.stringify({
                        tie: true,
                        candidate_ids: picked.tieCandidateIds,
                        seats_needed: picked.seatsNeeded,
                        eliminated_player_ids: picked.eliminateIds,
                        eliminated_player_id: picked.eliminateIds[0] ?? null,
                        tallies,
                    }),
                },
            });
            await this.addEvent(roomId, 'vote_tie', {
                candidate_ids: picked.tieCandidateIds,
                seats_needed: picked.seatsNeeded,
                eliminated_player_ids: picked.eliminateIds,
                tallies,
                phase_ends_at: phaseEndsAt,
            }, room.currentRound);
            return {
                room: updated,
                tie: true,
                summary: tallies,
                eliminated_player_ids: picked.eliminateIds,
            };
        }
        const eliminatedIds = picked.eliminateIds;
        const eliminatedId = eliminatedIds[0] ?? null;
        const remaining = await this.prisma.player.count({ where: { roomId, status: 'active' } });
        if (remaining <= (room.shelterCapacity ?? 0)) {
            const updated = await this.prisma.room.update({
                where: { id: roomId },
                data: {
                    status: 'finished',
                    votingCandidateIdsJson: '[]',
                    lastVoteSummaryJson: JSON.stringify({
                        tie: false,
                        eliminated_player_ids: eliminatedIds,
                        eliminated_player_id: eliminatedId,
                        tallies,
                    }),
                    phaseEndsAt: null,
                    presentationPlayerId: null,
                },
            });
            await this.prisma.playerCharacteristic.updateMany({
                where: {
                    roomId,
                    isRevealed: false,
                },
                data: {
                    isRevealed: true,
                    revealedRound: room.currentRound,
                    revealedAt: new Date(),
                    revealSource: 'system',
                },
            });
            await this.addEvent(roomId, 'game_finished', {
                eliminated_player_ids: eliminatedIds,
                eliminated_player_id: eliminatedId,
                tallies,
            }, room.currentRound);
            return {
                room: updated,
                eliminated_player_id: eliminatedId,
                eliminated_player_ids: eliminatedIds,
                summary: tallies,
                tie: false,
            };
        }
        const phaseEndsAt = this.voteResultEndsAt();
        const updated = await this.prisma.room.update({
            where: { id: roomId },
            data: {
                status: 'vote_result',
                phaseEndsAt,
                votingCandidateIdsJson: '[]',
                lastVoteSummaryJson: JSON.stringify({
                    tie: false,
                    eliminated_player_ids: eliminatedIds,
                    eliminated_player_id: eliminatedId,
                    tallies,
                }),
            },
        });
        await this.addEvent(roomId, 'player_eliminated', {
            eliminated_player_ids: eliminatedIds,
            eliminated_player_id: eliminatedId,
            tallies,
            phase_ends_at: phaseEndsAt,
        }, room.currentRound);
        return {
            room: updated,
            eliminated_player_id: eliminatedId,
            eliminated_player_ids: eliminatedIds,
            summary: tallies,
            tie: false,
        };
    }
    async eliminatePlayers(roomId, round, playerIds) {
        const now = new Date();
        await this.prisma.player.updateMany({
            where: { id: { in: playerIds }, roomId },
            data: { status: 'eliminated', eliminatedAt: now },
        });
        await this.prisma.playerCharacteristic.updateMany({
            where: { playerId: { in: playerIds }, roomId, isRevealed: false },
            data: {
                isRevealed: true,
                revealedRound: round,
                revealedAt: now,
                revealSource: 'system',
            },
        });
    }
    async nextRevealRound(userId, roomId) {
        await this.requireHost(roomId, userId);
        return this.advanceToNextRound(roomId);
    }
    async advanceToNextRound(roomId) {
        const room = await this.prisma.room.findUniqueOrThrow({ where: { id: roomId } });
        this.assertNotPaused(room);
        const lastSummary = this.parseJson(room.lastVoteSummaryJson, {});
        const fromPresentationSkip = (0, game_types_1.isPresentationStatus)(room.status) && lastSummary.tie !== true;
        if (room.status !== 'vote_result' && !fromPresentationSkip) {
            throw new game_types_1.GameException('INVALID_STATUS');
        }
        if (room.status === 'vote_result') {
            const candidates = this.parseJson(room.votingCandidateIdsJson, []);
            if (lastSummary.tie && candidates.length > 0)
                throw new game_types_1.GameException('TIE_REQUIRES_REVOTE');
        }
        if (fromPresentationSkip) {
            await this.autofillMissingReveals(roomId);
        }
        const nextRound = room.currentRound + 1;
        await this.prisma.room.update({
            where: { id: roomId },
            data: {
                currentRound: nextRound,
                votingCandidateIdsJson: '[]',
                lastVoteSummaryJson: '{}',
                presentationPlayerId: null,
                presentationOrderJson: '[]',
            },
        });
        await this.addEvent(roomId, 'round_advanced', { current_round: nextRound }, nextRound);
        return this.beginPresentation(roomId);
    }
    async setPaused(userId, roomId, paused) {
        await this.requireHost(roomId, userId);
        const room = await this.prisma.room.findUniqueOrThrow({ where: { id: roomId } });
        if (room.status === 'lobby' || room.status === 'finished') {
            throw new game_types_1.GameException('INVALID_STATUS');
        }
        if (paused) {
            if (room.pausedAt)
                return { room, already: true };
            const remaining = room.phaseEndsAt != null
                ? Math.max(0, room.phaseEndsAt.getTime() - Date.now())
                : null;
            const updated = await this.prisma.room.update({
                where: { id: roomId },
                data: {
                    pausedAt: new Date(),
                    pauseRemainingMs: remaining,
                    phaseEndsAt: null,
                },
            });
            await this.addEvent(roomId, 'game_paused', { pause_remaining_ms: remaining }, room.currentRound);
            return { room: updated };
        }
        if (!room.pausedAt)
            return { room, already: true };
        const phaseEndsAt = room.pauseRemainingMs != null
            ? new Date(Date.now() + room.pauseRemainingMs)
            : null;
        const updated = await this.prisma.room.update({
            where: { id: roomId },
            data: {
                pausedAt: null,
                pauseRemainingMs: null,
                phaseEndsAt,
            },
        });
        await this.addEvent(roomId, 'game_resumed', { phase_ends_at: phaseEndsAt }, room.currentRound);
        return { room: updated };
    }
    async processDuePhases() {
        const now = new Date();
        const due = await this.prisma.room.findMany({
            where: {
                phaseEndsAt: { lte: now },
                pausedAt: null,
                status: {
                    in: ['prep', 'reveal', 'presentation', 'discussion', 'voting', 'vote_result'],
                },
            },
            select: { id: true, code: true, status: true },
        });
        const changedCodes = [];
        for (const room of due) {
            try {
                await this.handleTimeout(room.id);
                changedCodes.push(room.code);
            }
            catch {
            }
        }
        return changedCodes;
    }
    async handleTimeout(roomId) {
        const room = await this.prisma.room.findUniqueOrThrow({ where: { id: roomId } });
        if (room.pausedAt)
            return;
        if (!room.phaseEndsAt || room.phaseEndsAt.getTime() > Date.now())
            return;
        const status = (0, game_types_1.normalizeGameStatus)(room.status);
        if (status === 'prep' || status === 'reveal') {
            await this.beginPresentation(roomId);
            return;
        }
        if (status === 'presentation') {
            await this.advancePresentation(roomId);
            return;
        }
        if (status === 'voting') {
            await this.autofillMissingVotesAsSelf(roomId, room.currentRound);
            await this.resolveVoting(roomId);
            return;
        }
        if (status === 'vote_result') {
            const summary = this.parseJson(room.lastVoteSummaryJson, {});
            const candidates = this.parseJson(room.votingCandidateIdsJson, []);
            if (summary.tie && candidates.length > 0) {
                await this.beginPresentation(roomId);
                return;
            }
            await this.advanceToNextRound(roomId);
        }
    }
    async finishGame(userId, roomId) {
        await this.requireHost(roomId, userId);
        return this.prisma.$transaction(async (tx) => {
            const room = await tx.room.findUniqueOrThrow({ where: { id: roomId } });
            if (room.status === 'finished')
                return { room, already: true };
            if (room.status === 'lobby')
                throw new game_types_1.GameException('INVALID_STATUS');
            const updated = await tx.room.update({
                where: { id: roomId },
                data: {
                    status: 'finished',
                    phaseEndsAt: null,
                    pausedAt: null,
                    pauseRemainingMs: null,
                    presentationPlayerId: null,
                },
            });
            await tx.playerCharacteristic.updateMany({
                where: { roomId, isRevealed: false },
                data: {
                    isRevealed: true,
                    revealedAt: new Date(),
                    revealedRound: room.currentRound,
                    revealSource: 'system',
                },
            });
            await tx.gameEvent.create({
                data: {
                    roomId,
                    round: room.currentRound,
                    type: 'game_finished',
                    payload: JSON.stringify({ forced: true }),
                },
            });
            return { room: updated };
        });
    }
    async getRoomCode(roomId) {
        const room = await this.prisma.room.findUnique({
            where: { id: roomId },
            select: { code: true },
        });
        return room?.code ?? null;
    }
    async buildFinishStats(roomId) {
        const room = await this.prisma.room.findUniqueOrThrow({
            where: { id: roomId },
            include: { disaster: true, bunker: true },
        });
        const [players, votes, traits] = await Promise.all([
            this.prisma.player.findMany({ where: { roomId } }),
            this.prisma.vote.findMany({ where: { roomId } }),
            this.prisma.playerCharacteristic.findMany({
                where: { roomId },
                include: { characteristic: true },
            }),
        ]);
        const maxRound = Math.max(1, room.currentRound);
        const synergy = (0, game_synergy_1.evaluateBunkerSynergy)({
            disasterTitle: room.disaster?.title ?? '',
            disasterDescription: room.disaster?.description ?? '',
            bunkerTitle: room.bunker?.title ?? null,
            bunkerDescription: room.bunker?.description ?? null,
            players: players.map((player) => ({
                id: player.id,
                name: player.name,
                status: player.status,
                traits: traits
                    .filter((t) => t.playerId === player.id)
                    .map((t) => ({
                    category: t.category,
                    title: t.characteristic.title,
                    description: t.characteristic.description,
                })),
            })),
        });
        const synergyByPlayer = new Map(synergy.players.map((p) => [p.player_id, p]));
        const stats = players.map((player) => {
            const votesAgainst = votes.filter((v) => v.targetPlayerId === player.id).length;
            const survived = player.status === 'active';
            const votedRounds = votes.filter((v) => v.voterId === player.id).map((v) => v.round);
            const roundsLasted = survived
                ? maxRound
                : Math.max(1, ...(votedRounds.length ? votedRounds : [1]));
            const hand = traits.filter((t) => t.playerId === player.id);
            const rarity_counts = (0, game_rarity_1.emptyRarityCounts)();
            let rarityPower = 0;
            for (const row of hand) {
                const rarity = (0, game_rarity_1.normalizeRarity)(row.characteristic.rarity);
                rarity_counts[rarity] += 1;
                rarityPower += game_rarity_1.RARITY_SCORE[rarity];
            }
            const fit = synergyByPlayer.get(player.id);
            const theme_fit = fit?.theme_fit ?? 0;
            const synergyScore = fit?.synergy ?? 0;
            const conflict = fit?.conflict ?? 0;
            return {
                player_id: player.id,
                name: player.name,
                status: player.status,
                survived,
                survival_chance: (0, game_synergy_1.computeThematicSurvivalChance)({
                    survived,
                    themeFit: theme_fit,
                    synergy: synergyScore,
                    conflict,
                }),
                theme_fit,
                synergy: synergyScore,
                conflict,
                votes_against: votesAgainst,
                rounds_lasted: roundsLasted,
                rarity_power: rarityPower,
                rarity_counts,
                notes: fit?.notes ?? [],
            };
        });
        stats.sort((a, b) => {
            if (a.survived !== b.survived)
                return a.survived ? -1 : 1;
            return b.survival_chance - a.survival_chance;
        });
        return {
            shelter_capacity: room.shelterCapacity,
            max_round: maxRound,
            bunker_outlook: synergy.bunker_outlook,
            challenge_threshold: synergy.challenge_threshold,
            passed: synergy.passed,
            bunker_verdict: synergy.bunker_verdict,
            highlights: synergy.highlights,
            themes: synergy.themes,
            categories: synergy.categories,
            criteria: synergy.criteria,
            disaster_title: room.disaster?.title ?? null,
            players: stats,
        };
    }
    async getSnapshot(userId, code) {
        const normalized = (0, game_types_1.normalizeRoomCode)(code);
        const room = await this.prisma.room.findUnique({
            where: { code: normalized },
            include: {
                disaster: true,
                bunker: true,
            },
        });
        if (!room)
            return null;
        const me = await this.prisma.player.findUnique({
            where: { roomId_userId: { roomId: room.id, userId } },
        });
        if (!me)
            return null;
        const [players, characteristics, actionCards, events, votes] = await Promise.all([
            this.prisma.player.findMany({
                where: { roomId: room.id },
                orderBy: { joinedAt: 'asc' },
            }),
            this.prisma.playerCharacteristic.findMany({
                where: { roomId: room.id },
                include: { characteristic: true },
            }),
            this.prisma.playerActionCard.findMany({
                where: { roomId: room.id },
                include: { actionCard: true },
            }),
            this.prisma.gameEvent.findMany({
                where: { roomId: room.id },
                orderBy: { createdAt: 'desc' },
                take: 40,
            }),
            this.prisma.vote.findMany({
                where: { roomId: room.id, round: room.currentRound },
            }),
        ]);
        const showAllTraits = room.status === 'finished';
        const visibleCharacteristics = characteristics
            .filter((item) => showAllTraits || item.isRevealed || item.playerId === me.id)
            .map((item) => ({
            id: item.id,
            room_id: item.roomId,
            player_id: item.playerId,
            characteristic_id: item.characteristicId,
            category: item.category,
            is_revealed: showAllTraits ? true : item.isRevealed,
            revealed_round: item.revealedRound,
            revealed_at: item.revealedAt?.toISOString() ?? null,
            reveal_source: item.revealSource ?? 'player',
            characteristic: {
                id: item.characteristic.id,
                category: item.characteristic.category,
                title: item.characteristic.title,
                description: item.characteristic.description,
                rarity: (0, game_rarity_1.normalizeRarity)(item.characteristic.rarity),
                is_active: item.characteristic.isActive,
            },
        }));
        const visibleActionCards = actionCards
            .filter((item) => item.playerId === me.id || item.isUsed || showAllTraits)
            .map((item) => {
            const isOwner = item.playerId === me.id;
            return {
                id: item.id,
                room_id: item.roomId,
                player_id: item.playerId,
                action_card_id: item.actionCardId,
                is_used: item.isUsed,
                used_at: item.usedAt?.toISOString() ?? null,
                used_round: item.usedRound,
                action_card: {
                    id: item.actionCard.id,
                    effect_type: item.actionCard.effectType,
                    title: isOwner || item.isUsed || showAllTraits ? item.actionCard.title : 'Карточка действия',
                    description: isOwner || item.isUsed || showAllTraits
                        ? item.actionCard.description
                        : 'Скрыта',
                },
            };
        });
        const activeVoters = players.filter((p) => p.status === 'active');
        const visibleVotes = room.status === 'vote_result' || room.status === 'finished'
            ? votes
            : votes.filter((v) => v.voterId === me.id);
        const finish_stats = room.status === 'finished' ? await this.buildFinishStats(room.id) : null;
        return {
            room: this.serializeRoom(room, {
                activeCount: activeVoters.length,
            }),
            players: players.map((p) => this.serializePlayer(p)),
            me: this.serializePlayer(me),
            disaster: room.disaster
                ? {
                    id: room.disaster.id,
                    title: room.disaster.title,
                    description: room.disaster.description,
                    is_active: room.disaster.isActive,
                }
                : null,
            bunker: room.bunker
                ? {
                    id: room.bunker.id,
                    title: room.bunker.title,
                    description: room.bunker.description,
                    is_active: room.bunker.isActive,
                }
                : null,
            characteristics: visibleCharacteristics,
            action_cards: visibleActionCards,
            finish_stats,
            events: events.map((e) => ({
                id: e.id,
                room_id: e.roomId,
                round: e.round,
                type: e.type,
                payload: this.parseJson(e.payload, {}),
                created_at: e.createdAt.toISOString(),
            })),
            votes: visibleVotes.map((v) => ({
                id: v.id,
                room_id: v.roomId,
                round: v.round,
                voter_id: v.voterId,
                target_player_id: v.targetPlayerId,
                created_at: v.createdAt.toISOString(),
            })),
            myVote: votes.find((v) => v.voterId === me.id)
                ? {
                    id: votes.find((v) => v.voterId === me.id).id,
                    room_id: room.id,
                    round: room.currentRound,
                    voter_id: me.id,
                    target_player_id: votes.find((v) => v.voterId === me.id).targetPlayerId,
                    created_at: votes.find((v) => v.voterId === me.id).createdAt.toISOString(),
                }
                : null,
            vote_progress: {
                cast: votes.length,
                total: activeVoters.length,
            },
            mocks_enabled: (0, mock_bots_config_1.isMockBotsEnabled)(),
        };
    }
    roomRevealPlan(room) {
        const stored = this.parseJson(room.revealQuotasJson ?? '[]', []);
        const capacity = room.shelterCapacity ?? (0, game_types_1.calculateShelterCapacity)(room.maxPlayers);
        const rounds = room.plannedRounds && room.plannedRounds > 0
            ? room.plannedRounds
            : (0, game_rules_1.plannedVotingRounds)(room.status === 'lobby' ? room.maxPlayers : room.maxPlayers, capacity);
        if (stored.length > 0) {
            if (stored.length === rounds)
                return stored.map((n) => Math.max(0, Math.floor(n)));
            return (0, game_rules_1.normalizeCustomRevealPlan)(stored, rounds);
        }
        return (0, game_rules_1.distributeRevealQuotas)(rounds, room.revealStrategy);
    }
    quotaForRoom(room) {
        const plan = this.roomRevealPlan(room);
        return plan[room.currentRound - 1] ?? 0;
    }
    serializeRoom(room, opts) {
        const status = (0, game_types_1.normalizeGameStatus)(room.status);
        const lastVoteSummary = this.parseJson(room.lastVoteSummaryJson, {});
        const activeCount = opts?.activeCount ?? 0;
        const plannedEliminations = lastVoteSummary.seats_needed != null &&
            (status === 'voting' || status === 'vote_result')
            ? Math.max(1, lastVoteSummary.seats_needed)
            : (0, game_rules_1.eliminationsThisRound)({
                activeCount,
                shelterCapacity: room.shelterCapacity ?? 0,
                currentRound: room.currentRound,
                strategy: room.revealStrategy,
            });
        const revealPlan = this.roomRevealPlan(room);
        return {
            id: room.id,
            code: room.code,
            host_player_id: room.hostPlayerId,
            status: status,
            current_round: room.currentRound,
            max_players: room.maxPlayers,
            shelter_capacity: room.shelterCapacity,
            planned_rounds: room.plannedRounds,
            reveal_plan: revealPlan,
            package_id: room.packageId,
            disaster_id: room.disasterId,
            bunker_id: room.bunkerId,
            discussion_duration_sec: room.discussionDurationSec,
            presentation_duration_sec: room.presentationDurationSec,
            voting_duration_sec: room.votingDurationSec,
            reveal_duration_sec: room.revealDurationSec,
            prep_duration_sec: room.prepDurationSec,
            reveal_strategy: (0, game_rules_1.normalizeRevealStrategy)(room.revealStrategy),
            presentation_player_id: room.presentationPlayerId,
            presentation_order: this.parseJson(room.presentationOrderJson, []),
            phase_ends_at: room.phaseEndsAt?.toISOString() ?? null,
            paused_at: room.pausedAt?.toISOString() ?? null,
            pause_remaining_ms: room.pauseRemainingMs,
            is_paused: Boolean(room.pausedAt),
            reveal_quota: revealPlan[room.currentRound - 1] ?? 0,
            eliminations_this_round: plannedEliminations,
            voting_candidate_ids: this.parseJson(room.votingCandidateIdsJson, []),
            last_vote_summary: this.parseJson(room.lastVoteSummaryJson, {}),
            created_at: room.createdAt.toISOString(),
            updated_at: room.updatedAt.toISOString(),
        };
    }
    serializePlayer(player) {
        return {
            id: player.id,
            room_id: player.roomId,
            user_id: player.userId,
            name: player.name,
            role: player.role,
            status: player.status,
            is_ready: Boolean(player.isReady),
            joined_at: player.joinedAt.toISOString(),
            last_seen_at: player.lastSeenAt?.toISOString() ?? null,
            eliminated_at: player.eliminatedAt?.toISOString() ?? null,
        };
    }
    async assertUniquePlayerName(tx, roomId, name, exceptPlayerId) {
        const needle = name.trim().toLocaleLowerCase('ru');
        const players = await tx.player.findMany({
            where: {
                roomId,
                status: { not: 'disconnected' },
                ...(exceptPlayerId ? { id: { not: exceptPlayerId } } : {}),
            },
            select: { id: true, name: true },
        });
        if (players.some((p) => p.name.trim().toLocaleLowerCase('ru') === needle)) {
            throw new game_types_1.GameException('NAME_TAKEN');
        }
    }
};
exports.GameService = GameService;
exports.GameService = GameService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], GameService);
//# sourceMappingURL=game.service.js.map