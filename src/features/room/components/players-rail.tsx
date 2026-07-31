'use client'

import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Player } from '@/lib/api/types'

interface PlayersRailProps {
  players: Player[]
  meId: string
  isHost: boolean
  onRemove?: (playerId: string) => void
  pending?: boolean
  capacity?: number | null
  speakingPlayerId?: string | null
  /** Compact panel for sheets / overlays */
  embedded?: boolean
  /** Show lobby ready badges */
  showReady?: boolean
}

export function PlayersRail({
  players,
  meId,
  isHost,
  onRemove,
  pending,
  capacity,
  speakingPlayerId,
  embedded = false,
  showReady = false,
}: PlayersRailProps) {
  const active = players.filter((p) => p.status === 'active').length
  const eliminated = players.filter((p) => p.status === 'eliminated').length

  return (
    <aside
      className={cn(
        'flex h-full min-h-0 flex-col',
        !embedded && 'border-r border-border/50 bg-stone-900/55',
      )}
    >
      <div className={cn('border-b border-border/30 px-4 py-3', !embedded && 'pr-10')}>
        <p className="text-[11px] uppercase tracking-[0.2em] text-stone-500">Состав</p>
        <p className="mt-1 text-sm text-stone-200">
          {active} активных
          {capacity != null ? ` · мест ${capacity}` : null}
          {eliminated > 0 ? ` · вне ${eliminated}` : null}
        </p>
      </div>
      <ul className="scrollbar-thin flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto p-2">
        {players.map((player) => {
          const isMe = player.id === meId
          const isEliminated = player.status === 'eliminated'
          const isSpeaking = speakingPlayerId === player.id
          return (
            <li
              key={player.id}
              className={cn(
                'rounded-lg px-3 py-2',
                isSpeaking
                  ? 'bg-amber-900/50 ring-2 ring-amber-400/50'
                  : isMe
                    ? 'bg-amber-950/40 ring-1 ring-amber-800/40'
                    : 'hover:bg-stone-900/60',
                isEliminated && 'opacity-45',
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm text-stone-100">{player.name}</p>
                  <p className="text-[11px] text-stone-500">
                    {isSpeaking ? (
                      <span className="font-medium text-amber-200">говорит сейчас</span>
                    ) : (
                      <>
                        {player.role === 'host' ? 'ведущий' : 'игрок'}
                        {isMe ? ' · вы' : ''}
                        {isEliminated ? ' · исключён' : ''}
                        {showReady && !isEliminated
                          ? player.is_ready
                            ? ' · готов'
                            : ' · ждёт'
                          : ''}
                      </>
                    )}
                  </p>
                </div>
                {isHost && player.role !== 'host' && onRemove && !isEliminated ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    disabled={pending}
                    onClick={() => onRemove(player.id)}
                  >
                    ×
                  </Button>
                ) : null}
              </div>
            </li>
          )
        })}
      </ul>
    </aside>
  )
}

/** Compact speaking indicator for the main phase header (mobile/desktop). */
export function SpeakingChip({
  name,
  isYou,
}: {
  name: string
  isYou?: boolean
}): ReactNode {
  return (
    <span className="inline-flex max-w-[12rem] items-center truncate rounded-md border border-amber-500/40 bg-amber-950/50 px-2 py-0.5 text-xs text-amber-100">
      {isYou ? 'Ваш ход' : name}
    </span>
  )
}
