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

export interface ActionResult<T = unknown> {
  ok: boolean
  data?: T
  error?: string
}
