import { APP_NAME } from '@/lib/constants'
import { GameStatusBadge } from '@/components/game-status/game-status-badge'
import type { GameStatus } from '@/types/common'

interface RoomHeaderProps {
  code: string
  status: GameStatus
  round: number
  isReconnecting?: boolean
  actions?: React.ReactNode
}

export function RoomHeader({
  code,
  status,
  round,
  isReconnecting,
  actions,
}: RoomHeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-amber-900/35 bg-stone-950/80 px-4 backdrop-blur-md">
      <div className="flex min-w-0 items-center gap-4">
        <div className="min-w-0">
          <p className="font-[family-name:var(--font-display)] text-[10px] tracking-[0.28em] text-amber-500/75">
            {APP_NAME}
          </p>
          <p className="font-mono text-sm tracking-[0.2em] text-stone-100">{code}</p>
        </div>
        <GameStatusBadge status={status} round={round} />
        {isReconnecting ? (
          <span className="hidden animate-pulse text-xs text-amber-300 sm:inline">
            Переподключение…
          </span>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  )
}
