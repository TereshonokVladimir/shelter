'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Field,
  FieldDescription,
  FieldError,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { NumberStepper } from '@/components/form/number-stepper'
import {
  LabelWithHint,
  SectionHint,
} from '@/components/form/label-with-hint'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { createRoomRequest, listPackagesRequest } from '@/features/room/actions/api-commands'
import {
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
  normalizeCustomRevealPlan,
  plannedVotingRounds,
  type RevealStrategyId,
} from '@/lib/constants'
import { calculateShelterCapacity } from '@/features/game/utils/game-logic'
import {
  createRoomDefaults,
  createRoomSchema,
  type CreateRoomInput,
} from '@/features/room/schemas/room-schemas'
import { ensureBrowserAuth } from '@/lib/api/client'
import type { ContentPackageSummary } from '@/lib/api/types'
import { cn } from '@/lib/utils'

const RATING_LABELS: Record<string, string> = {
  everyone: '0+',
  teen: '13+',
  mature: '16+',
  explicit: '18+',
}

export function CreateRoomForm() {
  const router = useRouter()
  const [packages, setPackages] = useState<ContentPackageSummary[]>([])
  const [pending, startTransition] = useTransition()

  const form = useForm<CreateRoomInput>({
    resolver: zodResolver(createRoomSchema),
    defaultValues: createRoomDefaults,
  })

  useEffect(() => {
    void (async () => {
      await ensureBrowserAuth()
      const result = await listPackagesRequest()
      if (!result.ok || !result.data?.length) return
      setPackages(result.data)
      const classic = result.data.find((p) => p.slug === 'classic') ?? result.data[0]
      if (classic && !form.getValues('packageId')) {
        form.setValue('packageId', classic.id)
      }
    })()
  }, [form])

  function onSubmit(values: CreateRoomInput) {
    startTransition(async () => {
      await ensureBrowserAuth()
      const result = await createRoomRequest(values)
      if (!result.ok || !result.data?.room.code) {
        toast.error(result.error ?? 'Не удалось создать комнату')
        return
      }
      router.push(`/room/${result.data.room.code}`)
    })
  }

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = form

  const strategyId = useWatch({ control, name: 'revealStrategy' }) as RevealStrategyId
  const maxPlayersPreview = useWatch({ control, name: 'maxPlayers' })
  const revealQuotas = useWatch({ control, name: 'revealQuotas' }) ?? []
  const capacityPreview = calculateShelterCapacity(maxPlayersPreview)
  const roundsPreview = plannedVotingRounds(maxPlayersPreview, capacityPreview)
  const planPreview =
    strategyId === 'custom'
      ? revealQuotas
      : distributeRevealQuotas(roundsPreview, strategyId)
  const customSum = revealQuotas.reduce((a, b) => a + b, 0)
  const customSumOk = customSum === TOTAL_VOLUNTARY_REVEALS

  useEffect(() => {
    const current = form.getValues('revealQuotas') ?? []
    const next =
      strategyId === 'custom'
        ? normalizeCustomRevealPlan(current, roundsPreview)
        : distributeRevealQuotas(roundsPreview, strategyId)
    const same =
      next.length === current.length && next.every((n, i) => n === current[i])
    if (!same) {
      setValue('revealQuotas', next, { shouldValidate: strategyId === 'custom' })
    }
  }, [roundsPreview, strategyId, setValue, form])

  return (
    <div className="bunker-panel overflow-hidden">
      <div className="bunker-hazard-stripe h-1.5 shrink-0" aria-hidden />

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="relative z-[1] flex flex-col gap-5 p-4 sm:p-5"
      >
        <header className="flex flex-col gap-0.5">
          <p className="bunker-label">Новый протокол</p>
          <h2 className="font-[family-name:var(--font-display)] text-xl tracking-wide text-stone-50">
            Создать комнату
          </h2>
        </header>

        {/* Identity + lobby */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field data-invalid={Boolean(errors.name)} className="gap-1.5">
            <LabelWithHint
              htmlFor="name"
              label="Ваше имя"
              hint="Как вас увидят остальные в лобби и в игре. Вы станете ведущим комнаты."
              limits="2–24 символа"
            />
            <Input
              id="name"
              placeholder="Например, Алекс"
              maxLength={24}
              disabled={pending}
              aria-invalid={Boolean(errors.name)}
              {...register('name')}
            />
            <FieldError>{errors.name?.message}</FieldError>
          </Field>

          <Field data-invalid={Boolean(errors.maxPlayers)} className="gap-1.5">
            <LabelWithHint
              htmlFor="maxPlayers"
              label="Игроков макс."
              hint="Лимит мест в комнате. От размера лобби считаются места в бункере и число раундов голосования."
              limits={`${MIN_PLAYERS}–${MAX_PLAYERS_LIMIT} чел.`}
            />
            <Controller
              control={control}
              name="maxPlayers"
              render={({ field }) => (
                <NumberStepper
                  id="maxPlayers"
                  value={field.value}
                  onChange={field.onChange}
                  min={MIN_PLAYERS}
                  max={MAX_PLAYERS_LIMIT}
                  disabled={pending}
                  aria-invalid={Boolean(errors.maxPlayers)}
                  suffix="чел."
                  className="w-full"
                />
              )}
            />
            <FieldDescription>
              ≈{capacityPreview} мест · {roundsPreview} голосований
            </FieldDescription>
            <FieldError>{errors.maxPlayers?.message}</FieldError>
          </Field>

          <Field
            data-invalid={Boolean(errors.packageId)}
            className="gap-1.5 sm:col-span-2 lg:col-span-1"
          >
            <LabelWithHint
              label="Пакет контента"
              hint="Набор катастроф, бункеров и характеристик для раздачи. Рейтинг пакета задаёт возрастной тон текстов."
              limits="обязательно · один пакет на комнату"
            />
            <Controller
              control={control}
              name="packageId"
              render={({ field }) => {
                const packageItems = Object.fromEntries(
                  packages.map((pack) => [
                    pack.id,
                    `${pack.title} · ${RATING_LABELS[pack.rating] ?? pack.rating}`,
                  ]),
                )
                return (
                  <Select
                    value={field.value || null}
                    onValueChange={(value) => field.onChange(value ?? '')}
                    disabled={pending || packages.length === 0}
                    items={packageItems}
                  >
                    <SelectTrigger aria-invalid={Boolean(errors.packageId)}>
                      <SelectValue placeholder="Выберите пакет" />
                    </SelectTrigger>
                    <SelectContent>
                      {packages.map((pack) => (
                        <SelectItem key={pack.id} value={pack.id}>
                          {packageItems[pack.id]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )
              }}
            />
            <FieldError>{errors.packageId?.message}</FieldError>
          </Field>
        </div>

        {/* Strategy */}
        <div className="flex flex-col gap-2">
          <SectionHint
            label="Стратегия раскрытия"
            hint="Сколько характеристик каждый игрок обязан раскрыть за раунд. Справа — план квот по раундам для текущего размера лобби."
            limits={`${TOTAL_VOLUNTARY_REVEALS} раскрытий на игрока за всю игру`}
            trailing={
              <p className="font-mono text-[11px] text-amber-200/75">
                {planPreview.join(' → ')}
              </p>
            }
          />
          <Controller
            control={control}
            name="revealStrategy"
            render={({ field }) => (
              <ToggleGroup
                value={[field.value]}
                onValueChange={(values) => {
                  const next = values[0] as RevealStrategyId | undefined
                  if (!next) return
                  field.onChange(next)
                  if (next === 'custom') {
                    setValue(
                      'revealQuotas',
                      distributeRevealQuotas(roundsPreview, 'classic'),
                      { shouldValidate: true },
                    )
                  }
                }}
                disabled={pending}
                spacing={2}
                className="!grid w-full grid-cols-3 !gap-2"
                aria-invalid={Boolean(errors.revealStrategy)}
              >
                {(Object.keys(REVEAL_STRATEGIES) as RevealStrategyId[]).map((id) => {
                  const option = REVEAL_STRATEGIES[id]
                  return (
                    <ToggleGroupItem
                      key={id}
                      value={id}
                      aria-label={option.label}
                      className={cn(
                        'h-auto min-h-0 w-full flex-col items-start justify-center gap-0.5 rounded-md border px-2.5 py-2 text-left whitespace-normal',
                        'border-amber-900/40 bg-stone-950/55 text-stone-200 hover:bg-amber-950/30 hover:text-amber-50',
                        'aria-pressed:border-amber-500/60 aria-pressed:bg-amber-950/50 aria-pressed:text-amber-50',
                        'data-[pressed]:border-amber-500/60 data-[pressed]:bg-amber-950/50 data-[pressed]:text-amber-50',
                      )}
                    >
                      <span className="text-sm font-medium leading-none">{option.label}</span>
                      <span className="text-[10px] leading-tight text-stone-500 aria-pressed:text-amber-100/65">
                        {option.description}
                      </span>
                    </ToggleGroupItem>
                  )
                })}
              </ToggleGroup>
            )}
          />
          <FieldError>{errors.revealStrategy?.message}</FieldError>

          {strategyId === 'custom' ? (
            <div className="flex flex-col gap-2 rounded-md border border-amber-900/35 bg-stone-950/40 p-3">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-xs text-stone-400">
                  Квота на каждый раунд голосования
                </p>
                <p
                  className={cn(
                    'font-mono text-[11px]',
                    customSumOk ? 'text-amber-200/80' : 'text-rose-300/90',
                  )}
                >
                  Σ {customSum}/{TOTAL_VOLUNTARY_REVEALS}
                </p>
              </div>
              <div
                className={cn(
                  'grid gap-2',
                  roundsPreview <= 3
                    ? 'grid-cols-2 sm:grid-cols-3'
                    : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
                )}
              >
                {Array.from({ length: roundsPreview }, (_, index) => (
                  <Field
                    key={`quota-${roundsPreview}-${index}`}
                    data-invalid={Boolean(errors.revealQuotas)}
                    className="gap-1"
                  >
                    <LabelWithHint
                      htmlFor={`revealQuota-${index}`}
                      label={`Раунд ${index + 1}`}
                      hint="Сколько характеристик каждый активный игрок должен раскрыть в этом раунде."
                      limits={`0–${TOTAL_VOLUNTARY_REVEALS}`}
                    />
                    <Controller
                      control={control}
                      name={`revealQuotas.${index}`}
                      render={({ field }) => (
                        <NumberStepper
                          id={`revealQuota-${index}`}
                          value={field.value ?? 0}
                          onChange={field.onChange}
                          min={0}
                          max={TOTAL_VOLUNTARY_REVEALS}
                          disabled={pending}
                          aria-invalid={Boolean(errors.revealQuotas)}
                          className="w-full"
                        />
                      )}
                    />
                  </Field>
                ))}
              </div>
              <FieldError>{errors.revealQuotas?.message}</FieldError>
            </div>
          ) : null}
        </div>

        {/* Timers */}
        <div className="flex flex-col gap-2">
          <p className="bunker-label">Таймеры</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field data-invalid={Boolean(errors.prepDurationSec)} className="gap-1.5">
              <LabelWithHint
                htmlFor="prepDurationSec"
                label="Ознакомление"
                hint="Пауза в начале: игроки смотрят свои карты до первых ходов. 0 — фаза пропускается."
                limits={`${MIN_PREP_SEC}–${MAX_PREP_SEC} сек`}
              />
              <Controller
                control={control}
                name="prepDurationSec"
                render={({ field }) => (
                  <NumberStepper
                    id="prepDurationSec"
                    value={field.value}
                    onChange={field.onChange}
                    min={MIN_PREP_SEC}
                    max={MAX_PREP_SEC}
                    step={10}
                    disabled={pending}
                    aria-invalid={Boolean(errors.prepDurationSec)}
                    suffix="сек"
                    className="w-full"
                  />
                )}
              />
              <FieldError>{errors.prepDurationSec?.message}</FieldError>
            </Field>

            <Field data-invalid={Boolean(errors.presentationDurationSec)} className="gap-1.5">
              <LabelWithHint
                htmlFor="presentationDurationSec"
                label="Ход игрока"
                hint="Сколько секунд у текущего говорящего на речь и раскрытие характеристик в свой ход."
                limits={`${MIN_PRESENTATION_SEC}–${MAX_PRESENTATION_SEC} сек`}
              />
              <Controller
                control={control}
                name="presentationDurationSec"
                render={({ field }) => (
                  <NumberStepper
                    id="presentationDurationSec"
                    value={field.value}
                    onChange={field.onChange}
                    min={MIN_PRESENTATION_SEC}
                    max={MAX_PRESENTATION_SEC}
                    step={10}
                    disabled={pending}
                    aria-invalid={Boolean(errors.presentationDurationSec)}
                    suffix="сек"
                    className="w-full"
                  />
                )}
              />
              <FieldError>{errors.presentationDurationSec?.message}</FieldError>
            </Field>

            <Field data-invalid={Boolean(errors.votingDurationSec)} className="gap-1.5">
              <LabelWithHint
                htmlFor="votingDurationSec"
                label="Голосование"
                hint="Время на выбор, кого исключить. Когда все проголосовали, фаза может завершиться раньше."
                limits={`${MIN_VOTING_SEC}–${MAX_VOTING_SEC} сек`}
              />
              <Controller
                control={control}
                name="votingDurationSec"
                render={({ field }) => (
                  <NumberStepper
                    id="votingDurationSec"
                    value={field.value}
                    onChange={field.onChange}
                    min={MIN_VOTING_SEC}
                    max={MAX_VOTING_SEC}
                    step={10}
                    disabled={pending}
                    aria-invalid={Boolean(errors.votingDurationSec)}
                    suffix="сек"
                    className="w-full"
                  />
                )}
              />
              <FieldError>{errors.votingDurationSec?.message}</FieldError>
            </Field>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-amber-900/30 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-stone-500">
            Код комнаты появится после создания · без регистрации
          </p>
          <Button type="submit" size="lg" className="w-full sm:w-auto sm:min-w-52" disabled={pending}>
            {pending ? 'Создание…' : 'Создать комнату'}
          </Button>
        </div>
      </form>
    </div>
  )
}
