import { Controller, Get } from '@nestjs/common'
import { isMockBotsEnabled } from '../game/mocks/mock-bots.config'

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      ok: true,
      mocks_enabled: isMockBotsEnabled(),
    }
  }
}
