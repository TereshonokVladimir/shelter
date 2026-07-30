import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { EventsGateway } from '../realtime/events.gateway';
import { GameService } from './game.service';
export declare class PhaseTimerService implements OnModuleInit, OnModuleDestroy {
    private readonly game;
    private readonly events;
    private interval?;
    private running;
    constructor(game: GameService, events: EventsGateway);
    onModuleInit(): void;
    onModuleDestroy(): void;
    private tick;
}
