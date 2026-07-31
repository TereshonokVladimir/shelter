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

export const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export const ERROR_MESSAGES: Record<string, string> = {
  UNAUTHORIZED: 'Требуется авторизация. Обновите страницу.',
  FORBIDDEN_HOST_ONLY: 'Только ведущий может выполнить это действие.',
  FORBIDDEN_END_TURN: 'Завершить ход может только говорящий игрок или ведущий.',
  NOT_YOUR_TURN: 'Раскрывать характеристики можно только на своём ходе.',
  INVALID_NAME: 'Имя должно содержать от 2 до 24 символов.',
  NAME_TAKEN: 'Это имя уже занято в комнате. Выберите другое.',
  INVALID_MAX_PLAYERS: 'Количество игроков должно быть от 4 до 12.',
  INVALID_DISCUSSION_DURATION: 'Длительность обсуждения: 30–600 секунд.',
  INVALID_PRESENTATION_DURATION: 'Длительность выступления: 60–180 секунд.',
  INVALID_VOTING_DURATION: 'Длительность голосования: 30–180 секунд.',
  INVALID_REVEAL_DURATION: 'Длительность фазы раскрытия: 30–300 секунд.',
  INVALID_PREP_DURATION: 'Время на ознакомление: 0–180 секунд.',
  INVALID_REVEAL_STRATEGY: 'Неизвестная стратегия раскрытия.',
  INVALID_REVEAL_PLAN: 'Кастомный план: сумма по раундам должна быть 7.',
  ROOM_NOT_FOUND: 'Комната не найдена.',
  ROOM_NOT_JOINABLE: 'В эту комнату уже нельзя войти.',
  ROOM_FULL: 'В комнате нет свободных мест.',
  NOT_ENOUGH_PLAYERS: 'Нужно минимум 4 игрока для старта.',
  PLAYERS_NOT_READY: 'Не все игроки подтвердили готовность.',
  INVALID_STATUS: 'Сейчас это действие недоступно.',
  PLAYER_NOT_ACTIVE: 'Вы не можете выполнить это действие.',
  FORBIDDEN_OWN_ONLY: 'Можно раскрывать только свои характеристики.',
  REVEAL_LIMIT_REACHED: 'В этом раунде вы уже раскрыли все доступные характеристики.',
  GAME_PAUSED: 'Игра на паузе. Дождитесь возобновления.',
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
  NOT_A_MEMBER: 'Вы не участник этой комнаты.',
  MOCKS_DISABLED: 'Мок-боты отключены (ENABLE_MOCK_BOTS).',
}

export class GameException extends Error {
  constructor(public readonly code: string) {
    super(ERROR_MESSAGES[code] ?? code)
  }
}

export function calculateShelterCapacity(playerCount: number): number {
  if (playerCount < 2) return 1
  const capacity = Math.max(2, Math.ceil(playerCount / 2))
  return capacity >= playerCount ? playerCount - 1 : capacity
}

export function generateRoomCode(random = Math.random): string {
  let result = ''
  for (let i = 0; i < 6; i += 1) {
    result += ROOM_CODE_ALPHABET[Math.floor(random() * ROOM_CODE_ALPHABET.length)]
  }
  return result
}

export function normalizeRoomCode(code: string): string {
  return code.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8)
}

export function shuffle<T>(items: T[], random = Math.random): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

/** Map legacy `discussion` status to `presentation` for clients / logic. */
export function normalizeGameStatus(status: string): GameStatus {
  if (status === 'discussion') return 'presentation'
  return status as GameStatus
}

export function isPresentationStatus(status: string): boolean {
  return status === 'presentation' || status === 'discussion'
}
