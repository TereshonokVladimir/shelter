import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import {
  ALWAYS_HIDDEN_COUNT,
  DEFAULT_PRESENTATION_SEC,
  DEFAULT_REVEAL_SEC,
  DEFAULT_VOTING_SEC,
  MAX_PRESENTATION_SEC,
  MAX_REVEAL_SEC,
  MAX_VOTING_SEC,
  MIN_PRESENTATION_SEC,
  MIN_REVEAL_SEC,
  MIN_VOTING_SEC,
  VOTE_RESULT_AUTO_SEC,
  revealQuotaForRound,
} from './game.rules'
import {
  CHARACTERISTIC_CATEGORIES,
  CharacteristicCategory,
  GameException,
  GameStatus,
  calculateShelterCapacity,
  generateRoomCode,
  isPresentationStatus,
  normalizeGameStatus,
  normalizeRoomCode,
  shuffle,
} from './game.types'
import { isMockBotsEnabled } from './mocks/mock-bots.config'
import {
  computeSurvivalChance,
  emptyRarityCounts,
  normalizeRarity,
  pickWeightedByRarity,
  RARITY_SCORE,
  type PlayerFinishStat,
  type TraitRarity,
} from './game.rarity'

@Injectable()
export class GameService {
  constructor(private readonly prisma: PrismaService) {}

  private parseJson<T>(value: string, fallback: T): T {
    try {
      return JSON.parse(value) as T
    } catch {
      return fallback
    }
  }

  private assertNotPaused(room: { pausedAt: Date | null }) {
    if (room.pausedAt) throw new GameException('GAME_PAUSED')
  }

  private async requireHost(roomId: string, userId: string) {
    const host = await this.prisma.player.findFirst({
      where: { roomId, userId, role: 'host' },
    })
    if (!host) throw new GameException('FORBIDDEN_HOST_ONLY')
    return host
  }

  private async addEvent(
    roomId: string,
    type: string,
    payload: Record<string, unknown> = {},
    round?: number | null,
  ) {
    await this.prisma.gameEvent.create({
      data: {
        roomId,
        type,
        round: round ?? null,
        payload: JSON.stringify(payload),
      },
    })
  }

  private voteResultEndsAt() {
    return new Date(Date.now() + VOTE_RESULT_AUTO_SEC * 1000)
  }

  async resolveDefaultPackageId() {
    const pack = await this.prisma.contentPackage.findFirst({
      where: { OR: [{ slug: 'classic' }, { isBuiltin: true }], isActive: true },
      orderBy: { sortOrder: 'asc' },
    })
    if (!pack) throw new GameException('CONTENT_MISSING')
    return pack.id
  }

  async createRoom(
    userId: string,
    input: {
      name: string
      maxPlayers: number
      presentationDurationSec: number
      votingDurationSec: number
      revealDurationSec?: number
      packageId: string
    },
  ) {
    const name = input.name.trim()
    if (name.length < 2 || name.length > 24) throw new GameException('INVALID_NAME')
    if (input.maxPlayers < 4 || input.maxPlayers > 12) throw new GameException('INVALID_MAX_PLAYERS')

    const presentationDurationSec =
      input.presentationDurationSec ?? DEFAULT_PRESENTATION_SEC
    const votingDurationSec = input.votingDurationSec ?? DEFAULT_VOTING_SEC
    const revealDurationSec = input.revealDurationSec ?? DEFAULT_REVEAL_SEC

    if (
      presentationDurationSec < MIN_PRESENTATION_SEC ||
      presentationDurationSec > MAX_PRESENTATION_SEC
    ) {
      throw new GameException('INVALID_PRESENTATION_DURATION')
    }
    if (votingDurationSec < MIN_VOTING_SEC || votingDurationSec > MAX_VOTING_SEC) {
      throw new GameException('INVALID_VOTING_DURATION')
    }
    if (revealDurationSec < MIN_REVEAL_SEC || revealDurationSec > MAX_REVEAL_SEC) {
      throw new GameException('INVALID_REVEAL_DURATION')
    }

    const contentPack = await this.prisma.contentPackage.findFirst({
      where: { id: input.packageId, isActive: true },
    })
    if (!contentPack) throw new GameException('CONTENT_MISSING')

    for (let attempt = 0; attempt < 20; attempt += 1) {
      const code = generateRoomCode()
      try {
        const result = await this.prisma.$transaction(async (tx) => {
          const room = await tx.room.create({
            data: {
              code,
              maxPlayers: input.maxPlayers,
              presentationDurationSec,
              votingDurationSec,
              revealDurationSec,
              packageId: contentPack.id,
              discussionDurationSec: presentationDurationSec,
            },
          })
          const player = await tx.player.create({
            data: {
              roomId: room.id,
              userId,
              name,
              role: 'host',
              status: 'active',
              lastSeenAt: new Date(),
            },
          })
          const updated = await tx.room.update({
            where: { id: room.id },
            data: { hostPlayerId: player.id },
          })
          await tx.gameEvent.create({
            data: {
              roomId: room.id,
              type: 'room_created',
              payload: JSON.stringify({
                host_player_id: player.id,
                package_id: contentPack.id,
              }),
            },
          })
          return { room: updated, player }
        })
        return result
      } catch {
        // retry on unique code collision
      }
    }
    throw new GameException('ROOM_NOT_FOUND')
  }

  async joinRoom(userId: string, input: { code: string; name: string }) {
    const name = input.name.trim()
    if (name.length < 2 || name.length > 24) throw new GameException('INVALID_NAME')
    const code = normalizeRoomCode(input.code)
    if (code.length < 4 || code.length > 8) throw new GameException('ROOM_NOT_FOUND')

    return this.prisma.$transaction(async (tx) => {
      const room = await tx.room.findUnique({ where: { code } })
      if (!room) throw new GameException('ROOM_NOT_FOUND')

      const existing = await tx.player.findUnique({
        where: { roomId_userId: { roomId: room.id, userId } },
      })

      if (existing) {
        const player = await tx.player.update({
          where: { id: existing.id },
          data: {
            lastSeenAt: new Date(),
            name: room.status === 'lobby' ? name : existing.name,
            status:
              existing.status === 'disconnected' && !existing.eliminatedAt
                ? 'active'
                : existing.status,
          },
        })
        return { room, player, rejoined: true }
      }

      if (room.status !== 'lobby') throw new GameException('ROOM_NOT_JOINABLE')

      const count = await tx.player.count({
        where: { roomId: room.id, status: { not: 'disconnected' } },
      })
      if (count >= room.maxPlayers) throw new GameException('ROOM_FULL')

      const player = await tx.player.create({
        data: {
          roomId: room.id,
          userId,
          name,
          role: 'player',
          status: 'active',
          lastSeenAt: new Date(),
        },
      })

      await tx.gameEvent.create({
        data: {
          roomId: room.id,
          type: 'player_joined',
          payload: JSON.stringify({ player_id: player.id, name: player.name }),
        },
      })

      return { room, player, rejoined: false }
    })
  }

  async removeLobbyPlayer(userId: string, roomId: string, playerId: string) {
    await this.requireHost(roomId, userId)
    return this.prisma.$transaction(async (tx) => {
      const room = await tx.room.findUniqueOrThrow({ where: { id: roomId } })
      if (room.status !== 'lobby') throw new GameException('INVALID_STATUS')
      const target = await tx.player.findFirst({ where: { id: playerId, roomId } })
      if (!target) throw new GameException('PLAYER_NOT_FOUND')
      if (target.role === 'host') throw new GameException('CANNOT_REMOVE_HOST')
      await tx.player.delete({ where: { id: target.id } })
      await tx.gameEvent.create({
        data: {
          roomId,
          type: 'player_removed',
          payload: JSON.stringify({ player_id: playerId }),
        },
      })
      return { ok: true }
    })
  }

  async startGame(userId: string, roomId: string) {
    await this.requireHost(roomId, userId)

    return this.prisma.$transaction(async (tx) => {
      const room = await tx.room.findUniqueOrThrow({ where: { id: roomId } })
      if (room.status !== 'lobby') {
        if (
          [
            'reveal',
            'presentation',
            'discussion',
            'voting',
            'vote_result',
            'finished',
          ].includes(room.status)
        ) {
          return { room, already_started: true }
        }
        throw new GameException('INVALID_STATUS')
      }

      const players = await tx.player.findMany({
        where: { roomId, status: 'active' },
      })
      if (players.length < 4) throw new GameException('NOT_ENOUGH_PLAYERS')

      const packageId =
        room.packageId ??
        (
          await tx.contentPackage.findFirst({
            where: { slug: 'classic', isActive: true },
          })
        )?.id
      if (!packageId) throw new GameException('CONTENT_MISSING')

      const disasters = await tx.disaster.findMany({
        where: { isActive: true, packageId },
      })
      const bunkers = await tx.bunker.findMany({
        where: { isActive: true, packageId },
      })
      if (!disasters.length || !bunkers.length) throw new GameException('CONTENT_MISSING')

      const disaster = shuffle(disasters)[0]
      const bunker = shuffle(bunkers)[0]
      const capacity = calculateShelterCapacity(players.length)

      for (const category of CHARACTERISTIC_CATEGORIES) {
        const pool = await tx.characteristic.findMany({
          where: { isActive: true, category, packageId },
        })
        if (pool.length < players.length) throw new GameException('NOT_ENOUGH_CHARACTERISTICS')

        const dealt = pickWeightedByRarity(pool, players.length)
        for (let i = 0; i < players.length; i += 1) {
          const characteristic = dealt[i]
          await tx.playerCharacteristic.create({
            data: {
              roomId,
              playerId: players[i].id,
              characteristicId: characteristic.id,
              category,
              isRevealed: false,
            },
          })
        }
      }

      const actionPool = await tx.actionCard.findMany({
        where: { isActive: true, packageId },
      })
      if (!actionPool.length) throw new GameException('NOT_ENOUGH_ACTIONS')
      const dealtActions = shuffle(
        Array.from({ length: players.length }, (_, i) => actionPool[i % actionPool.length]),
      )
      for (let i = 0; i < players.length; i += 1) {
        await tx.playerActionCard.create({
          data: {
            roomId,
            playerId: players[i].id,
            actionCardId: dealtActions[i].id,
            isUsed: false,
          },
        })
      }

      const phaseEndsAt = new Date(Date.now() + room.revealDurationSec * 1000)

      const updated = await tx.room.update({
        where: { id: roomId },
        data: {
          status: 'reveal',
          currentRound: 1,
          shelterCapacity: capacity,
          packageId,
          disasterId: disaster.id,
          bunkerId: bunker.id,
          phaseEndsAt,
          presentationPlayerId: null,
          presentationOrderJson: '[]',
          pausedAt: null,
          pauseRemainingMs: null,
          votingCandidateIdsJson: '[]',
          lastVoteSummaryJson: '{}',
        },
      })

      await tx.gameEvent.create({
        data: {
          roomId,
          round: 1,
          type: 'game_started',
          payload: JSON.stringify({
            disaster_id: disaster.id,
            bunker_id: bunker.id,
            package_id: packageId,
            shelter_capacity: capacity,
            player_count: players.length,
            phase_ends_at: phaseEndsAt,
          }),
        },
      })

      return { room: updated, disaster, bunker }
    })
  }

  private async allActiveMetRevealQuota(
    roomId: string,
    currentRound: number,
    quota: number,
  ): Promise<boolean> {
    if (quota <= 0) return true
    const active = await this.prisma.player.findMany({
      where: { roomId, status: 'active' },
      select: { id: true },
    })
    for (const player of active) {
      const revealed = await this.prisma.playerCharacteristic.count({
        where: {
          playerId: player.id,
          isRevealed: true,
          revealedRound: currentRound,
        },
      })
      if (revealed < quota) return false
    }
    return true
  }

  async revealCharacteristic(userId: string, roomId: string, playerCharacteristicId: string) {
    let currentRound = 0
    let shouldCheckQuota = false

    const result = await this.prisma.$transaction(async (tx) => {
      const room = await tx.room.findUniqueOrThrow({ where: { id: roomId } })
      if (room.status !== 'reveal') throw new GameException('INVALID_STATUS')
      this.assertNotPaused(room)

      const quota = revealQuotaForRound(room.currentRound)
      if (quota <= 0) throw new GameException('INVALID_STATUS')

      const me = await tx.player.findFirst({
        where: { roomId, userId, status: 'active' },
      })
      if (!me) throw new GameException('PLAYER_NOT_ACTIVE')

      const pc = await tx.playerCharacteristic.findFirst({
        where: { id: playerCharacteristicId, roomId },
      })
      if (!pc) throw new GameException('PLAYER_NOT_FOUND')
      if (pc.playerId !== me.id) throw new GameException('FORBIDDEN_OWN_ONLY')
      if (pc.isRevealed) {
        return { player_characteristic: pc, already_revealed: true as const }
      }

      const already = await tx.playerCharacteristic.count({
        where: {
          playerId: me.id,
          isRevealed: true,
          revealedRound: room.currentRound,
        },
      })
      if (already >= quota) throw new GameException('REVEAL_LIMIT_REACHED')

      const unrevealed = await tx.playerCharacteristic.count({
        where: { playerId: me.id, isRevealed: false },
      })
      if (unrevealed <= ALWAYS_HIDDEN_COUNT) {
        throw new GameException('REVEAL_LIMIT_REACHED')
      }

      const updated = await tx.playerCharacteristic.update({
        where: { id: pc.id },
        data: {
          isRevealed: true,
          revealedRound: room.currentRound,
          revealedAt: new Date(),
        },
      })

      await tx.gameEvent.create({
        data: {
          roomId,
          round: room.currentRound,
          type: 'characteristic_revealed',
          payload: JSON.stringify({
            player_id: me.id,
            category: updated.category,
            player_characteristic_id: updated.id,
          }),
        },
      })

      currentRound = room.currentRound
      shouldCheckQuota = true
      return { player_characteristic: updated }
    })

    if (shouldCheckQuota) {
      const quota = revealQuotaForRound(currentRound)
      const allDone = await this.allActiveMetRevealQuota(roomId, currentRound, quota)
      if (allDone) {
        await this.beginPresentation(roomId)
      }
    }

    return result
  }

  async playActionCard(
    userId: string,
    roomId: string,
    input: {
      playerActionCardId: string
      category?: string
      targetPlayerId?: string
    },
  ) {
    return this.prisma.$transaction(async (tx) => {
      const room = await tx.room.findUniqueOrThrow({ where: { id: roomId } })
      if (!['reveal', 'presentation', 'discussion'].includes(room.status)) {
        throw new GameException('INVALID_STATUS')
      }
      this.assertNotPaused(room)

      const me = await tx.player.findFirst({
        where: { roomId, userId, status: 'active' },
      })
      if (!me) throw new GameException('PLAYER_NOT_ACTIVE')

      const pac = await tx.playerActionCard.findFirst({
        where: { id: input.playerActionCardId, roomId },
        include: { actionCard: true },
      })
      if (!pac) throw new GameException('PLAYER_NOT_FOUND')
      if (pac.playerId !== me.id) throw new GameException('FORBIDDEN_OWN_ONLY')
      if (pac.isUsed) throw new GameException('ACTION_ALREADY_USED')

      const effect = pac.actionCard.effectType
      let summary: Record<string, unknown> = {
        effect_type: effect,
        action_title: pac.actionCard.title,
      }

      if (effect === 'swap_characteristic') {
        const category = input.category
        const targetPlayerId = input.targetPlayerId
        if (!category || !CHARACTERISTIC_CATEGORIES.includes(category as never)) {
          throw new GameException('ACTION_INVALID')
        }
        if (!targetPlayerId || targetPlayerId === me.id) {
          throw new GameException('INVALID_TARGET')
        }
        const target = await tx.player.findFirst({
          where: { id: targetPlayerId, roomId, status: 'active' },
        })
        if (!target) throw new GameException('INVALID_TARGET')

        const mine = await tx.playerCharacteristic.findFirst({
          where: { playerId: me.id, category },
          include: { characteristic: true },
        })
        const theirs = await tx.playerCharacteristic.findFirst({
          where: { playerId: target.id, category },
          include: { characteristic: true },
        })
        if (!mine || !theirs) throw new GameException('ACTION_INVALID')

        // Break unique(playerId, characteristicId) during swap via temp ids if needed —
        // swap fields in two steps using a placeholder from the other's id first.
        await tx.playerCharacteristic.update({
          where: { id: mine.id },
          data: {
            characteristicId: theirs.characteristicId,
            isRevealed: theirs.isRevealed,
            revealedRound: theirs.revealedRound,
            revealedAt: theirs.revealedAt,
          },
        })
        await tx.playerCharacteristic.update({
          where: { id: theirs.id },
          data: {
            characteristicId: mine.characteristicId,
            isRevealed: mine.isRevealed,
            revealedRound: mine.revealedRound,
            revealedAt: mine.revealedAt,
          },
        })

        summary = {
          ...summary,
          category,
          target_player_id: target.id,
          my_new_title: theirs.characteristic.title,
          their_new_title: mine.characteristic.title,
        }
      } else if (effect === 'reroll_characteristic') {
        const category = input.category
        if (!category || !CHARACTERISTIC_CATEGORIES.includes(category as never)) {
          throw new GameException('ACTION_INVALID')
        }
        const mine = await tx.playerCharacteristic.findFirst({
          where: { playerId: me.id, category },
        })
        if (!mine) throw new GameException('ACTION_INVALID')
        if (!room.packageId) throw new GameException('CONTENT_MISSING')

        const usedIds = (
          await tx.playerCharacteristic.findMany({
            where: { roomId, category },
            select: { characteristicId: true },
          })
        ).map((r) => r.characteristicId)

        const pool = await tx.characteristic.findMany({
            where: {
              packageId: room.packageId,
              category,
              isActive: true,
              id: { notIn: usedIds },
            },
          })
        if (!pool.length) throw new GameException('NOT_ENOUGH_CHARACTERISTICS')
        const next = pickWeightedByRarity(pool, 1)[0]
        await tx.playerCharacteristic.update({
          where: { id: mine.id },
          data: {
            characteristicId: next.id,
            isRevealed: false,
            revealedRound: null,
            revealedAt: null,
          },
        })
        summary = {
          ...summary,
          category,
          new_title: next.title,
        }
      } else if (effect === 'force_reveal') {
        const targetPlayerId = input.targetPlayerId
        if (!targetPlayerId || targetPlayerId === me.id) {
          throw new GameException('INVALID_TARGET')
        }
        const target = await tx.player.findFirst({
          where: { id: targetPlayerId, roomId, status: 'active' },
        })
        if (!target) throw new GameException('INVALID_TARGET')

        const hidden = shuffle(
          await tx.playerCharacteristic.findMany({
            where: { playerId: target.id, isRevealed: false },
            include: { characteristic: true },
          }),
        )
        if (!hidden.length) throw new GameException('ACTION_INVALID')
        const pick = hidden[0]
        await tx.playerCharacteristic.update({
          where: { id: pick.id },
          data: {
            isRevealed: true,
            revealedRound: room.currentRound,
            revealedAt: new Date(),
          },
        })
        summary = {
          ...summary,
          target_player_id: target.id,
          category: pick.category,
          revealed_title: pick.characteristic.title,
        }
      } else {
        throw new GameException('ACTION_INVALID')
      }

      await tx.playerActionCard.update({
        where: { id: pac.id },
        data: {
          isUsed: true,
          usedAt: new Date(),
          usedRound: room.currentRound,
        },
      })

      await tx.gameEvent.create({
        data: {
          roomId,
          round: room.currentRound,
          type: 'action_played',
          payload: JSON.stringify({
            player_id: me.id,
            player_action_card_id: pac.id,
            ...summary,
          }),
        },
      })

      return { ok: true, summary }
    })
  }

  async beginPresentation(roomId: string, opts?: { hostUserId?: string }) {
    if (opts?.hostUserId) {
      await this.requireHost(roomId, opts.hostUserId)
    }

    const room = await this.prisma.room.findUniqueOrThrow({ where: { id: roomId } })
    this.assertNotPaused(room)

    if (isPresentationStatus(room.status)) {
      return { room, already: true }
    }

    const allowed =
      room.status === 'reveal' ||
      (room.status === 'vote_result' &&
        this.parseJson<{ tie?: boolean }>(room.lastVoteSummaryJson, {}).tie === true)

    if (!allowed) throw new GameException('INVALID_STATUS')

    const active = await this.prisma.player.findMany({
      where: { roomId, status: 'active' },
      orderBy: { joinedAt: 'asc' },
    })
    if (active.length === 0) throw new GameException('INVALID_STATUS')

    const order = active.map((p) => p.id)
    const first = order[0]
    const phaseEndsAt = new Date(Date.now() + room.presentationDurationSec * 1000)

    const updated = await this.prisma.room.update({
      where: { id: roomId },
      data: {
        status: 'presentation',
        presentationPlayerId: first,
        presentationOrderJson: JSON.stringify(order),
        phaseEndsAt,
      },
    })

    await this.addEvent(
      roomId,
      'presentation_started',
      {
        presentation_player_id: first,
        presentation_order: order,
        phase_ends_at: phaseEndsAt,
      },
      updated.currentRound,
    )

    return { room: updated }
  }

  /** @deprecated host route still named discussion — delegates to presentation */
  async advanceToDiscussion(userId: string, roomId: string) {
    return this.beginPresentation(roomId, { hostUserId: userId })
  }

  async advancePresentation(roomId: string, opts?: { hostUserId?: string }) {
    if (opts?.hostUserId) {
      await this.requireHost(roomId, opts.hostUserId)
    }

    const room = await this.prisma.room.findUniqueOrThrow({ where: { id: roomId } })
    if (!isPresentationStatus(room.status)) throw new GameException('INVALID_STATUS')
    this.assertNotPaused(room)

    const order = this.parseJson<string[]>(room.presentationOrderJson, [])
    const currentId = room.presentationPlayerId
    const idx = currentId ? order.indexOf(currentId) : -1
    const nextId = idx >= 0 && idx < order.length - 1 ? order[idx + 1] : null

    if (!nextId) {
      return this.beginVoting(roomId)
    }

    const phaseEndsAt = new Date(Date.now() + room.presentationDurationSec * 1000)
    const updated = await this.prisma.room.update({
      where: { id: roomId },
      data: {
        status: 'presentation',
        presentationPlayerId: nextId,
        phaseEndsAt,
      },
    })

    await this.addEvent(
      roomId,
      'presentation_advanced',
      {
        presentation_player_id: nextId,
        phase_ends_at: phaseEndsAt,
      },
      updated.currentRound,
    )

    return { room: updated }
  }

  async beginVoting(roomId: string) {
    const room = await this.prisma.room.findUniqueOrThrow({ where: { id: roomId } })
    this.assertNotPaused(room)

    if (room.status === 'voting') return { room, already: true }

    const fromPresentation = isPresentationStatus(room.status)
    const fromTie =
      room.status === 'vote_result' &&
      this.parseJson<{ tie?: boolean }>(room.lastVoteSummaryJson, {}).tie === true

    if (!fromPresentation && !fromTie) throw new GameException('INVALID_STATUS')

    const existingCandidates = this.parseJson<string[]>(room.votingCandidateIdsJson, [])
    const lastSummary = this.parseJson<{ tie?: boolean }>(room.lastVoteSummaryJson, {})
    const isRevote =
      existingCandidates.length > 0 &&
      (fromTie || (fromPresentation && lastSummary.tie === true))

    let candidateIds: string[]
    if (isRevote) {
      candidateIds = existingCandidates
    } else {
      const active = await this.prisma.player.findMany({
        where: { roomId, status: 'active' },
        select: { id: true },
      })
      candidateIds = active.map((p) => p.id)
    }

    await this.prisma.vote.deleteMany({ where: { roomId, round: room.currentRound } })

    const phaseEndsAt = new Date(Date.now() + room.votingDurationSec * 1000)
    const updated = await this.prisma.room.update({
      where: { id: roomId },
      data: {
        status: 'voting',
        phaseEndsAt,
        presentationPlayerId: null,
        votingCandidateIdsJson: JSON.stringify(candidateIds),
        lastVoteSummaryJson: '{}',
      },
    })

    await this.addEvent(
      roomId,
      'voting_started',
      { candidate_ids: candidateIds, phase_ends_at: phaseEndsAt },
      updated.currentRound,
    )

    return { room: updated }
  }

  async startVoting(userId: string, roomId: string) {
    await this.requireHost(roomId, userId)
    return this.beginVoting(roomId)
  }

  async submitVote(userId: string, roomId: string, targetPlayerId: string) {
    return this.prisma.$transaction(async (tx) => {
      const room = await tx.room.findUniqueOrThrow({ where: { id: roomId } })
      if (room.status !== 'voting') throw new GameException('INVALID_STATUS')
      this.assertNotPaused(room)

      const me = await tx.player.findFirst({
        where: { roomId, userId, status: 'active' },
      })
      if (!me) throw new GameException('PLAYER_NOT_ACTIVE')
      if (me.id === targetPlayerId) throw new GameException('CANNOT_VOTE_SELF')

      const target = await tx.player.findFirst({
        where: { id: targetPlayerId, roomId, status: 'active' },
      })
      if (!target) throw new GameException('INVALID_TARGET')

      const candidates = this.parseJson<string[]>(room.votingCandidateIdsJson, [])
      if (candidates.length > 0 && !candidates.includes(targetPlayerId)) {
        throw new GameException('INVALID_TARGET')
      }

      const existing = await tx.vote.findUnique({
        where: {
          roomId_round_voterId: {
            roomId,
            round: room.currentRound,
            voterId: me.id,
          },
        },
      })

      const activeCount = await tx.player.count({ where: { roomId, status: 'active' } })
      if (existing) {
        const cast = await tx.vote.count({ where: { roomId, round: room.currentRound } })
        return {
          vote: existing,
          already_voted: true,
          progress: { cast, total: activeCount },
        }
      }

      const vote = await tx.vote.create({
        data: {
          roomId,
          round: room.currentRound,
          voterId: me.id,
          targetPlayerId,
        },
      })

      const cast = await tx.vote.count({ where: { roomId, round: room.currentRound } })
      await tx.gameEvent.create({
        data: {
          roomId,
          round: room.currentRound,
          type: 'vote_submitted',
          payload: JSON.stringify({
            voter_id: me.id,
            progress_cast: cast,
            progress_total: activeCount,
          }),
        },
      })

      return { vote, progress: { cast, total: activeCount } }
    })
  }

  /** System autofill — allows self-vote (manual submitVote still blocks it). */
  private async autofillMissingVotesAsSelf(roomId: string, round: number) {
    const activePlayers = await this.prisma.player.findMany({
      where: { roomId, status: 'active' },
    })
    const votes = await this.prisma.vote.findMany({
      where: { roomId, round },
    })
    const voted = new Set(votes.map((v) => v.voterId))

    for (const player of activePlayers) {
      if (voted.has(player.id)) continue
      await this.prisma.vote.create({
        data: {
          roomId,
          round,
          voterId: player.id,
          targetPlayerId: player.id,
        },
      })
    }
  }

  async completeVoting(userId: string, roomId: string) {
    await this.requireHost(roomId, userId)
    const room = await this.prisma.room.findUniqueOrThrow({ where: { id: roomId } })
    this.assertNotPaused(room)
    return this.resolveVoting(roomId)
  }

  async resolveVoting(roomId: string) {
    const room = await this.prisma.room.findUniqueOrThrow({ where: { id: roomId } })
    if (room.status === 'vote_result' || room.status === 'finished') {
      return { room, already: true }
    }
    if (room.status !== 'voting') throw new GameException('INVALID_STATUS')

    const activePlayers = await this.prisma.player.findMany({
      where: { roomId, status: 'active' },
    })
    const votes = await this.prisma.vote.findMany({
      where: { roomId, round: room.currentRound },
    })
    if (votes.length < activePlayers.length) throw new GameException('VOTING_INCOMPLETE')

    const tallyMap = new Map<string, number>()
    for (const vote of votes) {
      tallyMap.set(vote.targetPlayerId, (tallyMap.get(vote.targetPlayerId) ?? 0) + 1)
    }
    const tallies = [...tallyMap.entries()]
      .map(([player_id, voteCount]) => ({ player_id, votes: voteCount }))
      .sort((a, b) => b.votes - a.votes)
    const maxVotes = tallies[0]?.votes ?? 0
    const leaders = tallies.filter((t) => t.votes === maxVotes).map((t) => t.player_id)

    if (leaders.length > 1) {
      const phaseEndsAt = this.voteResultEndsAt()
      const updated = await this.prisma.room.update({
        where: { id: roomId },
        data: {
          status: 'vote_result',
          phaseEndsAt,
          votingCandidateIdsJson: JSON.stringify(leaders),
          lastVoteSummaryJson: JSON.stringify({
            tie: true,
            candidate_ids: leaders,
            tallies,
          }),
        },
      })
      await this.addEvent(
        roomId,
        'vote_tie',
        { candidate_ids: leaders, tallies, phase_ends_at: phaseEndsAt },
        room.currentRound,
      )
      return { room: updated, tie: true, summary: tallies }
    }

    const eliminatedId = leaders[0]
    await this.prisma.player.update({
      where: { id: eliminatedId },
      data: { status: 'eliminated', eliminatedAt: new Date() },
    })
    await this.prisma.playerCharacteristic.updateMany({
      where: { playerId: eliminatedId, isRevealed: false },
      data: {
        isRevealed: true,
        revealedRound: room.currentRound,
        revealedAt: new Date(),
      },
    })

    const remaining = await this.prisma.player.count({ where: { roomId, status: 'active' } })
    if (remaining <= (room.shelterCapacity ?? 0)) {
      const updated = await this.prisma.room.update({
        where: { id: roomId },
        data: {
          status: 'finished',
          votingCandidateIdsJson: '[]',
          lastVoteSummaryJson: JSON.stringify({
            tie: false,
            eliminated_player_id: eliminatedId,
            tallies,
          }),
          phaseEndsAt: null,
          presentationPlayerId: null,
        },
      })
      await this.prisma.playerCharacteristic.updateMany({
        where: {
          roomId,
          isRevealed: false,
        },
        data: {
          isRevealed: true,
          revealedRound: room.currentRound,
          revealedAt: new Date(),
        },
      })
      await this.addEvent(
        roomId,
        'game_finished',
        { eliminated_player_id: eliminatedId, tallies },
        room.currentRound,
      )
      return { room: updated, eliminated_player_id: eliminatedId, summary: tallies, tie: false }
    }

    const phaseEndsAt = this.voteResultEndsAt()
    const updated = await this.prisma.room.update({
      where: { id: roomId },
      data: {
        status: 'vote_result',
        phaseEndsAt,
        votingCandidateIdsJson: '[]',
        lastVoteSummaryJson: JSON.stringify({
          tie: false,
          eliminated_player_id: eliminatedId,
          tallies,
        }),
      },
    })
    await this.addEvent(
      roomId,
      'player_eliminated',
      { eliminated_player_id: eliminatedId, tallies, phase_ends_at: phaseEndsAt },
      room.currentRound,
    )
    return { room: updated, eliminated_player_id: eliminatedId, summary: tallies, tie: false }
  }

  async nextRevealRound(userId: string, roomId: string) {
    await this.requireHost(roomId, userId)
    return this.advanceToNextRound(roomId)
  }

  async advanceToNextRound(roomId: string) {
    const room = await this.prisma.room.findUniqueOrThrow({ where: { id: roomId } })
    this.assertNotPaused(room)

    if (room.status === 'reveal') return { room, already: true }

    const lastSummary = this.parseJson<{ tie?: boolean }>(room.lastVoteSummaryJson, {})
    const fromPresentationSkip =
      isPresentationStatus(room.status) && lastSummary.tie !== true

    if (room.status !== 'vote_result' && !fromPresentationSkip) {
      throw new GameException('INVALID_STATUS')
    }

    if (room.status === 'vote_result') {
      const candidates = this.parseJson<string[]>(room.votingCandidateIdsJson, [])
      if (lastSummary.tie && candidates.length > 0) throw new GameException('TIE_REQUIRES_REVOTE')
    }

    const nextRound = room.currentRound + 1
    const quota = revealQuotaForRound(nextRound)

    if (quota <= 0) {
      await this.prisma.room.update({
        where: { id: roomId },
        data: {
          currentRound: nextRound,
          votingCandidateIdsJson: '[]',
          lastVoteSummaryJson: '{}',
          presentationPlayerId: null,
          presentationOrderJson: '[]',
        },
      })
      await this.addEvent(roomId, 'round_advanced', { current_round: nextRound }, nextRound)
      return this.beginPresentation(roomId)
    }

    const phaseEndsAt = new Date(Date.now() + room.revealDurationSec * 1000)
    const updated = await this.prisma.room.update({
      where: { id: roomId },
      data: {
        status: 'reveal',
        currentRound: nextRound,
        phaseEndsAt,
        presentationPlayerId: null,
        presentationOrderJson: '[]',
        votingCandidateIdsJson: '[]',
        lastVoteSummaryJson: '{}',
      },
    })
    await this.addEvent(
      roomId,
      'reveal_started',
      { phase_ends_at: phaseEndsAt },
      updated.currentRound,
    )
    return { room: updated }
  }

  async setPaused(userId: string, roomId: string, paused: boolean) {
    await this.requireHost(roomId, userId)
    const room = await this.prisma.room.findUniqueOrThrow({ where: { id: roomId } })

    if (room.status === 'lobby' || room.status === 'finished') {
      throw new GameException('INVALID_STATUS')
    }

    if (paused) {
      if (room.pausedAt) return { room, already: true }
      const remaining =
        room.phaseEndsAt != null
          ? Math.max(0, room.phaseEndsAt.getTime() - Date.now())
          : null
      const updated = await this.prisma.room.update({
        where: { id: roomId },
        data: {
          pausedAt: new Date(),
          pauseRemainingMs: remaining,
          phaseEndsAt: null,
        },
      })
      await this.addEvent(
        roomId,
        'game_paused',
        { pause_remaining_ms: remaining },
        room.currentRound,
      )
      return { room: updated }
    }

    if (!room.pausedAt) return { room, already: true }
    const phaseEndsAt =
      room.pauseRemainingMs != null
        ? new Date(Date.now() + room.pauseRemainingMs)
        : null
    const updated = await this.prisma.room.update({
      where: { id: roomId },
      data: {
        pausedAt: null,
        pauseRemainingMs: null,
        phaseEndsAt,
      },
    })
    await this.addEvent(
      roomId,
      'game_resumed',
      { phase_ends_at: phaseEndsAt },
      room.currentRound,
    )
    return { room: updated }
  }

  async processDuePhases(): Promise<string[]> {
    const now = new Date()
    const due = await this.prisma.room.findMany({
      where: {
        phaseEndsAt: { lte: now },
        pausedAt: null,
        status: {
          in: ['reveal', 'presentation', 'discussion', 'voting', 'vote_result'],
        },
      },
      select: { id: true, code: true, status: true },
    })

    const changedCodes: string[] = []
    for (const room of due) {
      try {
        await this.handleTimeout(room.id)
        changedCodes.push(room.code)
      } catch {
        // skip room on race / invalid transition
      }
    }
    return changedCodes
  }

  private async handleTimeout(roomId: string) {
    const room = await this.prisma.room.findUniqueOrThrow({ where: { id: roomId } })
    if (room.pausedAt) return
    if (!room.phaseEndsAt || room.phaseEndsAt.getTime() > Date.now()) return

    const status = normalizeGameStatus(room.status)

    if (status === 'reveal') {
      await this.beginPresentation(roomId)
      return
    }

    if (status === 'presentation') {
      await this.advancePresentation(roomId)
      return
    }

    if (status === 'voting') {
      await this.autofillMissingVotesAsSelf(roomId, room.currentRound)
      await this.resolveVoting(roomId)
      return
    }

    if (status === 'vote_result') {
      const summary = this.parseJson<{ tie?: boolean }>(room.lastVoteSummaryJson, {})
      const candidates = this.parseJson<string[]>(room.votingCandidateIdsJson, [])
      if (summary.tie && candidates.length > 0) {
        await this.beginPresentation(roomId)
        return
      }
      await this.advanceToNextRound(roomId)
    }
  }

  async finishGame(userId: string, roomId: string) {
    await this.requireHost(roomId, userId)
    return this.prisma.$transaction(async (tx) => {
      const room = await tx.room.findUniqueOrThrow({ where: { id: roomId } })
      if (room.status === 'finished') return { room, already: true }
      if (room.status === 'lobby') throw new GameException('INVALID_STATUS')

      const updated = await tx.room.update({
        where: { id: roomId },
        data: {
          status: 'finished',
          phaseEndsAt: null,
          pausedAt: null,
          pauseRemainingMs: null,
          presentationPlayerId: null,
        },
      })
      await tx.playerCharacteristic.updateMany({
        where: { roomId, isRevealed: false },
        data: {
          isRevealed: true,
          revealedAt: new Date(),
          revealedRound: room.currentRound,
        },
      })
      await tx.gameEvent.create({
        data: {
          roomId,
          round: room.currentRound,
          type: 'game_finished',
          payload: JSON.stringify({ forced: true }),
        },
      })
      return { room: updated }
    })
  }

  async getRoomCode(roomId: string): Promise<string | null> {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      select: { code: true },
    })
    return room?.code ?? null
  }

  private async buildFinishStats(roomId: string): Promise<{
    shelter_capacity: number | null
    max_round: number
    players: PlayerFinishStat[]
  }> {
    const room = await this.prisma.room.findUniqueOrThrow({ where: { id: roomId } })
    const [players, votes, traits] = await Promise.all([
      this.prisma.player.findMany({ where: { roomId } }),
      this.prisma.vote.findMany({ where: { roomId } }),
      this.prisma.playerCharacteristic.findMany({
        where: { roomId },
        include: { characteristic: true },
      }),
    ])

    const maxRound = Math.max(1, room.currentRound)
    const stats: PlayerFinishStat[] = players.map((player) => {
      const votesAgainst = votes.filter((v) => v.targetPlayerId === player.id).length
      const survived = player.status === 'active'
      const votedRounds = votes.filter((v) => v.voterId === player.id).map((v) => v.round)
      const roundsLasted = survived
        ? maxRound
        : Math.max(1, ...(votedRounds.length ? votedRounds : [1]))

      const hand = traits.filter((t) => t.playerId === player.id)
      const rarity_counts = emptyRarityCounts()
      let rarityPower = 0
      for (const row of hand) {
        const rarity = normalizeRarity(row.characteristic.rarity)
        rarity_counts[rarity] += 1
        rarityPower += RARITY_SCORE[rarity]
      }

      return {
        player_id: player.id,
        name: player.name,
        status: player.status as PlayerFinishStat['status'],
        survived,
        survival_chance: computeSurvivalChance({
          survived,
          votesAgainst,
          roundsLasted,
          rarityPower,
          maxRound,
        }),
        votes_against: votesAgainst,
        rounds_lasted: roundsLasted,
        rarity_power: rarityPower,
        rarity_counts,
      }
    })

    stats.sort((a, b) => {
      if (a.survived !== b.survived) return a.survived ? -1 : 1
      return b.survival_chance - a.survival_chance
    })

    return {
      shelter_capacity: room.shelterCapacity,
      max_round: maxRound,
      players: stats,
    }
  }

  async getSnapshot(userId: string, code: string) {
    const normalized = normalizeRoomCode(code)
    const room = await this.prisma.room.findUnique({
      where: { code: normalized },
      include: {
        disaster: true,
        bunker: true,
      },
    })
    if (!room) return null

    const me = await this.prisma.player.findUnique({
      where: { roomId_userId: { roomId: room.id, userId } },
    })
    if (!me) return null

    const [players, characteristics, actionCards, events, votes] = await Promise.all([
      this.prisma.player.findMany({
        where: { roomId: room.id },
        orderBy: { joinedAt: 'asc' },
      }),
      this.prisma.playerCharacteristic.findMany({
        where: { roomId: room.id },
        include: { characteristic: true },
      }),
      this.prisma.playerActionCard.findMany({
        where: { roomId: room.id },
        include: { actionCard: true },
      }),
      this.prisma.gameEvent.findMany({
        where: { roomId: room.id },
        orderBy: { createdAt: 'desc' },
        take: 40,
      }),
      this.prisma.vote.findMany({
        where: { roomId: room.id, round: room.currentRound },
      }),
    ])

    const showAllTraits = room.status === 'finished'
    const visibleCharacteristics = characteristics
      .filter(
        (item) => showAllTraits || item.isRevealed || item.playerId === me.id,
      )
      .map((item) => ({
        id: item.id,
        room_id: item.roomId,
        player_id: item.playerId,
        characteristic_id: item.characteristicId,
        category: item.category as CharacteristicCategory,
        is_revealed: showAllTraits ? true : item.isRevealed,
        revealed_round: item.revealedRound,
        revealed_at: item.revealedAt?.toISOString() ?? null,
        characteristic: {
          id: item.characteristic.id,
          category: item.characteristic.category as CharacteristicCategory,
          title: item.characteristic.title,
          description: item.characteristic.description,
          rarity: normalizeRarity(item.characteristic.rarity),
          is_active: item.characteristic.isActive,
        },
      }))

    // Own hand always; others only see that a card exists / was used (title hidden until used via events)
    const visibleActionCards = actionCards
      .filter((item) => item.playerId === me.id || item.isUsed || showAllTraits)
      .map((item) => {
        const isOwner = item.playerId === me.id
        return {
          id: item.id,
          room_id: item.roomId,
          player_id: item.playerId,
          action_card_id: item.actionCardId,
          is_used: item.isUsed,
          used_at: item.usedAt?.toISOString() ?? null,
          used_round: item.usedRound,
          action_card: {
            id: item.actionCard.id,
            effect_type: item.actionCard.effectType,
            title: isOwner || item.isUsed || showAllTraits ? item.actionCard.title : 'Карточка действия',
            description:
              isOwner || item.isUsed || showAllTraits
                ? item.actionCard.description
                : 'Скрыта',
          },
        }
      })

    const activeVoters = players.filter((p) => p.status === 'active')
    const visibleVotes =
      room.status === 'vote_result' || room.status === 'finished'
        ? votes
        : votes.filter((v) => v.voterId === me.id)

    const finish_stats =
      room.status === 'finished' ? await this.buildFinishStats(room.id) : null

    return {
      room: this.serializeRoom(room),
      players: players.map((p) => this.serializePlayer(p)),
      me: this.serializePlayer(me),
      disaster: room.disaster
        ? {
            id: room.disaster.id,
            title: room.disaster.title,
            description: room.disaster.description,
            is_active: room.disaster.isActive,
          }
        : null,
      bunker: room.bunker
        ? {
            id: room.bunker.id,
            title: room.bunker.title,
            description: room.bunker.description,
            is_active: room.bunker.isActive,
          }
        : null,
      characteristics: visibleCharacteristics,
      action_cards: visibleActionCards,
      finish_stats,
      events: events.map((e) => ({
        id: e.id,
        room_id: e.roomId,
        round: e.round,
        type: e.type,
        payload: this.parseJson(e.payload, {}),
        created_at: e.createdAt.toISOString(),
      })),
      votes: visibleVotes.map((v) => ({
        id: v.id,
        room_id: v.roomId,
        round: v.round,
        voter_id: v.voterId,
        target_player_id: v.targetPlayerId,
        created_at: v.createdAt.toISOString(),
      })),
      myVote: votes.find((v) => v.voterId === me.id)
        ? {
            id: votes.find((v) => v.voterId === me.id)!.id,
            room_id: room.id,
            round: room.currentRound,
            voter_id: me.id,
            target_player_id: votes.find((v) => v.voterId === me.id)!.targetPlayerId,
            created_at: votes.find((v) => v.voterId === me.id)!.createdAt.toISOString(),
          }
        : null,
      vote_progress: {
        cast: votes.length,
        total: activeVoters.length,
      },
      mocks_enabled: isMockBotsEnabled(),
    }
  }

  private serializeRoom(room: {
    id: string
    code: string
    hostPlayerId: string | null
    status: string
    currentRound: number
    maxPlayers: number
    shelterCapacity: number | null
    packageId: string | null
    disasterId: string | null
    bunkerId: string | null
    discussionDurationSec: number
    presentationDurationSec: number
    votingDurationSec: number
    revealDurationSec: number
    presentationPlayerId: string | null
    presentationOrderJson: string
    phaseEndsAt: Date | null
    pausedAt: Date | null
    pauseRemainingMs: number | null
    votingCandidateIdsJson: string
    lastVoteSummaryJson: string
    createdAt: Date
    updatedAt: Date
  }) {
    const status = normalizeGameStatus(room.status)
    return {
      id: room.id,
      code: room.code,
      host_player_id: room.hostPlayerId,
      status: status as GameStatus,
      current_round: room.currentRound,
      max_players: room.maxPlayers,
      shelter_capacity: room.shelterCapacity,
      package_id: room.packageId,
      disaster_id: room.disasterId,
      bunker_id: room.bunkerId,
      discussion_duration_sec: room.discussionDurationSec,
      presentation_duration_sec: room.presentationDurationSec,
      voting_duration_sec: room.votingDurationSec,
      reveal_duration_sec: room.revealDurationSec,
      presentation_player_id: room.presentationPlayerId,
      presentation_order: this.parseJson<string[]>(room.presentationOrderJson, []),
      phase_ends_at: room.phaseEndsAt?.toISOString() ?? null,
      paused_at: room.pausedAt?.toISOString() ?? null,
      pause_remaining_ms: room.pauseRemainingMs,
      is_paused: Boolean(room.pausedAt),
      reveal_quota: revealQuotaForRound(room.currentRound),
      voting_candidate_ids: this.parseJson<string[]>(room.votingCandidateIdsJson, []),
      last_vote_summary: this.parseJson(room.lastVoteSummaryJson, {}),
      created_at: room.createdAt.toISOString(),
      updated_at: room.updatedAt.toISOString(),
    }
  }

  private serializePlayer(player: {
    id: string
    roomId: string
    userId: string
    name: string
    role: string
    status: string
    joinedAt: Date
    lastSeenAt: Date | null
    eliminatedAt: Date | null
  }) {
    return {
      id: player.id,
      room_id: player.roomId,
      user_id: player.userId,
      name: player.name,
      role: player.role,
      status: player.status,
      joined_at: player.joinedAt.toISOString(),
      last_seen_at: player.lastSeenAt?.toISOString() ?? null,
      eliminated_at: player.eliminatedAt?.toISOString() ?? null,
    }
  }
}
