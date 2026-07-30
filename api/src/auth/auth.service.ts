import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  createParamDecorator,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Request } from 'express'
import { PrismaService } from '../prisma/prisma.service'

export type AuthUser = { userId: string }

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async ensureAnonymous(existingToken?: string): Promise<{ token: string; userId: string }> {
    if (existingToken) {
      try {
        const payload = await this.jwt.verifyAsync<{ sub: string }>(existingToken)
        const user = await this.prisma.user.findUnique({ where: { id: payload.sub } })
        if (user) {
          return { token: existingToken, userId: user.id }
        }
      } catch {
        // create new
      }
    }

    const user = await this.prisma.user.create({ data: {} })
    const token = await this.jwt.signAsync({ sub: user.id })
    return { token, userId: user.id }
  }

  async verify(token?: string): Promise<string> {
    if (!token) throw new UnauthorizedException('UNAUTHORIZED')
    try {
      const payload = await this.jwt.verifyAsync<{ sub: string }>(token)
      return payload.sub
    } catch {
      throw new UnauthorizedException('UNAUTHORIZED')
    }
  }
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request & { userId?: string }>()
    const header = req.headers.authorization
    const bearer = header?.startsWith('Bearer ') ? header.slice(7) : undefined
    const cookieToken = (req as Request & { cookies?: Record<string, string> }).cookies?.ls_token
    const userId = await this.auth.verify(bearer ?? cookieToken)
    req.userId = userId
    return true
  }
}

export const CurrentUserId = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const req = ctx.switchToHttp().getRequest<{ userId?: string }>()
  return req.userId
})
