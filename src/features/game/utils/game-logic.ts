import type { GameStatus } from '@/types/common'
import { GAME_STATUS_TRANSITIONS, ROOM_CODE_ALPHABET, ROOM_CODE_LENGTH } from '@/lib/constants'

export function calculateShelterCapacity(playerCount: number): number {
  if (playerCount < 2) return 1
  const capacity = Math.max(2, Math.ceil(playerCount / 2))
  return capacity >= playerCount ? playerCount - 1 : capacity
}

export function canTransition(from: GameStatus, to: GameStatus): boolean {
  return GAME_STATUS_TRANSITIONS[from].includes(to)
}

export interface VoteTally {
  playerId: string
  votes: number
}

export interface VoteResult {
  tie: boolean
  eliminatedPlayerId: string | null
  candidateIds: string[]
  tallies: VoteTally[]
}

export function resolveVoteResult(tallies: VoteTally[]): VoteResult {
  if (tallies.length === 0) {
    return { tie: false, eliminatedPlayerId: null, candidateIds: [], tallies: [] }
  }

  const maxVotes = Math.max(...tallies.map((t) => t.votes))
  const leaders = tallies.filter((t) => t.votes === maxVotes)
  const sorted = [...tallies].sort((a, b) => b.votes - a.votes)

  if (leaders.length > 1) {
    return {
      tie: true,
      eliminatedPlayerId: null,
      candidateIds: leaders.map((l) => l.playerId),
      tallies: sorted,
    }
  }

  return {
    tie: false,
    eliminatedPlayerId: leaders[0]?.playerId ?? null,
    candidateIds: [],
    tallies: sorted,
  }
}

export function getRemainingMs(phaseEndsAt: string | Date | null | undefined, now = Date.now()): number {
  if (!phaseEndsAt) return 0
  const end = typeof phaseEndsAt === 'string' ? new Date(phaseEndsAt).getTime() : phaseEndsAt.getTime()
  if (Number.isNaN(end)) return 0
  return Math.max(0, end - now)
}

export function formatRemainingTime(remainingMs: number): string {
  const totalSec = Math.ceil(remainingMs / 1000)
  const minutes = Math.floor(totalSec / 60)
  const seconds = totalSec % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export function normalizeRoomCode(code: string): string {
  return code
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 8)
}

export function formatRoomCode(code: string): string {
  const normalized = normalizeRoomCode(code)
  if (normalized.length <= 3) return normalized
  return `${normalized.slice(0, 3)}-${normalized.slice(3)}`
}

export function isValidRoomCode(code: string): boolean {
  const normalized = normalizeRoomCode(code)
  if (normalized.length < 4 || normalized.length > 8) return false
  return [...normalized].every((ch) => ROOM_CODE_ALPHABET.includes(ch) || /[0-9A-Z]/.test(ch))
}

export function createRoomCode(random: () => number = Math.random): string {
  let result = ''
  for (let i = 0; i < ROOM_CODE_LENGTH; i += 1) {
    const index = Math.floor(random() * ROOM_CODE_ALPHABET.length)
    result += ROOM_CODE_ALPHABET[index]
  }
  return result
}

export function mapRpcError(message: string): string {
  const match = message.match(/P0001[:\s]+([A-Z0-9_]+)/) ?? message.match(/\b([A-Z][A-Z0-9_]{3,})\b/)
  return match?.[1] ?? message
}
