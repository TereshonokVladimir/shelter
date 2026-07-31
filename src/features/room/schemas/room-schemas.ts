import { z } from 'zod'
import {
  DEFAULT_MAX_PLAYERS,
  DEFAULT_PRESENTATION_SEC,
  DEFAULT_PREP_SEC,
  DEFAULT_REVEAL_STRATEGY,
  DEFAULT_VOTING_SEC,
  MAX_PLAYERS_LIMIT,
  MAX_PRESENTATION_SEC,
  MAX_PREP_SEC,
  MAX_VOTING_SEC,
  MIN_PLAYERS,
  MIN_PRESENTATION_SEC,
  MIN_PREP_SEC,
  MIN_VOTING_SEC,
  REVEAL_STRATEGIES,
  TOTAL_VOLUNTARY_REVEALS,
  distributeRevealQuotas,
  isValidCustomRevealPlan,
  plannedVotingRounds,
  type RevealStrategyId,
} from '@/lib/constants'
import {
  calculateShelterCapacity,
  normalizeRoomCode,
} from '@/features/game/utils/game-logic'

export const playerNameSchema = z
  .string()
  .trim()
  .min(2, 'Имя: минимум 2 символа')
  .max(24, 'Имя: максимум 24 символа')

export const roomCodeSchema = z
  .string()
  .trim()
  .transform(normalizeRoomCode)
  .refine((code) => code.length >= 4 && code.length <= 8, 'Код комнаты: 4–8 символов')
  .refine((code) => /^[A-Z0-9]+$/.test(code), 'Код может содержать только латиницу и цифры')

const revealStrategyIds = Object.keys(REVEAL_STRATEGIES) as [
  RevealStrategyId,
  ...RevealStrategyId[],
]

export const createRoomSchema = z
  .object({
    name: playerNameSchema,
    maxPlayers: z
      .number()
      .int()
      .min(MIN_PLAYERS, `Минимум ${MIN_PLAYERS} игроков`)
      .max(MAX_PLAYERS_LIMIT, `Максимум ${MAX_PLAYERS_LIMIT} игроков`),
    presentationDurationSec: z
      .number()
      .int()
      .min(MIN_PRESENTATION_SEC, `Минимум ${MIN_PRESENTATION_SEC} сек`)
      .max(MAX_PRESENTATION_SEC, `Максимум ${MAX_PRESENTATION_SEC} сек`),
    votingDurationSec: z
      .number()
      .int()
      .min(MIN_VOTING_SEC, `Минимум ${MIN_VOTING_SEC} сек`)
      .max(MAX_VOTING_SEC, `Максимум ${MAX_VOTING_SEC} сек`),
    prepDurationSec: z
      .number()
      .int()
      .min(MIN_PREP_SEC, `Минимум ${MIN_PREP_SEC} сек`)
      .max(MAX_PREP_SEC, `Максимум ${MAX_PREP_SEC} сек`),
    revealStrategy: z.enum(revealStrategyIds),
    revealQuotas: z.array(z.number().int().min(0).max(TOTAL_VOLUNTARY_REVEALS)),
    packageId: z.string().min(1, 'Выберите пакет контента'),
  })
  .superRefine((data, ctx) => {
    if (data.revealStrategy !== 'custom') return
    const capacity = calculateShelterCapacity(data.maxPlayers)
    const rounds = plannedVotingRounds(data.maxPlayers, capacity)
    if (!isValidCustomRevealPlan(data.revealQuotas, rounds, TOTAL_VOLUNTARY_REVEALS)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['revealQuotas'],
        message: `Сумма по ${rounds} раундам должна быть ${TOTAL_VOLUNTARY_REVEALS}`,
      })
    }
  })

export const joinRoomSchema = z.object({
  code: roomCodeSchema,
  name: playerNameSchema,
})

export type CreateRoomInput = z.infer<typeof createRoomSchema>
export type JoinRoomInput = z.infer<typeof joinRoomSchema>

const defaultCapacity = calculateShelterCapacity(DEFAULT_MAX_PLAYERS)
const defaultRounds = plannedVotingRounds(DEFAULT_MAX_PLAYERS, defaultCapacity)

export const createRoomDefaults: CreateRoomInput = {
  name: '',
  maxPlayers: DEFAULT_MAX_PLAYERS,
  presentationDurationSec: DEFAULT_PRESENTATION_SEC,
  votingDurationSec: DEFAULT_VOTING_SEC,
  prepDurationSec: DEFAULT_PREP_SEC,
  revealStrategy: DEFAULT_REVEAL_STRATEGY,
  revealQuotas: distributeRevealQuotas(defaultRounds, 'classic'),
  packageId: '',
}
