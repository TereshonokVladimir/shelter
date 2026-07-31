'use client'

import { useGameTimer } from '@/hooks/use-game-timer'
import { cn } from '@/lib/utils'

interface GameTimerProps {
  phaseEndsAt: string | null | undefined
  label?: string
  subject?: string | null
  expiredHint?: string
  paused?: boolean
  highlight?: boolean
  className?: string
}

export function GameTimer({
  phaseEndsAt,
  label = 'Таймер',
  subject,
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
      <p
        className={cn(
          'mt-1 font-mono text-3xl tabular-nums leading-none',
          paused
            ? 'text-stone-300'
            : isExpired
              ? 'text-red-300'
              : urgent
                ? 'text-neon-pink'
                : 'text-amber-100',
        )}
      >
        {paused ? 'ПАУЗА' : timeLabel}
      </p>
    </div>
  )
}
