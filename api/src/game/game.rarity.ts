export type TraitRarity =
  | 'common'
  | 'uncommon'
  | 'rare'
  | 'epic'
  | 'legendary'
  | 'mythic'

export const TRAIT_RARITIES: TraitRarity[] = [
  'common',
  'uncommon',
  'rare',
  'epic',
  'legendary',
  'mythic',
]

/** Relative weight when dealing from a category pool (higher = more often dealt). */
export const RARITY_DEAL_WEIGHT: Record<TraitRarity, number> = {
  common: 48,
  uncommon: 26,
  rare: 14,
  epic: 7,
  legendary: 3.5,
  mythic: 1.5,
}

/** Points for finish “survival vibe” score. */
export const RARITY_SCORE: Record<TraitRarity, number> = {
  common: 1,
  uncommon: 2,
  rare: 4,
  epic: 6,
  legendary: 8,
  mythic: 11,
}

export function normalizeRarity(value: string | null | undefined): TraitRarity {
  if (value === 'unique') return 'mythic' // legacy alias
  if (
    value === 'uncommon' ||
    value === 'rare' ||
    value === 'epic' ||
    value === 'legendary' ||
    value === 'mythic'
  ) {
    return value
  }
  return 'common'
}

/** Stable pseudo-rarity from title so seed stays deterministic. */
export function rarityFromTitle(title: string): TraitRarity {
  let hash = 0
  for (let i = 0; i < title.length; i += 1) {
    hash = (hash * 33 + title.charCodeAt(i)) >>> 0
  }
  const roll = hash % 1000
  if (roll < 12) return 'mythic' // ~1.2%
  if (roll < 42) return 'legendary' // ~3%
  if (roll < 100) return 'epic' // ~5.8%
  if (roll < 220) return 'rare' // ~12%
  if (roll < 480) return 'uncommon' // ~26%
  return 'common'
}

/** Weighted sample without replacement. */
export function pickWeightedByRarity<T extends { rarity: string }>(
  pool: T[],
  count: number,
  random = Math.random,
): T[] {
  const available = [...pool]
  const picked: T[] = []
  const n = Math.min(count, available.length)

  for (let i = 0; i < n; i += 1) {
    const total = available.reduce((sum, item) => {
      return sum + (RARITY_DEAL_WEIGHT[normalizeRarity(item.rarity)] ?? 1)
    }, 0)
    let cursor = random() * total
    let index = available.length - 1
    for (let j = 0; j < available.length; j += 1) {
      cursor -= RARITY_DEAL_WEIGHT[normalizeRarity(available[j].rarity)] ?? 1
      if (cursor <= 0) {
        index = j
        break
      }
    }
    picked.push(available.splice(index, 1)[0])
  }

  return picked
}

export interface PlayerFinishStat {
  player_id: string
  name: string
  status: 'active' | 'eliminated' | 'disconnected'
  survived: boolean
  survival_chance: number
  /** Fit of hand to disaster/bunker themes (−22…26). */
  theme_fit: number
  /** Cross-player / self trait synergies. */
  synergy: number
  /** Phobia / group tension penalties. */
  conflict: number
  votes_against: number
  rounds_lasted: number
  rarity_power: number
  rarity_counts: Record<TraitRarity, number>
  /** Short human-readable reasons for the score. */
  notes: string[]
}

export function emptyRarityCounts(): Record<TraitRarity, number> {
  return {
    common: 0,
    uncommon: 0,
    rare: 0,
    epic: 0,
    legendary: 0,
    mythic: 0,
  }
}
