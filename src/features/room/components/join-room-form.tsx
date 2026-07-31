'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Field,
  FieldError,
  FieldLabel,
} from '@/components/ui/field'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { joinRoomRequest } from '@/features/room/actions/api-commands'
import {
  joinRoomSchema,
  type JoinRoomInput,
} from '@/features/room/schemas/room-schemas'
import { normalizeRoomCode } from '@/features/game/utils/game-logic'
import { ensureBrowserAuth } from '@/lib/api/client'

interface JoinRoomFormProps {
  initialCode?: string
  compact?: boolean
  onJoined?: () => void
}

export function JoinRoomForm({ initialCode = '', compact = false, onJoined }: JoinRoomFormProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<JoinRoomInput>({
    resolver: zodResolver(joinRoomSchema),
    defaultValues: {
      code: normalizeRoomCode(initialCode),
      name: '',
    },
  })

  function onSubmit(values: JoinRoomInput) {
    startTransition(async () => {
      await ensureBrowserAuth()
      const result = await joinRoomRequest(values)
      if (!result.ok || !result.data?.room.code) {
        const message = result.error ?? 'Не удалось войти'
        setError('root', { message })
        toast.error(message)
        return
      }

      if (onJoined) {
        onJoined()
        return
      }
      router.push(`/room/${result.data.room.code}`)
    })
  }

  const fields = (
    <>
      <Field data-invalid={Boolean(errors.code)} className="gap-1.5">
        <FieldLabel htmlFor="join-code">Код комнаты</FieldLabel>
        <Input
          id="join-code"
          placeholder="ABC123"
          disabled={pending}
          aria-invalid={Boolean(errors.code)}
          className="uppercase tracking-widest"
          {...register('code')}
        />
        <FieldError>{errors.code?.message}</FieldError>
      </Field>
      <Field data-invalid={Boolean(errors.name)} className="gap-1.5">
        <FieldLabel htmlFor="join-name">Отображаемое имя</FieldLabel>
        <Input
          id="join-name"
          placeholder="Ваше имя"
          maxLength={24}
          disabled={pending}
          aria-invalid={Boolean(errors.name)}
          autoComplete="nickname"
          {...register('name')}
        />
        <FieldError>{errors.name?.message}</FieldError>
      </Field>
      {errors.root?.message ? (
        <p className="text-sm text-destructive">{errors.root.message}</p>
      ) : null}
    </>
  )

  if (compact) {
    return (
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3" noValidate>
        {fields}
        <Button type="submit" disabled={pending}>
          {pending ? 'Вход…' : 'Войти'}
        </Button>
      </form>
    )
  }

  return (
    <Card className="border-border/60 bg-card/80 backdrop-blur">
      <CardHeader>
        <CardTitle>Войти в комнату</CardTitle>
        <CardDescription>Введите код и имя. Регистрация не нужна.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <CardContent className="flex flex-col gap-4">{fields}</CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? 'Вход…' : 'Присоединиться'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
