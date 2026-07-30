import type { CharacteristicCategory, GameStatus } from '@/types/common'

export const APP_NAME = 'Last Shelter'

export const MIN_PLAYERS = 4
export const MAX_PLAYERS_LIMIT = 12
export const DEFAULT_MAX_PLAYERS = 8

/** Keep in sync with api/src/game/game.rules.ts */
export const REVEAL_QUOTA_BY_ROUND: Record<number, number> = {
  1: 3,
  2: 2,
  3: 2,
}

export function revealQuotaForRound(round: number): number {
  return REVEAL_QUOTA_BY_ROUND[round] ?? 0
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
  reveal: 'Раскрытие',
  presentation: 'Речь',
  discussion: 'Речь',
  voting: 'Голосование',
  vote_result: 'Результат голосования',
  finished: 'Финал',
}

export const GAME_STATUS_TRANSITIONS: Record<GameStatus, GameStatus[]> = {
  lobby: ['reveal'],
  reveal: ['presentation'],
  presentation: ['voting'],
  discussion: ['voting'],
  voting: ['vote_result', 'finished'],
  vote_result: ['reveal', 'presentation', 'voting', 'finished'],
  finished: [],
}

export const RPC_ERROR_MESSAGES: Record<string, string> = {
  UNAUTHORIZED: 'Требуется авторизация. Обновите страницу.',
  FORBIDDEN_HOST_ONLY: 'Только ведущий может выполнить это действие.',
  INVALID_NAME: 'Имя должно содержать от 2 до 24 символов.',
  INVALID_MAX_PLAYERS: 'Количество игроков должно быть от 4 до 12.',
  INVALID_DISCUSSION_DURATION: 'Длительность речи: 60–180 секунд.',
  INVALID_PRESENTATION_DURATION: 'Длительность речи: 60–180 секунд.',
  INVALID_VOTING_DURATION: 'Длительность голосования: 30–180 секунд.',
  INVALID_REVEAL_DURATION: 'Длительность раскрытия: 30–300 секунд.',
  GAME_PAUSED: 'Игра на паузе.',
  ROOM_NOT_FOUND: 'Комната не найдена.',
  ROOM_NOT_JOINABLE: 'В эту комнату уже нельзя войти.',
  ROOM_FULL: 'В комнате нет свободных мест.',
  NOT_ENOUGH_PLAYERS: 'Нужно минимум 4 игрока для старта.',
  INVALID_STATUS: 'Сейчас это действие недоступно.',
  PLAYER_NOT_ACTIVE: 'Вы не можете выполнить это действие.',
  FORBIDDEN_OWN_ONLY: 'Можно раскрывать только свои характеристики.',
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
