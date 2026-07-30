import { STATUS_LABELS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { GameStatus } from '@/types/common'

interface GameStatusBadgeProps {
  status: GameStatus
  round?: number
}

const STATUS_TONE: Partial<Record<GameStatus, string>> = {
  lobby: 'border-stone-600/60 bg-stone-900/70 text-stone-200',
  reveal: 'border-amber-600/50 bg-amber-950/60 text-amber-100',
  presentation: 'border-orange-600/50 bg-orange-950/55 text-orange-100',
  discussion: 'border-orange-600/50 bg-orange-950/55 text-orange-100',
  voting: 'border-rose-600/50 bg-rose-950/55 text-rose-100',
  vote_result: 'border-stone-500/50 bg-stone-900/70 text-stone-200',
  finished: 'border-lime-700/45 bg-lime-950/45 text-lime-100',
}

export function GameStatusBadge({ status, round }: GameStatusBadgeProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span
        className={cn(
          'rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]',
          STATUS_TONE[status] ?? STATUS_TONE.lobby,
        )}
      >
        {STATUS_LABELS[status]}
      </span>
      {round && status !== 'lobby' ? (
        <span className="rounded-md border border-stone-600/50 bg-stone-950/60 px-2 py-0.5 font-mono text-[10px] tracking-wider text-stone-300">
          R{round}
        </span>
      ) : null}
    </div>
  )
}
