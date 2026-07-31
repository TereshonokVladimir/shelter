export type GameStatus =
  | 'lobby'
  | 'prep'
  | 'reveal'
  | 'presentation'
  | 'discussion'
  | 'voting'
  | 'vote_result'
  | 'finished'

export type RoomRole = 'host' | 'player'
export type PlayerStatus = 'active' | 'eliminated' | 'disconnected'

export type CharacteristicCategory =
  | 'profession'
  | 'biology'
  | 'health'
  | 'hobby'
  | 'phobia'
  | 'baggage'
  | 'personality'
  | 'fact'

export interface ContentPackageSummary {
  id: string
  slug: string
  title: string
  description: string
  rating: 'everyone' | 'teen' | 'mature' | 'explicit' | string
  topic: string
  is_active: boolean
  is_builtin: boolean
  sort_order: number
  counts?: {
    disasters: number
    bunkers: number
    characteristics: number
  }
}

export interface ContentPackageDetail extends ContentPackageSummary {
  disasters: Array<{
    id: string
    title: string
    description: string
    is_active: boolean
  }>
  bunkers: Array<{
    id: string
    title: string
    description: string
    is_active: boolean
  }>
  characteristics: Array<{
    id: string
    category: CharacteristicCategory | string
    title: string
    description: string | null
    is_active: boolean
  }>
}

export interface Room {
  id: string
  code: string
  host_player_id: string | null
  status: GameStatus
  current_round: number
  max_players: number
  shelter_capacity: number | null
  planned_rounds: number | null
  reveal_plan: number[]
  package_id: string | null
  disaster_id: string | null
  bunker_id: string | null
  discussion_duration_sec: number
  presentation_duration_sec: number
  voting_duration_sec: number
  reveal_duration_sec: number
  prep_duration_sec: number
  reveal_strategy: string
  presentation_player_id: string | null
  presentation_order: string[]
  phase_ends_at: string | null
  paused_at: string | null
  pause_remaining_ms: number | null
  is_paused: boolean
  reveal_quota: number
  eliminations_this_round: number
  voting_candidate_ids: string[]
  last_vote_summary: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface Player {
  id: string
  room_id: string
  user_id: string
  name: string
  role: RoomRole
  status: PlayerStatus
  is_ready: boolean
  joined_at: string
  last_seen_at: string | null
  eliminated_at: string | null
}

export type TraitRarity =
  | 'common'
  | 'uncommon'
  | 'rare'
  | 'epic'
  | 'legendary'
  | 'mythic'

export interface Characteristic {
  id: string
  category: CharacteristicCategory
  title: string
  description: string | null
  rarity: TraitRarity | string
  is_active: boolean
}

export interface PlayerCharacteristicView {
  id: string
  room_id: string
  player_id: string
  characteristic_id: string
  category: CharacteristicCategory
  is_revealed: boolean
  revealed_round: number | null
  revealed_at: string | null
  /** player | action | system — only player spends round quota */
  reveal_source?: 'player' | 'action' | 'system' | string
  characteristic: Characteristic
}

export type ActionEffectType =
  | 'swap_characteristic'
  | 'reroll_characteristic'
  | 'force_reveal'

export interface ActionCardInfo {
  id: string
  effect_type: ActionEffectType | string
  title: string
  description: string
}

export interface PlayerActionCardView {
  id: string
  room_id: string
  player_id: string
  action_card_id: string
  is_used: boolean
  used_at: string | null
  used_round: number | null
  action_card: ActionCardInfo
}

export interface Disaster {
  id: string
  title: string
  description: string
  is_active: boolean
}

export interface Bunker {
  id: string
  title: string
  description: string
  is_active: boolean
}

export interface Vote {
  id: string
  room_id: string
  round: number
  voter_id: string
  target_player_id: string
  created_at: string
}

export interface GameEvent {
  id: string
  room_id: string
  round: number | null
  type: string
  payload: Record<string, unknown>
  created_at: string
}

export interface RoomSnapshot {
  room: Room
  players: Player[]
  me: Player | null
  disaster: Disaster | null
  bunker: Bunker | null
  characteristics: PlayerCharacteristicView[]
  action_cards: PlayerActionCardView[]
  finish_stats: FinishStats | null
  events: GameEvent[]
  votes: Vote[]
  myVote: Vote | null
  /** Public cast count — targets stay private during voting */
  vote_progress: { cast: number; total: number }
  /** API ENABLE_MOCK_BOTS — hide mock UI when false */
  mocks_enabled: boolean
}

export interface FinishPlayerStat {
  player_id: string
  name: string
  status: PlayerStatus
  survived: boolean
  survival_chance: number
  theme_fit: number
  synergy: number
  conflict: number
  votes_against: number
  rounds_lasted: number
  rarity_power: number
  rarity_counts: Record<TraitRarity, number>
  notes: string[]
}

export interface FinishCategoryContribution {
  category: string
  team_total: number
  verdict: string
  entries: Array<{
    player_id: string
    name: string
    survived: boolean
    trait_title: string
    delta: number
  }>
}

export interface FinishCriterion {
  id: string
  label: string
  score: number
  baseline: number
  delta: number
  verdict: string
  drivers: Array<{
    player_id: string
    name: string
    trait_title: string
    delta: number
  }>
}

export interface FinishStats {
  shelter_capacity: number | null
  max_round: number
  bunker_outlook: number
  /** Disaster difficulty bar — clear if outlook ≥ threshold. */
  challenge_threshold?: number
  passed?: boolean
  bunker_verdict?: string
  disaster_title?: string | null
  highlights: string[]
  themes: string[]
  categories?: FinishCategoryContribution[]
  /** Logical readiness axes (food, health, …) — preferred for UI. */
  criteria?: FinishCriterion[]
  players: FinishPlayerStat[]
}
