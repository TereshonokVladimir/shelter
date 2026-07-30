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
exports.EventsGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const auth_service_1 = require("../auth/auth.service");
let EventsGateway = class EventsGateway {
    auth;
    server;
    constructor(auth) {
        this.auth = auth;
    }
    async handleConnection(client) {
        try {
            const token = client.handshake.auth?.token ??
                (client.handshake.headers.authorization?.startsWith('Bearer ')
                    ? client.handshake.headers.authorization.slice(7)
                    : undefined);
            const userId = await this.auth.verify(token);
            client.data.userId = userId;
        }
        catch {
            client.disconnect();
        }
    }
    handleJoin(client, body) {
        if (!body?.code)
            return;
        const roomName = `room:${body.code.toUpperCase()}`;
        void client.join(roomName);
        return { ok: true, room: roomName };
    }
    emitRoomUpdated(code) {
        this.server.to(`room:${code.toUpperCase()}`).emit('room:updated', { code });
    }
};
exports.EventsGateway = EventsGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], EventsGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('room:join'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], EventsGateway.prototype, "handleJoin", null);
exports.EventsGateway = EventsGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: process.env.WEB_ORIGIN?.split(',') ?? ['http://localhost:3000'],
            credentials: true,
        },
    }),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], EventsGateway);
//# sourceMappingURL=events.gateway.js.map