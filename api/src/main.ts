import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { ConfigService } from '@nestjs/config'
import cookieParser from 'cookie-parser'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const config = app.get(ConfigService)
  const origin = config.get<string>('WEB_ORIGIN') ?? 'http://localhost:3000'

  app.use(cookieParser())
  app.enableCors({
    origin: origin.split(','),
    credentials: true,
  })
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  )
  app.setGlobalPrefix('api')

  const port = Number(config.get<string>('PORT') ?? 4000)
  await app.listen(port)
  console.log(`Last Shelter API listening on http://localhost:${port}`)
}

void bootstrap()
