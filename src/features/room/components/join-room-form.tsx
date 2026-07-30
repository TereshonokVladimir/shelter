'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { joinRoomRequest } from '@/features/room/actions/api-commands'
import { joinRoomSchema } from '@/features/room/schemas/room-schemas'
import { normalizeRoomCode } from '@/features/game/utils/game-logic'
import { ensureBrowserAuth } from '@/lib/api/client'

interface JoinRoomFormProps {
  initialCode?: string
  compact?: boolean
  onJoined?: () => void
}

export function JoinRoomForm({ initialCode = '', compact = false, onJoined }: JoinRoomFormProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function onSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      await ensureBrowserAuth()
      const parsed = joinRoomSchema.safeParse({
        code: formData.get('code'),
        name: formData.get('name'),
      })
      if (!parsed.success) {
        const message = parsed.error.issues[0]?.message ?? 'Некорректные данные'
        setError(message)
        toast.error(message)
        return
      }

      const result = await joinRoomRequest(parsed.data)
      if (!result.ok || !result.data?.room.code) {
        setError(result.error ?? 'Не удалось войти')
        toast.error(result.error ?? 'Не удалось войти')
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
      <div className="flex flex-col gap-2">
        <Label htmlFor="code">Код комнаты</Label>
        <Input
          id="code"
          name="code"
          placeholder="ABC123"
          defaultValue={normalizeRoomCode(initialCode)}
          required
          disabled={pending}
          className="uppercase tracking-widest"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Отображаемое имя</Label>
        <Input id="name" name="name" placeholder="Ваше имя" minLength={2} maxLength={24} required disabled={pending} />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </>
  )

  if (compact) {
    return (
      <form action={onSubmit} className="flex flex-col gap-3">
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
      <form action={onSubmit}>
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
