import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common'
import { AuthGuard, CurrentUserId } from '../auth/auth.service'
import { GameService } from './game.service'
import { GameException } from './game.types'
import {
  DEFAULT_PRESENTATION_SEC,
  DEFAULT_REVEAL_SEC,
  DEFAULT_VOTING_SEC,
} from './game.rules'
import { EventsGateway } from '../realtime/events.gateway'
import { MockBotsService } from './mocks/mock-bots.service'

@Controller()
@UseGuards(AuthGuard)
export class GameController {
  constructor(
    private readonly game: GameService,
    private readonly mocks: MockBotsService,
    private readonly events: EventsGateway,
  ) {}

  private wrap<T>(fn: () => Promise<T>): Promise<T> {
    return fn().catch((error: unknown) => {
      if (error instanceof GameException) {
        throw new HttpException({ code: error.code, message: error.message }, HttpStatus.BAD_REQUEST)
      }
      throw error
    })
  }

  private async afterRoomChange(roomId: string, code?: string) {
    const roomCode = code ?? (await this.game.getRoomCode(roomId))
    if (roomCode) this.events.emitRoomUpdated(roomCode)
  }

  @Post('rooms')
  createRoom(
    @CurrentUserId() userId: string,
    @Body()
    body: {
      name: string
      maxPlayers?: number
      presentationDurationSec?: number
      votingDurationSec?: number
      revealDurationSec?: number
      packageId?: string
      /** @deprecated prefer presentationDurationSec */
      discussionDurationSec?: number
    },
  ) {
    return this.wrap(async () => {
      let packageId = body.packageId
      if (!packageId) {
        const classic = await this.game.resolveDefaultPackageId()
        packageId = classic
      }
      const result = await this.game.createRoom(userId, {
        name: body.name,
        maxPlayers: body.maxPlayers ?? 8,
        presentationDurationSec:
          body.presentationDurationSec ??
          body.discussionDurationSec ??
          DEFAULT_PRESENTATION_SEC,
        votingDurationSec: body.votingDurationSec ?? DEFAULT_VOTING_SEC,
        revealDurationSec: body.revealDurationSec ?? DEFAULT_REVEAL_SEC,
        packageId,
      })
      this.events.emitRoomUpdated(result.room.code)
      return result
    })
  }

  @Post('rooms/join')
  joinRoom(
    @CurrentUserId() userId: string,
    @Body() body: { code: string; name: string },
  ) {
    return this.wrap(async () => {
      const result = await this.game.joinRoom(userId, body)
      this.events.emitRoomUpdated(result.room.code)
      return result
    })
  }

  @Get('rooms/:code')
  getRoom(@CurrentUserId() userId: string, @Param('code') code: string) {
    return this.wrap(async () => {
      const snapshot = await this.game.getSnapshot(userId, code)
      if (!snapshot) {
        throw new HttpException(
          { code: 'NOT_A_MEMBER', message: 'Войдите в комнату' },
          HttpStatus.NOT_FOUND,
        )
      }
      return snapshot
    })
  }

  @Post('rooms/:roomId/remove-player')
  removePlayer(
    @CurrentUserId() userId: string,
    @Param('roomId') roomId: string,
    @Body() body: { playerId: string },
  ) {
    return this.wrap(async () => {
      const result = await this.game.removeLobbyPlayer(userId, roomId, body.playerId)
      await this.afterRoomChange(roomId)
      return result
    })
  }

  /** DEV: strip MockBotsService + these routes for production if unused. */
  @Post('rooms/:roomId/mock-players')
  addMockPlayers(
    @CurrentUserId() userId: string,
    @Param('roomId') roomId: string,
    @Body() body?: { count?: number },
  ) {
    return this.wrap(async () => {
      const result = await this.mocks.addMockPlayers(userId, roomId, body?.count)
      await this.afterRoomChange(roomId)
      return result
    })
  }

  /** DEV: bots reveal / vote for solo testing. */
  @Post('rooms/:roomId/bots/act')
  runBots(@CurrentUserId() userId: string, @Param('roomId') roomId: string) {
    return this.wrap(async () => {
      const result = await this.mocks.runBots(userId, roomId)
      await this.afterRoomChange(roomId)
      return result
    })
  }

  @Post('rooms/:roomId/start')
  start(@CurrentUserId() userId: string, @Param('roomId') roomId: string) {
    return this.wrap(async () => {
      const result = await this.game.startGame(userId, roomId)
      await this.afterRoomChange(roomId)
      return result
    })
  }

  @Post('rooms/:roomId/reveal')
  reveal(
    @CurrentUserId() userId: string,
    @Param('roomId') roomId: string,
    @Body() body: { playerCharacteristicId: string },
  ) {
    return this.wrap(async () => {
      const result = await this.game.revealCharacteristic(
        userId,
        roomId,
        body.playerCharacteristicId,
      )
      await this.afterRoomChange(roomId)
      return result
    })
  }

  @Post('rooms/:roomId/actions/play')
  playAction(
    @CurrentUserId() userId: string,
    @Param('roomId') roomId: string,
    @Body()
    body: {
      playerActionCardId: string
      category?: string
      targetPlayerId?: string
    },
  ) {
    return this.wrap(async () => {
      const result = await this.game.playActionCard(userId, roomId, body)
      await this.afterRoomChange(roomId)
      return result
    })
  }

  /** Host: start presentations (legacy path name `discussion`). */
  @Post('rooms/:roomId/discussion')
  discussion(@CurrentUserId() userId: string, @Param('roomId') roomId: string) {
    return this.wrap(async () => {
      const result = await this.game.beginPresentation(roomId, { hostUserId: userId })
      await this.afterRoomChange(roomId)
      return result
    })
  }

  @Post('rooms/:roomId/presentation')
  presentation(@CurrentUserId() userId: string, @Param('roomId') roomId: string) {
    return this.wrap(async () => {
      const result = await this.game.beginPresentation(roomId, { hostUserId: userId })
      await this.afterRoomChange(roomId)
      return result
    })
  }

  /** Host: skip current speaker / end presentations early when last. */
  @Post('rooms/:roomId/presentation/advance')
  advancePresentation(@CurrentUserId() userId: string, @Param('roomId') roomId: string) {
    return this.wrap(async () => {
      const result = await this.game.advancePresentation(roomId, { hostUserId: userId })
      await this.afterRoomChange(roomId)
      return result
    })
  }

  @Post('rooms/:roomId/pause')
  pause(@CurrentUserId() userId: string, @Param('roomId') roomId: string) {
    return this.wrap(async () => {
      const result = await this.game.setPaused(userId, roomId, true)
      await this.afterRoomChange(roomId)
      return result
    })
  }

  @Post('rooms/:roomId/resume')
  resume(@CurrentUserId() userId: string, @Param('roomId') roomId: string) {
    return this.wrap(async () => {
      const result = await this.game.setPaused(userId, roomId, false)
      await this.afterRoomChange(roomId)
      return result
    })
  }

  @Post('rooms/:roomId/voting/start')
  startVoting(@CurrentUserId() userId: string, @Param('roomId') roomId: string) {
    return this.wrap(async () => {
      const result = await this.game.startVoting(userId, roomId)
      await this.afterRoomChange(roomId)
      return result
    })
  }

  @Post('rooms/:roomId/voting/submit')
  submitVote(
    @CurrentUserId() userId: string,
    @Param('roomId') roomId: string,
    @Body() body: { targetPlayerId: string },
  ) {
    return this.wrap(async () => {
      const result = await this.game.submitVote(userId, roomId, body.targetPlayerId)
      await this.afterRoomChange(roomId)
      return result
    })
  }

  @Post('rooms/:roomId/voting/complete')
  completeVoting(@CurrentUserId() userId: string, @Param('roomId') roomId: string) {
    return this.wrap(async () => {
      const result = await this.game.completeVoting(userId, roomId)
      await this.afterRoomChange(roomId)
      return result
    })
  }

  @Post('rooms/:roomId/next-round')
  nextRound(@CurrentUserId() userId: string, @Param('roomId') roomId: string) {
    return this.wrap(async () => {
      const result = await this.game.nextRevealRound(userId, roomId)
      await this.afterRoomChange(roomId)
      return result
    })
  }

  @Post('rooms/:roomId/finish')
  finish(@CurrentUserId() userId: string, @Param('roomId') roomId: string) {
    return this.wrap(async () => {
      const result = await this.game.finishGame(userId, roomId)
      await this.afterRoomChange(roomId)
      return result
    })
  }
}
