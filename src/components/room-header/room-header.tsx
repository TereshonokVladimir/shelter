import { APP_NAME } from '@/lib/constants'
import { GameStatusBadge } from '@/components/game-status/game-status-badge'
import { cn } from '@/lib/utils'
import type { GameStatus } from '@/types/common'

interface RoomHeaderProps {
  code: string
  status: GameStatus
  round: number
  isReconnecting?: boolean
  isPaused?: boolean
  actions?: React.ReactNode
}

export function RoomHeader({
  code,
  status,
  round,
  isReconnecting,
  isPaused,
  actions,
}: RoomHeaderProps) {
  return (
    <header className="relative flex h-12 shrink-0 items-center justify-between gap-2 border-b border-amber-900/35 bg-stone-950/80 px-2 backdrop-blur-md sm:h-14 sm:gap-4 sm:px-4">
      <div
        className={cn(
          'bunker-hazard-stripe-soft pointer-events-none absolute inset-x-0 bottom-0 h-0.5 transition-opacity duration-200',
          isPaused ? 'opacity-90' : 'opacity-0',
        )}
        aria-hidden
      />
      <div className="flex min-w-0 items-center gap-2 sm:gap-4">
        <div className="min-w-0">
          <p className="font-[family-name:var(--font-display)] text-[9px] tracking-[0.28em] text-amber-500/75 sm:text-[10px]">
            {APP_NAME}
          </p>
          <p className="font-mono text-xs tracking-[0.16em] text-neon-cyan sm:text-sm sm:tracking-[0.2em]">
            {code}
          </p>
        </div>
        <GameStatusBadge status={status} round={round} />
        <span className="inline-flex h-6 w-[5.75rem] shrink-0 items-center">
          <span
            className={cn(
              'rounded border px-1.5 py-0.5 font-mono text-[10px] tracking-wider uppercase transition-opacity',
              isPaused
                ? 'border-amber-700/50 bg-amber-950/55 text-amber-100 opacity-100'
                : 'pointer-events-none border-transparent opacity-0',
            )}
            aria-hidden={!isPaused}
          >
            Пауза
          </span>
          {!isPaused && isReconnecting ? (
            <span className="absolute animate-pulse text-xs text-amber-300 sm:static">
              Переподключение…
            </span>
          ) : null}
        </span>
      </div>
      {actions ? <div className="flex min-w-0 shrink-0 items-center gap-1 sm:gap-2">{actions}</div> : null}
    </header>
  )
}
