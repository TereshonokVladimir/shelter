import { describe, expect, it } from 'vitest'
import {
  calculateShelterCapacity,
  canTransition,
  formatRoomCode,
  getRemainingMs,
  normalizeRoomCode,
  resolveVoteResult,
} from '@/features/game/utils/game-logic'
import {
  distributeRevealQuotas,
  eliminationsThisRound,
  pickEliminations,
  plannedVotingRounds,
} from '@/lib/constants'

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

describe('plannedVotingRounds + reveal plan', () => {
  it('scales rounds with lobby size (1 kick per round)', () => {
    expect(plannedVotingRounds(12, calculateShelterCapacity(12))).toBe(6)
    expect(plannedVotingRounds(8, calculateShelterCapacity(8))).toBe(4)
    expect(plannedVotingRounds(4, calculateShelterCapacity(4))).toBe(2)
  })

  it('spreads 7 reveals across 6 rounds without empty early seats', () => {
    const plan = distributeRevealQuotas(6, 'slow')
    expect(plan).toEqual([2, 1, 1, 1, 1, 1])
    expect(plan.reduce((a, b) => a + b, 0)).toBe(7)
  })

  it('always eliminates one while over capacity', () => {
    expect(
      eliminationsThisRound({
        activeCount: 12,
        shelterCapacity: 6,
      }),
    ).toBe(1)
    expect(
      eliminationsThisRound({
        activeCount: 6,
        shelterCapacity: 6,
      }),
    ).toBe(0)
  })
})

describe('pickEliminations', () => {
  it('takes top seats when scores are unique', () => {
    const result = pickEliminations(
      [
        { playerId: 'a', votes: 5 },
        { playerId: 'b', votes: 3 },
        { playerId: 'c', votes: 1 },
      ],
      2,
    )
    expect(result.eliminateIds).toEqual(['a', 'b'])
    expect(result.tieCandidateIds).toBeNull()
  })

  it('clears unique leaders then ties for remaining seats', () => {
    const result = pickEliminations(
      [
        { playerId: 'a', votes: 5 },
        { playerId: 'b', votes: 3 },
        { playerId: 'c', votes: 3 },
      ],
      2,
    )
    expect(result.eliminateIds).toEqual(['a'])
    expect(result.tieCandidateIds).toEqual(['b', 'c'])
    expect(result.seatsNeeded).toBe(1)
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
    expect(result.eliminatedPlayerIds).toEqual(['a'])
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

  it('eliminates multiple when seats > 1', () => {
    const result = resolveVoteResult(
      [
        { playerId: 'a', votes: 4 },
        { playerId: 'b', votes: 3 },
        { playerId: 'c', votes: 1 },
      ],
      2,
    )
    expect(result.tie).toBe(false)
    expect(result.eliminatedPlayerIds).toEqual(['a', 'b'])
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
