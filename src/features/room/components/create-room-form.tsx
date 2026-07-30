'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
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
import { createRoomRequest, listPackagesRequest } from '@/features/room/actions/api-commands'
import {
  MAX_PLAYERS_LIMIT,
  MAX_PRESENTATION_SEC,
  MAX_REVEAL_SEC,
  MAX_VOTING_SEC,
  MIN_PLAYERS,
  MIN_PRESENTATION_SEC,
  MIN_REVEAL_SEC,
  MIN_VOTING_SEC,
} from '@/lib/constants'
import {
  createRoomDefaults,
  createRoomSchema,
  type CreateRoomInput,
} from '@/features/room/schemas/room-schemas'
import { ensureBrowserAuth } from '@/lib/api/client'
import type { ContentPackageSummary } from '@/lib/api/types'

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
    formState: { errors },
  } = form

  return (
    <Card className="border-border/60 bg-card/80 backdrop-blur">
      <CardHeader>
        <CardTitle>Создать комнату</CardTitle>
        <CardDescription>
          Вы станете ведущим. Игроки зайдут по коду или ссылке — без регистрации.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <CardContent className="flex flex-col gap-1">
          <FieldGroup>
            <Field data-invalid={Boolean(errors.name)}>
              <FieldLabel htmlFor="name">Ваше имя</FieldLabel>
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

            <Field data-invalid={Boolean(errors.packageId)}>
              <FieldLabel>Пакет контента</FieldLabel>
              <Controller
                control={control}
                name="packageId"
                render={({ field }) => (
                  <Select
                    value={field.value || null}
                    onValueChange={(value) => field.onChange(value ?? '')}
                    disabled={pending || packages.length === 0}
                  >
                    <SelectTrigger className="w-full" aria-invalid={Boolean(errors.packageId)}>
                      <SelectValue placeholder="Выберите пакет" />
                    </SelectTrigger>
                    <SelectContent>
                      {packages.map((pack) => (
                        <SelectItem key={pack.id} value={pack.id}>
                          {pack.title} · {RATING_LABELS[pack.rating] ?? pack.rating}
                          {pack.topic !== pack.slug ? ` · ${pack.topic}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldDescription>
                Тема и уровень цензуры: классика, мемы, 18+ и свои пакеты из админки.
              </FieldDescription>
              <FieldError>{errors.packageId?.message}</FieldError>
            </Field>

            <Field data-invalid={Boolean(errors.maxPlayers)}>
              <FieldLabel htmlFor="maxPlayers">
                Максимум игроков ({MIN_PLAYERS}–{MAX_PLAYERS_LIMIT})
              </FieldLabel>
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
                  />
                )}
              />
              <FieldError>{errors.maxPlayers?.message}</FieldError>
            </Field>

            <Field data-invalid={Boolean(errors.presentationDurationSec)}>
              <FieldLabel htmlFor="presentationDurationSec">
                Речь одного игрока ({MIN_PRESENTATION_SEC}–{MAX_PRESENTATION_SEC})
              </FieldLabel>
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
                  />
                )}
              />
              <FieldError>{errors.presentationDurationSec?.message}</FieldError>
            </Field>

            <Field data-invalid={Boolean(errors.votingDurationSec)}>
              <FieldLabel htmlFor="votingDurationSec">
                Голосование ({MIN_VOTING_SEC}–{MAX_VOTING_SEC})
              </FieldLabel>
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
                  />
                )}
              />
              <FieldError>{errors.votingDurationSec?.message}</FieldError>
            </Field>

            <Field data-invalid={Boolean(errors.revealDurationSec)}>
              <FieldLabel htmlFor="revealDurationSec">
                Раскрытие раунда ({MIN_REVEAL_SEC}–{MAX_REVEAL_SEC})
              </FieldLabel>
              <Controller
                control={control}
                name="revealDurationSec"
                render={({ field }) => (
                  <NumberStepper
                    id="revealDurationSec"
                    value={field.value}
                    onChange={field.onChange}
                    min={MIN_REVEAL_SEC}
                    max={MAX_REVEAL_SEC}
                    step={10}
                    disabled={pending}
                    aria-invalid={Boolean(errors.revealDurationSec)}
                    suffix="сек"
                  />
                )}
              />
              <FieldError>{errors.revealDurationSec?.message}</FieldError>
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? 'Создание…' : 'Создать и перейти в комнату'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
