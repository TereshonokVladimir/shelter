'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { runBotsRequest } from '@/features/room/actions/api-commands'

interface HostBotsButtonProps {
  roomId: string
  hasBots: boolean
  onChanged?: () => void
  label?: string
}

export function HostBotsButton({
  roomId,
  hasBots,
  onChanged,
  label = 'Ход ботов',
}: HostBotsButtonProps) {
  const [pending, startTransition] = useTransition()

  if (!hasBots) return null

  function run() {
    startTransition(async () => {
      const result = await runBotsRequest(roomId)
      if (!result.ok) {
        toast.error(result.error ?? 'Боты не смогли сделать ход')
        return
      }
      const acted = (result.data as { acted?: number } | undefined)?.acted ?? 0
      toast.success(acted > 0 ? `Боты сделали ходов: ${acted}` : 'Ботам нечего делать')
      onChanged?.()
    })
  }

  return (
    <Button type="button" variant="outline" disabled={pending} onClick={run}>
      {pending ? 'Боты ходят…' : label}
    </Button>
  )
}
