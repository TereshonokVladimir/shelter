import type { CharacteristicCategory, GameStatus } from '@/types/common'

export const APP_NAME = 'Last Shelter'

export const MIN_PLAYERS = 4
export const MAX_PLAYERS_LIMIT = 12
export const DEFAULT_MAX_PLAYERS = 8

/** Keep in sync with api/src/game/game.rules.ts */
export type RevealStrategyId = 'classic' | 'slow' | 'custom'

export const TOTAL_VOLUNTARY_REVEALS = 7

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

export const DEFAULT_REVEAL_STRATEGY: RevealStrategyId = 'classic'

/** @deprecated illustrative only */
export const REVEAL_QUOTA_BY_ROUND: Record<number, number> = {
  1: 3,
  2: 2,
  3: 2,
}

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

export function normalizeRevealStrategy(
  value: string | null | undefined,
): RevealStrategyId {
  if (value === 'slow' || value === 'custom' || value === 'classic') return value
  if (value === 'sprint') return 'classic'
  return 'classic'
}

export function distributeRevealQuotas(
  rounds: number,
  strategy: RevealStrategyId | string = DEFAULT_REVEAL_STRATEGY,
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

  // classic
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
  strategy: RevealStrategyId | string = DEFAULT_REVEAL_STRATEGY,
  plannedRounds?: number | null,
  customPlan?: number[] | null,
): number {
  if (round < 1) return 0
  const rounds = plannedRounds && plannedRounds > 0 ? plannedRounds : 3
  if (customPlan && customPlan.length === rounds) {
    return Math.max(0, Math.floor(customPlan[round - 1] ?? 0))
  }
  const quotas = distributeRevealQuotas(rounds, strategy, TOTAL_VOLUNTARY_REVEALS, customPlan)
  return quotas[round - 1] ?? 0
}

/** Always 1 while active > capacity. */
export function eliminationsThisRound(input: {
  activeCount: number
  shelterCapacity: number
  currentRound?: number
  strategy?: RevealStrategyId | string | null
}): number {
  const remaining = input.activeCount - input.shelterCapacity
  if (remaining <= 0) return 0
  return 1
}

export function pickEliminations(
  tallies: Array<{ playerId: string; votes: number }>,
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
    (a, b) => b.votes - a.votes || a.playerId.localeCompare(b.playerId),
  )
  const eliminateIds: string[] = []
  let i = 0

  while (eliminateIds.length < seats && i < sorted.length) {
    const bandVotes = sorted[i].votes
    const band: string[] = []
    while (i < sorted.length && sorted[i].votes === bandVotes) {
      band.push(sorted[i].playerId)
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

export const ALWAYS_HIDDEN_COUNT = 1

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

/** @deprecated use presentation */
export const MIN_DISCUSSION_SEC = MIN_PRESENTATION_SEC
export const MAX_DISCUSSION_SEC = MAX_PRESENTATION_SEC
export const DEFAULT_DISCUSSION_SEC = DEFAULT_PRESENTATION_SEC

export const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
export const ROOM_CODE_LENGTH = 6

export const CHARACTERISTIC_CATEGORIES: CharacteristicCategory[] = [
  'profession',
  'biology',
  'health',
  'hobby',
  'phobia',
  'baggage',
  'personality',
  'fact',
]

export const CATEGORY_LABELS: Record<CharacteristicCategory, string> = {
  profession: 'Профессия',
  biology: 'Биология',
  health: 'Здоровье',
  hobby: 'Хобби',
  phobia: 'Фобия',
  baggage: 'Багаж',
  personality: 'Характер',
  fact: 'Факт',
}

export const STATUS_LABELS: Record<GameStatus, string> = {
  lobby: 'Лобби',
  prep: 'Ознакомление',
  reveal: 'Раскрытие',
  presentation: 'Ход',
  discussion: 'Ход',
  voting: 'Голосование',
  vote_result: 'Результат голосования',
  finished: 'Финал',
}

export const GAME_STATUS_TRANSITIONS: Record<GameStatus, GameStatus[]> = {
  lobby: ['prep', 'presentation', 'reveal'],
  prep: ['presentation'],
  reveal: ['presentation'],
  presentation: ['voting'],
  discussion: ['voting'],
  voting: ['vote_result', 'finished'],
  vote_result: ['prep', 'reveal', 'presentation', 'voting', 'finished'],
  finished: [],
}

export const RPC_ERROR_MESSAGES: Record<string, string> = {
  UNAUTHORIZED: 'Требуется авторизация. Обновите страницу.',
  FORBIDDEN_HOST_ONLY: 'Только ведущий может выполнить это действие.',
  FORBIDDEN_END_TURN: 'Завершить ход может только говорящий игрок или ведущий.',
  INVALID_NAME: 'Имя должно содержать от 2 до 24 символов.',
  INVALID_MAX_PLAYERS: 'Количество игроков должно быть от 4 до 12.',
  INVALID_DISCUSSION_DURATION: 'Длительность речи: 60–180 секунд.',
  INVALID_PRESENTATION_DURATION: 'Длительность речи: 60–180 секунд.',
  INVALID_VOTING_DURATION: 'Длительность голосования: 30–180 секунд.',
  INVALID_REVEAL_DURATION: 'Длительность раскрытия: 30–300 секунд.',
  INVALID_PREP_DURATION: 'Время на ознакомление: 0–180 секунд.',
  INVALID_REVEAL_STRATEGY: 'Неизвестная стратегия раскрытия.',
  INVALID_REVEAL_PLAN: 'Кастомный план: сумма по раундам должна быть 7.',
  GAME_PAUSED: 'Игра на паузе.',
  ROOM_NOT_FOUND: 'Комната не найдена.',
  ROOM_NOT_JOINABLE: 'В эту комнату уже нельзя войти.',
  ROOM_FULL: 'В комнате нет свободных мест.',
  NOT_ENOUGH_PLAYERS: 'Нужно минимум 4 игрока для старта.',
  INVALID_STATUS: 'Сейчас это действие недоступно.',
  PLAYER_NOT_ACTIVE: 'Вы не можете выполнить это действие.',
  FORBIDDEN_OWN_ONLY: 'Можно раскрывать только свои характеристики.',
  NOT_YOUR_TURN: 'Раскрывать характеристики можно только на своём ходе.',
  REVEAL_LIMIT_REACHED: 'В этом раунде лимит раскрытий исчерпан.',
  CANNOT_VOTE_SELF: 'Нельзя голосовать за себя.',
  INVALID_TARGET: 'Недопустимая цель голосования.',
  VOTING_INCOMPLETE: 'Ещё не все игроки проголосовали.',
  TIE_REQUIRES_REVOTE: 'Нужно провести повторное голосование.',
  CONTENT_MISSING: 'Не хватает игрового контента. Заполните seed.',
  NOT_ENOUGH_CHARACTERISTICS: 'Недостаточно уникальных характеристик.',
  NOT_ENOUGH_ACTIONS: 'Недостаточно карточек действий в пакете.',
  ACTION_ALREADY_USED: 'Карточка действия уже использована.',
  ACTION_INVALID: 'Нельзя использовать эту карточку сейчас.',
  CANNOT_REMOVE_HOST: 'Нельзя удалить ведущего.',
  PLAYER_NOT_FOUND: 'Игрок не найден.',
  MOCKS_DISABLED: 'Мок-боты отключены.',
}
