'use client'

import { EventFeed } from '@/features/game/components/event-feed'
import { ScenarioBrief } from '@/features/game/components/scenario-brief'
import { CopyRoomLink } from '@/components/copy-room-link/copy-room-link'
import { cn } from '@/lib/utils'
import type { Bunker, Disaster, GameEvent, Room } from '@/lib/api/types'

interface ContextRailProps {
  room: Room
  disaster: Disaster | null
  bunker: Bunker | null
  events: GameEvent[]
  showInvite?: boolean
  embedded?: boolean
  /** Which blocks to show when embedded in tabs */
  mode?: 'all' | 'scenario' | 'events'
}

export function ContextRail({
  room,
  disaster,
  bunker,
  events,
  showInvite = false,
  embedded = false,
  mode = 'all',
}: ContextRailProps) {
  const showScenario = mode === 'all' || mode === 'scenario'
  const showEvents = mode === 'all' || mode === 'events'

  return (
    <aside
      className={cn(
        'flex h-full min-h-0 flex-col',
        !embedded && 'border-l border-border/50 bg-stone-900/55',
      )}
    >
      <div
        className={cn(
          'scrollbar-thin flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4',
          !embedded && 'pr-4 pl-10',
        )}
      >
        {showScenario && showInvite ? (
          <section>
            <p className="mb-2 text-[11px] uppercase tracking-[0.2em] text-stone-500">
              Приглашение
            </p>
            <CopyRoomLink code={room.code} showQr compact />
          </section>
        ) : null}

        {showScenario && (disaster || bunker) ? (
          <section className="flex flex-col gap-3">
            <p className="text-[11px] uppercase tracking-[0.2em] text-stone-500">Сценарий</p>
            <ScenarioBrief
              compact
              disaster={disaster}
              bunker={bunker}
              shelterCapacity={room.shelter_capacity}
            />
          </section>
        ) : null}

        {showScenario && !disaster && !bunker && !showInvite ? (
          <p className="text-sm text-stone-500">Сценарий появится после старта игры.</p>
        ) : null}

        {showEvents ? (
          <section className="flex min-h-0 flex-1 flex-col">
            <EventFeed events={events} compact />
          </section>
        ) : null}
      </div>
    </aside>
  )
}
