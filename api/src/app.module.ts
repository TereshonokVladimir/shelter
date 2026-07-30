import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AuthModule } from './auth/auth.module'
import { ContentModule } from './content/content.module'
import { GameModule } from './game/game.module'
import { HealthController } from './health/health.controller'
import { PrismaModule } from './prisma/prisma.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    GameModule,
    ContentModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
