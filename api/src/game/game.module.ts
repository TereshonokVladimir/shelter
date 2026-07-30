import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { EventsGateway } from '../realtime/events.gateway'
import { GameController } from './game.controller'
import { GameService } from './game.service'
import { PhaseTimerService } from './phase-timer.service'
import { MockBotsService } from './mocks/mock-bots.service'

@Module({
  imports: [AuthModule],
  controllers: [GameController],
  providers: [GameService, MockBotsService, EventsGateway, PhaseTimerService],
  exports: [GameService, EventsGateway],
})
export class GameModule {}
