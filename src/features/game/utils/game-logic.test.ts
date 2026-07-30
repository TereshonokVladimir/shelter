import { describe, expect, it } from 'vitest'
import {
  calculateShelterCapacity,
  canTransition,
  formatRoomCode,
  getRemainingMs,
  normalizeRoomCode,
  resolveVoteResult,
} from '@/features/game/utils/game-logic'

describe('calculateShelterCapacity', () => {
  it('uses about half of players', () => {
    expect(calculateShelterCapacity(4)).toBe(2)
    expect(calculateShelterCapacity(5)).toBe(3)
    expect(calculateShelterCapacity(8)).toBe(4)
  })

  it('never equals or exceeds player count', () => {
    expect(calculateShelterCapacity(2)).toBe(1)
    expect(calculateShelterCapacity(3)).toBe(2)
  })
})

describe('resolveVoteResult', () => {
  it('eliminates unique leader', () => {
    const result = resolveVoteResult([
      { playerId: 'a', votes: 3 },
      { playerId: 'b', votes: 1 },
    ])
    expect(result.tie).toBe(false)
    expect(result.eliminatedPlayerId).toBe('a')
  })

  it('returns tie candidates on equal max votes', () => {
    const result = resolveVoteResult([
      { playerId: 'a', votes: 2 },
      { playerId: 'b', votes: 2 },
      { playerId: 'c', votes: 1 },
    ])
    expect(result.tie).toBe(true)
    expect(result.eliminatedPlayerId).toBeNull()
    expect(result.candidateIds).toEqual(['a', 'b'])
  })
})

describe('canTransition', () => {
  it('allows valid FSM edges', () => {
    expect(canTransition('lobby', 'reveal')).toBe(true)
    expect(canTransition('reveal', 'presentation')).toBe(true)
    expect(canTransition('presentation', 'voting')).toBe(true)
    expect(canTransition('discussion', 'voting')).toBe(true)
    expect(canTransition('voting', 'vote_result')).toBe(true)
    expect(canTransition('vote_result', 'reveal')).toBe(true)
    expect(canTransition('vote_result', 'presentation')).toBe(true)
    expect(canTransition('vote_result', 'finished')).toBe(true)
  })

  it('blocks invalid edges', () => {
    expect(canTransition('lobby', 'voting')).toBe(false)
    expect(canTransition('finished', 'lobby')).toBe(false)
  })
})

describe('timer helpers', () => {
  it('computes remaining ms', () => {
    const now = Date.parse('2026-03-28T12:00:00.000Z')
    const ends = '2026-03-28T12:01:30.000Z'
    expect(getRemainingMs(ends, now)).toBe(90_000)
    expect(getRemainingMs(ends, now + 120_000)).toBe(0)
  })
})

describe('room code formatting', () => {
  it('normalizes and formats codes', () => {
    expect(normalizeRoomCode(' ab-c12 ')).toBe('ABC12')
    expect(formatRoomCode('ABC123')).toBe('ABC-123')
  })
})
