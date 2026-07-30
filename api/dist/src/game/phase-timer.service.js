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
exports.PhaseTimerService = void 0;
const common_1 = require("@nestjs/common");
const events_gateway_1 = require("../realtime/events.gateway");
const game_service_1 = require("./game.service");
let PhaseTimerService = class PhaseTimerService {
    game;
    events;
    interval;
    running = false;
    constructor(game, events) {
        this.game = game;
        this.events = events;
    }
    onModuleInit() {
        this.interval = setInterval(() => {
            void this.tick();
        }, 1000);
    }
    onModuleDestroy() {
        if (this.interval)
            clearInterval(this.interval);
    }
    async tick() {
        if (this.running)
            return;
        this.running = true;
        try {
            const codes = await this.game.processDuePhases();
            for (const code of codes) {
                this.events.emitRoomUpdated(code);
            }
        }
        catch {
        }
        finally {
            this.running = false;
        }
    }
};
exports.PhaseTimerService = PhaseTimerService;
exports.PhaseTimerService = PhaseTimerService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)((0, common_1.forwardRef)(() => game_service_1.GameService))),
    __metadata("design:paramtypes", [game_service_1.GameService,
        events_gateway_1.EventsGateway])
], PhaseTimerService);
//# sourceMappingURL=phase-timer.service.js.map