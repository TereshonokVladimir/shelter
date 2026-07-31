/** Shared game rules — keep in sync with frontend `src/lib/constants.ts` where mirrored. */

/** One characteristic stays hidden until elimination / finale. */
export const ALWAYS_HIDDEN_COUNT = 1

/** Voluntary reveals across the whole game (8 categories − 1 always hidden). */
export const TOTAL_VOLUNTARY_REVEALS = 7

export type RevealStrategyId = 'classic' | 'slow' | 'custom'

export const REVEAL_STRATEGIES: Record<
  RevealStrategyId,
  { label: string; description: string }
> = {
  classic: {
    label: 'Классика',
    description: 'Ровно по раундам',
  },
  slow: {
    label: 'Ровная',
    description: 'Плоские квоты',
  },
  custom: {
    label: 'Кастом',
    description: 'Свой план по раундам',
  },
}

/** @deprecated illustrative only — real quotas come from distributeRevealQuotas */
export const REVEAL_QUOTA_BY_ROUND: Record<number, number> = {
  1: 3,
  2: 2,
  3: 2,
}

export function normalizeRevealStrategy(value: string | null | undefined): RevealStrategyId {
  if (value === 'slow' || value === 'custom' || value === 'classic') return value
  // Legacy «Фронт» / sprint → classic (plans were nearly identical)
  if (value === 'sprint') return 'classic'
  return 'classic'
}

/** Voting rounds until bunker is full (1 elimination per round). */
export function plannedVotingRounds(
  playerCount: number,
  shelterCapacity: number,
): number {
  return Math.max(1, playerCount - shelterCapacity)
}

function evenDistribute(total: number, rounds: number): number[] {
  if (rounds <= 0) return []
  if (total <= 0) return Array.from({ length: rounds }, () => 0)
  if (total < rounds) {
    return Array.from({ length: rounds }, (_, i) => (i < total ? 1 : 0))
  }
  const quotas = Array.from({ length: rounds }, () => 1)
  let extra = total - rounds
  let i = 0
  while (extra > 0) {
    quotas[i % rounds] += 1
    i += 1
    extra -= 1
  }
  return quotas
}

/** Force non-negative ints to sum exactly `total`. */
export function forceQuotaSum(quotas: number[], total: number): number[] {
  if (quotas.length === 0) return []
  const q = quotas.map((n) => Math.max(0, Math.floor(Number(n) || 0)))
  let sum = q.reduce((a, b) => a + b, 0)
  if (sum === total) return q
  if (sum === 0) return evenDistribute(total, q.length)

  const scaled = q.map((n) => Math.floor((n / sum) * total))
  let rem = total - scaled.reduce((a, b) => a + b, 0)
  let i = 0
  const guard = q.length * (Math.abs(total) + 2) + 20
  while (rem !== 0 && i < guard) {
    const idx = i % scaled.length
    if (rem > 0) {
      scaled[idx] += 1
      rem -= 1
    } else if (scaled[idx] > 0) {
      scaled[idx] -= 1
      rem += 1
    }
    i += 1
  }
  return scaled
}

/**
 * Fit a custom plan to `rounds` seats while keeping TOTAL_VOLUNTARY_REVEALS.
 * Used when lobby size at start differs from create-form preview.
 */
export function normalizeCustomRevealPlan(
  plan: number[] | null | undefined,
  rounds: number,
  total: number = TOTAL_VOLUNTARY_REVEALS,
): number[] {
  if (rounds <= 0) return []
  const cleaned = (plan ?? []).map((n) => Math.max(0, Math.floor(Number(n) || 0)))
  if (cleaned.length === 0) {
    return distributeRevealQuotas(rounds, 'classic', total)
  }
  if (cleaned.length === rounds) {
    return forceQuotaSum(cleaned, total)
  }
  if (cleaned.length < rounds) {
    return forceQuotaSum(
      [...cleaned, ...Array.from({ length: rounds - cleaned.length }, () => 0)],
      total,
    )
  }
  // Longer plan → keep first (rounds-1) and merge the tail into the last seat
  const head = cleaned.slice(0, rounds - 1)
  const tail = cleaned.slice(rounds - 1).reduce((a, b) => a + b, 0)
  return forceQuotaSum([...head, tail], total)
}

export function isValidCustomRevealPlan(
  plan: number[] | null | undefined,
  rounds: number,
  total: number = TOTAL_VOLUNTARY_REVEALS,
): boolean {
  if (!plan || plan.length !== rounds || rounds <= 0) return false
  let sum = 0
  for (const n of plan) {
    if (!Number.isInteger(n) || n < 0 || n > total) return false
    sum += n
  }
  return sum === total
}

/**
 * Spread TOTAL_VOLUNTARY_REVEALS across lobby-scaled voting rounds.
 * Prefers ≥1 reveal per round while total ≥ rounds.
 * For `custom`, pass `customPlan` (or use normalizeCustomRevealPlan first).
 */
export function distributeRevealQuotas(
  rounds: number,
  strategy?: string | null,
  total: number = TOTAL_VOLUNTARY_REVEALS,
  customPlan?: number[] | null,
): number[] {
  const id = normalizeRevealStrategy(strategy)
  if (rounds <= 0) return []
  if (rounds === 1) return [Math.max(0, total)]

  if (id === 'custom') {
    return normalizeCustomRevealPlan(customPlan, rounds, total)
  }

  if (id === 'slow') {
    return evenDistribute(total, rounds)
  }

  // classic (and legacy sprint)
  const quotas = evenDistribute(total, rounds)
  for (let i = quotas.length - 1; i > 0; i -= 1) {
    if (quotas[i] > 1) {
      quotas[i] -= 1
      quotas[0] += 1
      break
    }
  }
  return quotas
}

export function revealQuotaForRound(
  round: number,
  strategy?: string | null,
  plannedRounds?: number | null,
  customPlan?: number[] | null,
): number {
  if (round < 1) return 0
  const rounds =
    plannedRounds && plannedRounds > 0
      ? plannedRounds
      : evenDistribute(TOTAL_VOLUNTARY_REVEALS, 3).length
  // Frozen plan on the room wins when present and sized
  if (customPlan && customPlan.length === rounds) {
    return Math.max(0, Math.floor(customPlan[round - 1] ?? 0))
  }
  const quotas = distributeRevealQuotas(rounds, strategy, TOTAL_VOLUNTARY_REVEALS, customPlan)
  return quotas[round - 1] ?? 0
}

/**
 * Always 1 while people still exceed capacity.
 * Party length scales with lobby size; multi-kick only via ties/revotes seats_needed.
 */
export function eliminationsThisRound(input: {
  activeCount: number
  shelterCapacity: number
  currentRound?: number
  strategy?: string | null
}): number {
  const remaining = input.activeCount - input.shelterCapacity
  if (remaining <= 0) return 0
  return 1
}

export function pickEliminations(
  tallies: Array<{ player_id: string; votes: number }>,
  seats: number,
): {
  eliminateIds: string[]
  tieCandidateIds: string[] | null
  seatsNeeded: number
} {
  if (seats <= 0) {
    return { eliminateIds: [], tieCandidateIds: null, seatsNeeded: 0 }
  }

  const sorted = [...tallies].sort(
    (a, b) => b.votes - a.votes || a.player_id.localeCompare(b.player_id),
  )
  const eliminateIds: string[] = []
  let i = 0

  while (eliminateIds.length < seats && i < sorted.length) {
    const bandVotes = sorted[i].votes
    const band: string[] = []
    while (i < sorted.length && sorted[i].votes === bandVotes) {
      band.push(sorted[i].player_id)
      i += 1
    }
    const need = seats - eliminateIds.length
    if (band.length <= need) {
      eliminateIds.push(...band)
    } else {
      return {
        eliminateIds,
        tieCandidateIds: band,
        seatsNeeded: need,
      }
    }
  }

  return { eliminateIds, tieCandidateIds: null, seatsNeeded: 0 }
}

/** Prisma/where fragment: voluntary reveals that spend the round quota. */
export const QUOTA_REVEAL_SOURCE = 'player' as const

export function isQuotaRevealSource(source: string | null | undefined): boolean {
  return !source || source === QUOTA_REVEAL_SOURCE
}

export const MIN_PRESENTATION_SEC = 60
export const MAX_PRESENTATION_SEC = 180
export const DEFAULT_PRESENTATION_SEC = 60

export const MIN_VOTING_SEC = 30
export const MAX_VOTING_SEC = 180
export const DEFAULT_VOTING_SEC = 60

export const MIN_REVEAL_SEC = 30
export const MAX_REVEAL_SEC = 300
export const DEFAULT_REVEAL_SEC = 90

export const MIN_PREP_SEC = 0
export const MAX_PREP_SEC = 180
export const DEFAULT_PREP_SEC = 60

export const DEFAULT_REVEAL_STRATEGY: RevealStrategyId = 'classic'

export const VOTE_RESULT_AUTO_SEC = 12
