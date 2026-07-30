import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  forwardRef,
} from '@nestjs/common'
import { EventsGateway } from '../realtime/events.gateway'
import { GameService } from './game.service'

@Injectable()
export class PhaseTimerService implements OnModuleInit, OnModuleDestroy {
  private interval?: ReturnType<typeof setInterval>
  private running = false

  constructor(
    @Inject(forwardRef(() => GameService))
    private readonly game: GameService,
    private readonly events: EventsGateway,
  ) {}

  onModuleInit() {
    this.interval = setInterval(() => {
      void this.tick()
    }, 1000)
  }

  onModuleDestroy() {
    if (this.interval) clearInterval(this.interval)
  }

  private async tick() {
    if (this.running) return
    this.running = true
    try {
      const codes = await this.game.processDuePhases()
      for (const code of codes) {
        this.events.emitRoomUpdated(code)
      }
    } catch {
      // keep ticker alive on transient DB errors
    } finally {
      this.running = false
    }
  }
}
