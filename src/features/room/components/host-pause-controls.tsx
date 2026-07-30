'use client'

import { useTransition } from 'react'
import { Pause, Play } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { pauseGameRequest, resumeGameRequest } from '@/features/room/actions/api-commands'

interface HostPauseControlsProps {
  roomId: string
  isPaused: boolean
  onChanged?: () => void
}

export function HostPauseControls({ roomId, isPaused, onChanged }: HostPauseControlsProps) {
  const [pending, startTransition] = useTransition()

  function toggle() {
    startTransition(async () => {
      const result = isPaused
        ? await resumeGameRequest(roomId)
        : await pauseGameRequest(roomId)
      if (!result.ok) toast.error(result.error ?? 'Не удалось изменить паузу')
      else onChanged?.()
    })
  }

  return (
    <Button
      type="button"
      size="sm"
      variant={isPaused ? 'default' : 'outline'}
      disabled={pending}
      onClick={toggle}
      className="gap-1.5"
    >
      {isPaused ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}
      {isPaused ? 'Продолжить' : 'Пауза'}
    </Button>
  )
}
