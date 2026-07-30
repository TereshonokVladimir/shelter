/**
 * DEV / QA only — strip this folder for production if mocks should never ship.
 * Gated by ENABLE_MOCK_BOTS (default: on when NODE_ENV !== 'production').
 */
export function isMockBotsEnabled(): boolean {
  const raw = process.env.ENABLE_MOCK_BOTS
  if (raw === '0' || raw === 'false' || raw === 'off') return false
  if (raw === '1' || raw === 'true' || raw === 'on') return true
  return process.env.NODE_ENV !== 'production'
}

export const BOT_NAME_PREFIX = 'Бот '

export function isBotPlayerName(name: string): boolean {
  return name.startsWith(BOT_NAME_PREFIX)
}

export const MOCK_BOT_NAMES = [
  'Бот Алекс',
  'Бот Марина',
  'Бот Игорь',
  'Бот Лена',
  'Бот Кирилл',
  'Бот Оля',
  'Бот Дима',
  'Бот Настя',
  'Бот Сергей',
  'Бот Катя',
  'Бот Паша',
] as const
