/** Shared game rules — keep in sync with frontend `src/lib/constants.ts` where mirrored. */

export const REVEAL_QUOTA_BY_ROUND: Record<number, number> = {
  1: 3,
  2: 2,
  3: 2,
}

/** One characteristic stays hidden until elimination / finale. */
export const ALWAYS_HIDDEN_COUNT = 1

export function revealQuotaForRound(round: number): number {
  return REVEAL_QUOTA_BY_ROUND[round] ?? 0
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

export const VOTE_RESULT_AUTO_SEC = 12
