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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameController = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("../auth/auth.service");
const game_service_1 = require("./game.service");
const game_types_1 = require("./game.types");
const game_rules_1 = require("./game.rules");
const events_gateway_1 = require("../realtime/events.gateway");
const mock_bots_service_1 = require("./mocks/mock-bots.service");
let GameController = class GameController {
    game;
    mocks;
    events;
    constructor(game, mocks, events) {
        this.game = game;
        this.mocks = mocks;
        this.events = events;
    }
    wrap(fn) {
        return fn().catch((error) => {
            if (error instanceof game_types_1.GameException) {
                throw new common_1.HttpException({ code: error.code, message: error.message }, common_1.HttpStatus.BAD_REQUEST);
            }
            throw error;
        });
    }
    async afterRoomChange(roomId, code) {
        const roomCode = code ?? (await this.game.getRoomCode(roomId));
        if (roomCode)
            this.events.emitRoomUpdated(roomCode);
    }
    createRoom(userId, body) {
        return this.wrap(async () => {
            let packageId = body.packageId;
            if (!packageId) {
                const classic = await this.game.resolveDefaultPackageId();
                packageId = classic;
            }
            const result = await this.game.createRoom(userId, {
                name: body.name,
                maxPlayers: body.maxPlayers ?? 8,
                presentationDurationSec: body.presentationDurationSec ??
                    body.discussionDurationSec ??
                    game_rules_1.DEFAULT_PRESENTATION_SEC,
                votingDurationSec: body.votingDurationSec ?? game_rules_1.DEFAULT_VOTING_SEC,
                revealDurationSec: body.revealDurationSec ?? game_rules_1.DEFAULT_REVEAL_SEC,
                packageId,
            });
            this.events.emitRoomUpdated(result.room.code);
            return result;
        });
    }
    joinRoom(userId, body) {
        return this.wrap(async () => {
            const result = await this.game.joinRoom(userId, body);
            this.events.emitRoomUpdated(result.room.code);
            return result;
        });
    }
    getRoom(userId, code) {
        return this.wrap(async () => {
            const snapshot = await this.game.getSnapshot(userId, code);
            if (!snapshot) {
                throw new common_1.HttpException({ code: 'NOT_A_MEMBER', message: 'Войдите в комнату' }, common_1.HttpStatus.NOT_FOUND);
            }
            return snapshot;
        });
    }
    removePlayer(userId, roomId, body) {
        return this.wrap(async () => {
            const result = await this.game.removeLobbyPlayer(userId, roomId, body.playerId);
            await this.afterRoomChange(roomId);
            return result;
        });
    }
    addMockPlayers(userId, roomId, body) {
        return this.wrap(async () => {
            const result = await this.mocks.addMockPlayers(userId, roomId, body?.count);
            await this.afterRoomChange(roomId);
            return result;
        });
    }
    runBots(userId, roomId) {
        return this.wrap(async () => {
            const result = await this.mocks.runBots(userId, roomId);
            await this.afterRoomChange(roomId);
            return result;
        });
    }
    start(userId, roomId) {
        return this.wrap(async () => {
            const result = await this.game.startGame(userId, roomId);
            await this.afterRoomChange(roomId);
            return result;
        });
    }
    reveal(userId, roomId, body) {
        return this.wrap(async () => {
            const result = await this.game.revealCharacteristic(userId, roomId, body.playerCharacteristicId);
            await this.afterRoomChange(roomId);
            return result;
        });
    }
    playAction(userId, roomId, body) {
        return this.wrap(async () => {
            const result = await this.game.playActionCard(userId, roomId, body);
            await this.afterRoomChange(roomId);
            return result;
        });
    }
    discussion(userId, roomId) {
        return this.wrap(async () => {
            const result = await this.game.beginPresentation(roomId, { hostUserId: userId });
            await this.afterRoomChange(roomId);
            return result;
        });
    }
    presentation(userId, roomId) {
        return this.wrap(async () => {
            const result = await this.game.beginPresentation(roomId, { hostUserId: userId });
            await this.afterRoomChange(roomId);
            return result;
        });
    }
    advancePresentation(userId, roomId) {
        return this.wrap(async () => {
            const result = await this.game.advancePresentation(roomId, { hostUserId: userId });
            await this.afterRoomChange(roomId);
            return result;
        });
    }
    pause(userId, roomId) {
        return this.wrap(async () => {
            const result = await this.game.setPaused(userId, roomId, true);
            await this.afterRoomChange(roomId);
            return result;
        });
    }
    resume(userId, roomId) {
        return this.wrap(async () => {
            const result = await this.game.setPaused(userId, roomId, false);
            await this.afterRoomChange(roomId);
            return result;
        });
    }
    startVoting(userId, roomId) {
        return this.wrap(async () => {
            const result = await this.game.startVoting(userId, roomId);
            await this.afterRoomChange(roomId);
            return result;
        });
    }
    submitVote(userId, roomId, body) {
        return this.wrap(async () => {
            const result = await this.game.submitVote(userId, roomId, body.targetPlayerId);
            await this.afterRoomChange(roomId);
            return result;
        });
    }
    completeVoting(userId, roomId) {
        return this.wrap(async () => {
            const result = await this.game.completeVoting(userId, roomId);
            await this.afterRoomChange(roomId);
            return result;
        });
    }
    nextRound(userId, roomId) {
        return this.wrap(async () => {
            const result = await this.game.nextRevealRound(userId, roomId);
            await this.afterRoomChange(roomId);
            return result;
        });
    }
    finish(userId, roomId) {
        return this.wrap(async () => {
            const result = await this.game.finishGame(userId, roomId);
            await this.afterRoomChange(roomId);
            return result;
        });
    }
};
exports.GameController = GameController;
__decorate([
    (0, common_1.Post)('rooms'),
    __param(0, (0, auth_service_1.CurrentUserId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], GameController.prototype, "createRoom", null);
__decorate([
    (0, common_1.Post)('rooms/join'),
    __param(0, (0, auth_service_1.CurrentUserId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], GameController.prototype, "joinRoom", null);
__decorate([
    (0, common_1.Get)('rooms/:code'),
    __param(0, (0, auth_service_1.CurrentUserId)()),
    __param(1, (0, common_1.Param)('code')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], GameController.prototype, "getRoom", null);
__decorate([
    (0, common_1.Post)('rooms/:roomId/remove-player'),
    __param(0, (0, auth_service_1.CurrentUserId)()),
    __param(1, (0, common_1.Param)('roomId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], GameController.prototype, "removePlayer", null);
__decorate([
    (0, common_1.Post)('rooms/:roomId/mock-players'),
    __param(0, (0, auth_service_1.CurrentUserId)()),
    __param(1, (0, common_1.Param)('roomId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], GameController.prototype, "addMockPlayers", null);
__decorate([
    (0, common_1.Post)('rooms/:roomId/bots/act'),
    __param(0, (0, auth_service_1.CurrentUserId)()),
    __param(1, (0, common_1.Param)('roomId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], GameController.prototype, "runBots", null);
__decorate([
    (0, common_1.Post)('rooms/:roomId/start'),
    __param(0, (0, auth_service_1.CurrentUserId)()),
    __param(1, (0, common_1.Param)('roomId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], GameController.prototype, "start", null);
__decorate([
    (0, common_1.Post)('rooms/:roomId/reveal'),
    __param(0, (0, auth_service_1.CurrentUserId)()),
    __param(1, (0, common_1.Param)('roomId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], GameController.prototype, "reveal", null);
__decorate([
    (0, common_1.Post)('rooms/:roomId/actions/play'),
    __param(0, (0, auth_service_1.CurrentUserId)()),
    __param(1, (0, common_1.Param)('roomId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], GameController.prototype, "playAction", null);
__decorate([
    (0, common_1.Post)('rooms/:roomId/discussion'),
    __param(0, (0, auth_service_1.CurrentUserId)()),
    __param(1, (0, common_1.Param)('roomId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], GameController.prototype, "discussion", null);
__decorate([
    (0, common_1.Post)('rooms/:roomId/presentation'),
    __param(0, (0, auth_service_1.CurrentUserId)()),
    __param(1, (0, common_1.Param)('roomId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], GameController.prototype, "presentation", null);
__decorate([
    (0, common_1.Post)('rooms/:roomId/presentation/advance'),
    __param(0, (0, auth_service_1.CurrentUserId)()),
    __param(1, (0, common_1.Param)('roomId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], GameController.prototype, "advancePresentation", null);
__decorate([
    (0, common_1.Post)('rooms/:roomId/pause'),
    __param(0, (0, auth_service_1.CurrentUserId)()),
    __param(1, (0, common_1.Param)('roomId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], GameController.prototype, "pause", null);
__decorate([
    (0, common_1.Post)('rooms/:roomId/resume'),
    __param(0, (0, auth_service_1.CurrentUserId)()),
    __param(1, (0, common_1.Param)('roomId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], GameController.prototype, "resume", null);
__decorate([
    (0, common_1.Post)('rooms/:roomId/voting/start'),
    __param(0, (0, auth_service_1.CurrentUserId)()),
    __param(1, (0, common_1.Param)('roomId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], GameController.prototype, "startVoting", null);
__decorate([
    (0, common_1.Post)('rooms/:roomId/voting/submit'),
    __param(0, (0, auth_service_1.CurrentUserId)()),
    __param(1, (0, common_1.Param)('roomId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], GameController.prototype, "submitVote", null);
__decorate([
    (0, common_1.Post)('rooms/:roomId/voting/complete'),
    __param(0, (0, auth_service_1.CurrentUserId)()),
    __param(1, (0, common_1.Param)('roomId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], GameController.prototype, "completeVoting", null);
__decorate([
    (0, common_1.Post)('rooms/:roomId/next-round'),
    __param(0, (0, auth_service_1.CurrentUserId)()),
    __param(1, (0, common_1.Param)('roomId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], GameController.prototype, "nextRound", null);
__decorate([
    (0, common_1.Post)('rooms/:roomId/finish'),
    __param(0, (0, auth_service_1.CurrentUserId)()),
    __param(1, (0, common_1.Param)('roomId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], GameController.prototype, "finish", null);
exports.GameController = GameController = __decorate([
    (0, common_1.Controller)(),
    (0, common_1.UseGuards)(auth_service_1.AuthGuard),
    __metadata("design:paramtypes", [game_service_1.GameService,
        mock_bots_service_1.MockBotsService,
        events_gateway_1.EventsGateway])
], GameController);
//# sourceMappingURL=game.controller.js.map