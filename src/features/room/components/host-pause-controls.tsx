'use client'

import { useTransition } from 'react'
import { Pause, Play } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { pauseGameRequest, resumeGameRequest } from '@/features/room/actions/api-commands'
import { cn } from '@/lib/utils'

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
      variant="outline"
      disabled={pending}
      onClick={toggle}
      aria-pressed={isPaused}
      aria-label={isPaused ? 'Снять паузу' : 'Поставить на паузу'}
      className={cn(
        'h-8 min-w-[9.25rem] justify-center gap-2 px-3',
        isPaused && 'border-amber-500/55 bg-amber-950/45 text-amber-50',
      )}
    >
      {isPaused ? (
        <Play className="size-3.5 shrink-0" aria-hidden />
      ) : (
        <Pause className="size-3.5 shrink-0" aria-hidden />
      )}
      <span className="whitespace-nowrap">{isPaused ? 'Продолжить' : 'Пауза'}</span>
    </Button>
  )
}
