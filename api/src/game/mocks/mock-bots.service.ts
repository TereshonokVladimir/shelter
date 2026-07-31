import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { ALWAYS_HIDDEN_COUNT, QUOTA_REVEAL_SOURCE, revealQuotaForRound } from '../game.rules'
import { GameException } from '../game.types'
import {
  isBotPlayerName,
  isMockBotsEnabled,
  MOCK_BOT_NAMES,
} from './mock-bots.config'

/**
 * Solo-test helpers. Delete `api/src/game/mocks/` + controller routes to remove from prod.
 */
@Injectable()
export class MockBotsService {
  constructor(private readonly prisma: PrismaService) {}

  assertEnabled() {
    if (!isMockBotsEnabled()) {
      throw new GameException('MOCKS_DISABLED')
    }
  }

  private async requireHost(roomId: string, userId: string) {
    const me = await this.prisma.player.findFirst({ where: { roomId, userId } })
    if (!me || me.role !== 'host') throw new GameException('FORBIDDEN_HOST_ONLY')
    return me
  }

  private parseJson<T>(raw: string, fallback: T): T {
    try {
      return JSON.parse(raw) as T
    } catch {
      return fallback
    }
  }

  async addMockPlayers(userId: string, roomId: string, count?: number) {
    this.assertEnabled()
    await this.requireHost(roomId, userId)

    return this.prisma.$transaction(async (tx) => {
      const room = await tx.room.findUniqueOrThrow({ where: { id: roomId } })
      if (room.status !== 'lobby') throw new GameException('INVALID_STATUS')

      const existing = await tx.player.findMany({ where: { roomId } })
      const activeCount = existing.filter((p) => p.status !== 'disconnected').length
      const freeSlots = Math.max(0, room.maxPlayers - activeCount)
      if (freeSlots === 0) throw new GameException('ROOM_FULL')

      const neededForMin = Math.max(0, 4 - activeCount)
      const toAdd = Math.min(freeSlots, count ?? Math.max(neededForMin, 3))
      if (toAdd <= 0) {
        return { added: 0, players: existing }
      }

      const usedNames = new Set(existing.map((p) => p.name))
      const created = []

      for (let i = 0; i < toAdd; i += 1) {
        const name =
          MOCK_BOT_NAMES.find((candidate) => !usedNames.has(candidate)) ??
          `Бот ${existing.length + i + 1}`
        usedNames.add(name)

        const user = await tx.user.create({ data: {} })
        const player = await tx.player.create({
          data: {
            roomId,
            userId: user.id,
            name,
            role: 'player',
            status: 'active',
            isReady: true,
            lastSeenAt: new Date(),
          },
        })
        created.push(player)

        await tx.gameEvent.create({
          data: {
            roomId,
            type: 'player_joined',
            payload: JSON.stringify({ player_id: player.id, name, mock: true }),
          },
        })
      }

      const players = await tx.player.findMany({
        where: { roomId },
        orderBy: { joinedAt: 'asc' },
      })

      return { added: created.length, players }
    })
  }

  /** Bots reveal up to round quota / cast votes so host can test alone. */
  async runBots(userId: string, roomId: string) {
    this.assertEnabled()
    await this.requireHost(roomId, userId)

    return this.prisma.$transaction(async (tx) => {
      const room = await tx.room.findUniqueOrThrow({ where: { id: roomId } })
      const bots = await tx.player.findMany({
        where: { roomId, status: 'active', role: 'player' },
      })
      const botPlayers = bots.filter((p) => isBotPlayerName(p.name))
      if (botPlayers.length === 0) {
        return { acted: 0, status: room.status }
      }

      let acted = 0

      if (
        room.status === 'reveal' ||
        room.status === 'presentation' ||
        room.status === 'discussion'
      ) {
        const storedPlan = (() => {
          try {
            const parsed = JSON.parse(room.revealQuotasJson ?? '[]') as unknown
            return Array.isArray(parsed) ? (parsed as number[]) : []
          } catch {
            return [] as number[]
          }
        })()
        const quota = revealQuotaForRound(
          room.currentRound,
          room.revealStrategy,
          room.plannedRounds,
          storedPlan,
        )
        const speakers =
          room.status === 'reveal'
            ? botPlayers
            : botPlayers.filter((b) => b.id === room.presentationPlayerId)

        if (quota > 0) {
          for (const bot of speakers) {
            let already = await tx.playerCharacteristic.count({
              where: {
                playerId: bot.id,
                isRevealed: true,
                revealedRound: room.currentRound,
                revealSource: QUOTA_REVEAL_SOURCE,
              },
            })

            while (already < quota) {
              const unrevealedCount = await tx.playerCharacteristic.count({
                where: { playerId: bot.id, isRevealed: false },
              })
              if (unrevealedCount <= ALWAYS_HIDDEN_COUNT) break

              const hidden = await tx.playerCharacteristic.findFirst({
                where: { playerId: bot.id, isRevealed: false },
              })
              if (!hidden) break

              await tx.playerCharacteristic.update({
                where: { id: hidden.id },
                data: {
                  isRevealed: true,
                  revealedRound: room.currentRound,
                  revealedAt: new Date(),
                  revealSource: QUOTA_REVEAL_SOURCE,
                },
              })
              await tx.gameEvent.create({
                data: {
                  roomId,
                  round: room.currentRound,
                  type: 'characteristic_revealed',
                  payload: JSON.stringify({
                    player_id: bot.id,
                    category: hidden.category,
                    player_characteristic_id: hidden.id,
                    mock: true,
                  }),
                },
              })
              already += 1
              acted += 1
            }
          }
        }
      }

      if (room.status === 'voting') {
        const candidates = this.parseJson<string[]>(room.votingCandidateIdsJson, [])
        const active = await tx.player.findMany({
          where: { roomId, status: 'active' },
        })
        const candidateIds =
          candidates.length > 0 ? candidates : active.map((p) => p.id)

        for (const bot of botPlayers) {
          const existingVote = await tx.vote.findUnique({
            where: {
              roomId_round_voterId: {
                roomId,
                round: room.currentRound,
                voterId: bot.id,
              },
            },
          })
          if (existingVote) continue

          const options = candidateIds.filter((id) => id !== bot.id)
          if (options.length === 0) continue
          const targetPlayerId = options[Math.floor(Math.random() * options.length)]

          await tx.vote.create({
            data: {
              roomId,
              round: room.currentRound,
              voterId: bot.id,
              targetPlayerId,
            },
          })
          acted += 1
        }

        if (acted > 0) {
          const cast = await tx.vote.count({
            where: { roomId, round: room.currentRound },
          })
          await tx.gameEvent.create({
            data: {
              roomId,
              round: room.currentRound,
              type: 'vote_submitted',
              payload: JSON.stringify({
                mock: true,
                progress_cast: cast,
                progress_total: active.length,
              }),
            },
          })
        }
      }

      return { acted, status: room.status }
    })
  }
}
