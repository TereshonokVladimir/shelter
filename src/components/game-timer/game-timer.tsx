'use client'

import { useGameTimer } from '@/hooks/use-game-timer'
import { cn } from '@/lib/utils'

interface GameTimerProps {
  phaseEndsAt: string | null | undefined
  /** Short phase name, e.g. «Голосование» */
  label?: string
  /** Who/what the timer is for — shown as the main title */
  subject?: string | null
  expiredHint?: string
  paused?: boolean
  /** Emphasize when it's the current user's turn */
  highlight?: boolean
  className?: string
}

export function GameTimer({
  phaseEndsAt,
  label = 'Таймер',
  subject,
  expiredHint = 'Время вышло — фаза переключится автоматически.',
  paused = false,
  highlight = false,
  className,
}: GameTimerProps) {
  const { label: timeLabel, isExpired, remainingMs } = useGameTimer(
    paused ? null : phaseEndsAt,
  )

  if (!phaseEndsAt && !paused) return null

  const urgent = !paused && !isExpired && remainingMs > 0 && remainingMs <= 15_000

  return (
    <div
      className={cn(
        'bunker-scan min-w-[10.5rem] rounded-xl border px-4 py-3',
        highlight
          ? 'border-amber-400/70 bg-amber-900/45'
          : 'border-amber-900/45 bg-stone-950/70',
        urgent && 'bunker-timer-urgent',
        isExpired && 'border-red-500/50 bg-red-950/35',
        className,
      )}
    >
      <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-amber-200/70">
        {label}
      </p>
      {subject ? (
        <p className="mt-1 max-w-[14rem] truncate text-base font-medium text-amber-50">
          {subject}
        </p>
      ) : null}
      {paused ? (
        <>
          <p className="mt-1 font-mono text-3xl tabular-nums text-stone-300">Пауза</p>
          <p className="mt-1 text-xs text-stone-400">Таймеры остановлены у всех</p>
        </>
      ) : (
        <>
          <p
            className={cn(
              'mt-1 flex h-9 items-center font-mono text-3xl leading-none tabular-nums',
              isExpired ? 'text-red-300' : urgent ? 'text-red-200' : 'text-amber-100',
            )}
          >
            {timeLabel}
          </p>
          {isExpired ? (
            <p className="mt-2 text-xs leading-snug text-stone-300">{expiredHint}</p>
          ) : urgent ? (
            <p className="mt-2 text-xs text-red-200/80">Время на исходе</p>
          ) : null}
        </>
      )}
    </div>
  )
}
