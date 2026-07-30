'use client'

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
  /** Current presentation speaker */
  speakingPlayerId?: string | null
}

export function PlayersRail({
  players,
  meId,
  isHost,
  onRemove,
  pending,
  capacity,
  speakingPlayerId,
}: PlayersRailProps) {
  const active = players.filter((p) => p.status === 'active').length
  const eliminated = players.filter((p) => p.status === 'eliminated').length

  return (
    <aside className="flex h-full min-h-0 flex-col border-r border-border/50 bg-stone-900/55">
      <div className="border-b border-border/30 py-3 pr-10 pl-4">
        <p className="text-[11px] uppercase tracking-[0.2em] text-stone-500">Игроки</p>
        <p className="mt-1 text-sm text-stone-200">
          {active} активных
          {capacity != null ? ` · мест ${capacity}` : null}
          {eliminated > 0 ? ` · вне ${eliminated}` : null}
        </p>
      </div>
      <ul className="scrollbar-none flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-2">
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
