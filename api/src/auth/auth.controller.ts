import { Body, Controller, Headers, Post } from '@nestjs/common'
import { AuthService } from './auth.service'

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('anonymous')
  async anonymous(
    @Headers('authorization') authorization?: string,
    @Body() body?: { token?: string },
  ) {
    const bearer = authorization?.startsWith('Bearer ')
      ? authorization.slice(7)
      : undefined
    return this.auth.ensureAnonymous(body?.token ?? bearer)
  }
}
